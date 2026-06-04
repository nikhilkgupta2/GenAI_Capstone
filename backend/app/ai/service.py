from __future__ import annotations

import json
from collections.abc import Iterator

from fastapi import HTTPException, status
from openai import OpenAI
from sqlalchemy.orm import Session

from app.ai.memory import load_recent_history, save_conversation
from app.ai.permissions import permissions_for_role
from app.ai.prompts import (
    CLASSIFICATION_PROMPT,
    FINAL_ANSWER_PROMPT,
    INTENT_ROUTING_PROMPT,
    SYSTEM_PROMPT_TEMPLATE,
    UI_INTENT_PROMPT,
)
from app.ai.schemas import ChatResponse, ToolResult
from app.ai.sql_agent import route_tools, sanitize_message
from app.ai.tools import TOOL_REGISTRY
from app.core.config import settings
from app.models.user import User
from app.rag.service import RAGService


def _get_client() -> OpenAI:
    if settings.openai_api_key:
        return OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )
    
    # Fallback to legacy Gemini if configured but OpenAI is not
    if settings.gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Legacy Gemini support is disabled. Please configure OPENAI_API_KEY for Freemodel."
        )

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
        detail="AI is not configured: OPENAI_API_KEY is missing."
    )


def _system_prompt(user: User, current_module: str | None) -> str:
    permissions = sorted(permissions_for_role(user.role))
    return SYSTEM_PROMPT_TEMPLATE.format(
        user_role=user.role.value,
        tenant_id=str(user.tenant_id) if user.tenant_id else "platform",
        permissions=", ".join(permissions) or "none",
        current_module=current_module or "unknown",
    )


def _route_tools_semantic(client: OpenAI, message: str) -> list[str]:
    try:
        routing_prompt = INTENT_ROUTING_PROMPT.format(message=message)
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[{"role": "user", "content": routing_prompt}],
            temperature=0.0,
        )
        content = response.choices[0].message.content
        if content:
            raw = content.strip().lower()
            tool_names = [t.strip() for t in raw.split(",") if t.strip()]
            return [t for t in tool_names if t in TOOL_REGISTRY]
    except Exception:
        pass
    return []


def _detect_ui_intent(client: OpenAI, message: str) -> dict | None:
    # Use fast keyword matching instead of LLM to reduce latency
    lower_msg = message.lower()
    
    if any(k in lower_msg for k in ["product", "item", "stock", "inventory"]):
        return {"intent": "view_products", "module": "/products", "confidence": 0.9}
    if any(k in lower_msg for k in ["order", "purchase", "po"]):
        return {"intent": "view_orders", "module": "/orders", "confidence": 0.9}
    if any(k in lower_msg for k in ["supplier", "vendor"]):
        return {"intent": "view_suppliers", "module": "/suppliers", "confidence": 0.9}
    if any(k in lower_msg for k in ["warehouse", "location"]):
        return {"intent": "view_warehouses", "module": "/warehouses", "confidence": 0.9}
    if any(k in lower_msg for k in ["billing", "price", "upgrade", "plan"]):
        return {"intent": "view_billing", "module": "/upgrade", "confidence": 0.9}
    if any(k in lower_msg for k in ["audit", "activity", "log"]):
        return {"intent": "view_audit", "module": "/audit-logs", "confidence": 0.9}
        
    return None


def _collect_tools(db: Session, user: User, message: str) -> list[ToolResult]:
    results: list[ToolResult] = []
    # Use keyword-based routing (instant)
    all_tool_names = route_tools(message)
    
    for tool_name in all_tool_names:
        tool = TOOL_REGISTRY.get(tool_name)
        if tool:
            results.append(tool(db, user))
    return results


def _build_prompt(user: User, message: str, current_module: str | None, history: list[dict[str, str]], tools: list[ToolResult], context: str = "") -> str:
    tool_results = [tool.model_dump(mode="json") for tool in tools]
    tool_summary = "; ".join(f"{tool.name}: {'allowed' if tool.allowed else 'denied'}" for tool in tools)
    return FINAL_ANSWER_PROMPT.format(
        message=message,
        context=context or "No relevant documentation found.",
        tool_summary=tool_summary,
        tool_results=json.dumps(tool_results, default=str),
        history=json.dumps(history, default=str),
    )


