from __future__ import annotations

import json
from collections.abc import Iterator

from fastapi import HTTPException, status
from openai import OpenAI
from sqlalchemy.orm import Session

from app.ai.memory import load_recent_history, save_conversation
from app.ai.permissions import permissions_for_role
from app.ai.prompts import FINAL_ANSWER_PROMPT, INTENT_ROUTING_PROMPT, SYSTEM_PROMPT_TEMPLATE, UI_INTENT_PROMPT
from app.ai.schemas import ChatResponse, ToolResult
from app.ai.sql_agent import route_tools, sanitize_message
from app.ai.tools import TOOL_REGISTRY
from app.core.config import settings
from app.models.user import User


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
    try:
        prompt = UI_INTENT_PROMPT.format(message=message)
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        if content:
            return json.loads(content)
    except Exception:
        pass
    return None


def _collect_tools(client: OpenAI, db: Session, user: User, message: str) -> list[ToolResult]:
    results: list[ToolResult] = []
    keyword_tools = route_tools(message)
    semantic_tools = _route_tools_semantic(client, message)
    
    all_tool_names = list(set(keyword_tools + semantic_tools))
    
    for tool_name in all_tool_names:
        tool = TOOL_REGISTRY.get(tool_name)
        if tool:
            results.append(tool(db, user))
    return results


def _build_prompt(user: User, message: str, current_module: str | None, history: list[dict[str, str]], tools: list[ToolResult]) -> str:
    tool_results = [tool.model_dump(mode="json") for tool in tools]
    tool_summary = "; ".join(f"{tool.name}: {'allowed' if tool.allowed else 'denied'}" for tool in tools)
    return FINAL_ANSWER_PROMPT.format(
        message=message,
        tool_summary=tool_summary,
        tool_results=json.dumps(tool_results, default=str),
        history=json.dumps(history, default=str),
    )


def chat(db: Session, user: User, *, message: str, current_module: str | None = None) -> ChatResponse:
    client = _get_client()
    clean_message = sanitize_message(message)
    history = load_recent_history(db, user_id=user.id, tenant_id=user.tenant_id)
    tools = _collect_tools(client, db, user, clean_message)
    
    system_instruction = _system_prompt(user, current_module)
    user_prompt = _build_prompt(user, clean_message, current_module, history, tools)
    
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
                sources=sorted({tool.source for tool in tools if tool.allowed})
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Freemodel API error: {str(e)}"
        )
    
    ui_intent = _detect_ui_intent(client, clean_message)
    save_conversation(db, user_id=user.id, tenant_id=user.tenant_id, message=clean_message, response=answer)
    sources = sorted({tool.source for tool in tools if tool.allowed})
    return ChatResponse(answer=answer, sources=sources, ui_intent=ui_intent)


def stream_chat(db: Session, user: User, *, message: str, current_module: str | None = None) -> Iterator[bytes]:
    client = _get_client()
    clean_message = sanitize_message(message)
    history = load_recent_history(db, user_id=user.id, tenant_id=user.tenant_id)
    tools = _collect_tools(client, db, user, clean_message)
    sources = sorted({tool.source for tool in tools if tool.allowed})
    
    system_instruction = _system_prompt(user, current_module)
    user_prompt = _build_prompt(user, clean_message, current_module, history, tools)
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
