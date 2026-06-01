from __future__ import annotations

import json
from collections.abc import Iterator

from fastapi import HTTPException, status
from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from app.ai.memory import load_recent_history, save_conversation
from app.ai.permissions import permissions_for_role
from app.ai.prompts import FINAL_ANSWER_PROMPT, SYSTEM_PROMPT_TEMPLATE
from app.ai.schemas import ChatResponse, ToolResult
from app.ai.sql_agent import route_tools, sanitize_message
from app.ai.tools import TOOL_REGISTRY
from app.core.config import settings
from app.models.user import User


def _get_client() -> genai.Client:
    if not settings.gemini_api_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="AI is not configured: GEMINI_API_KEY is missing.")
    return genai.Client(api_key=settings.gemini_api_key)


def _system_prompt(user: User, current_module: str | None) -> str:
    permissions = sorted(permissions_for_role(user.role))
    return SYSTEM_PROMPT_TEMPLATE.format(
        user_role=user.role.value,
        tenant_id=str(user.tenant_id) if user.tenant_id else "platform",
        permissions=", ".join(permissions) or "none",
        current_module=current_module or "unknown",
    )


def _collect_tools(db: Session, user: User, message: str) -> list[ToolResult]:
    results: list[ToolResult] = []
    for tool_name in route_tools(message):
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
    tools = _collect_tools(db, user, clean_message)
    
    system_instruction = _system_prompt(user, current_module)
    user_prompt = _build_prompt(user, clean_message, current_module, history, tools)
    
    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            )
        )
        answer = response.text.strip() if response.text else "I could not generate a response right now."
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini API error: {str(e)}"
        )
    
    save_conversation(db, user_id=user.id, tenant_id=user.tenant_id, message=clean_message, response=answer)
    sources = sorted({tool.source for tool in tools if tool.allowed})
    return ChatResponse(answer=answer, sources=sources)


def stream_chat(db: Session, user: User, *, message: str, current_module: str | None = None) -> Iterator[bytes]:
    client = _get_client()
    clean_message = sanitize_message(message)
    history = load_recent_history(db, user_id=user.id, tenant_id=user.tenant_id)
    tools = _collect_tools(db, user, clean_message)
    sources = sorted({tool.source for tool in tools if tool.allowed})
    
    system_instruction = _system_prompt(user, current_module)
    user_prompt = _build_prompt(user, clean_message, current_module, history, tools)
    
    collected: list[str] = []
    yield f"event: sources\ndata: {json.dumps(sources)}\n\n".encode("utf-8")
    
    try:
        response = client.models.generate_content_stream(
            model=settings.gemini_model,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            )
        )
        for chunk in response:
            if chunk.text:
                collected.append(chunk.text)
                yield f"event: chunk\ndata: {json.dumps(chunk.text)}\n\n".encode("utf-8")
        
        answer = "".join(collected).strip() or "I could not generate a response right now."
        save_conversation(db, user_id=user.id, tenant_id=user.tenant_id, message=clean_message, response=answer)
    except Exception as e:
        error_msg = f"I encountered an error: {str(e)[:100]}"
        yield f"event: chunk\ndata: {json.dumps(error_msg)}\n\n".encode("utf-8")
    
    yield b"event: done\ndata: {}\n\n"