def chat(db: Session, user: User, *, message: str, current_module: str | None = None) -> ChatResponse:
    client = _get_client()
    rag = RAGService(db)
    clean_message = sanitize_message(message)
    
    # 1. Proactively Retrieve context and check tools
    # We retrieve context for all queries that aren't pure "greetings"
    # This is fast now due to singleton embeddings
    context = ""
    rag_sources = []
    if len(clean_message.split()) > 1:
        context, retrieval_results = rag.get_context(clean_message, tenant_id=user.tenant_id)
        rag_sources = [f"Docs: {r.title}" for r in retrieval_results]

    # 2. Collect DB results
    tools = _collect_tools(db, user, clean_message)
    
    history = load_recent_history(db, user_id=user.id, tenant_id=user.tenant_id)
    system_instruction = _system_prompt(user, current_module)
    user_prompt = _build_prompt(user, clean_message, current_module, history, tools, context=context)
    
    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
        )
        answer = response.choices[0].message.content.strip() if response.choices[0].message.content else "I could not generate a response right now."
    except Exception as e:
        error_str = str(e).lower()
        if "429" in error_str:
            return ChatResponse(
                answer="**AI Quota Exceeded**\n* You have reached the limit for AI requests on Freemodel.\n* Please check your balance or try again later.",
                sources=sorted(list(set([tool.source for tool in tools if tool.allowed] + rag_sources)))
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Freemodel API error: {str(e)}"
        )
    
    ui_intent = _detect_ui_intent(client, clean_message)
    save_conversation(db, user_id=user.id, tenant_id=user.tenant_id, message=clean_message, response=answer)
    sources = sorted(list(set([tool.source for tool in tools if tool.allowed] + rag_sources)))
    return ChatResponse(answer=answer, sources=sources, ui_intent=ui_intent)


def stream_chat(db: Session, user: User, *, message: str, current_module: str | None = None) -> Iterator[bytes]:
    client = _get_client()
    rag = RAGService(db)
    clean_message = sanitize_message(message)
    
    # 1. Proactively Retrieve context if not a greet
    context = ""
    rag_sources = []
    if len(clean_message.split()) > 1:
        context, retrieval_results = rag.get_context(clean_message, tenant_id=user.tenant_id)
        rag_sources = [f"Docs: {r.title}" for r in retrieval_results]

    # 2. Collect DB results
    tools = _collect_tools(db, user, clean_message)
    
    history = load_recent_history(db, user_id=user.id, tenant_id=user.tenant_id)
    sources = sorted(list(set([tool.source for tool in tools if tool.allowed] + rag_sources)))
    
    system_instruction = _system_prompt(user, current_module)
    user_prompt = _build_prompt(user, clean_message, current_module, history, tools, context=context)
    ui_intent = _detect_ui_intent(client, clean_message)
    
    collected: list[str] = []
    yield f"event: sources\ndata: {json.dumps(sources)}\n\n".encode("utf-8")
    if ui_intent:
        yield f"event: ui_intent\ndata: {json.dumps(ui_intent)}\n\n".encode("utf-8")
    
    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            stream=True,
        )
        
        for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                text = chunk.choices[0].delta.content
                collected.append(text)
                yield f"event: chunk\ndata: {json.dumps(text)}\n\n".encode("utf-8")
        
        answer = "".join(collected).strip() or "I could not generate a response right now."
        save_conversation(db, user_id=user.id, tenant_id=user.tenant_id, message=clean_message, response=answer)
    except Exception as e:
        error_msg = f"I encountered an error: {str(e)[:100]}"
        yield f"event: chunk\ndata: {json.dumps(error_msg)}\n\n".encode("utf-8")
    
    yield b"event: done\ndata: {}\n\n"
