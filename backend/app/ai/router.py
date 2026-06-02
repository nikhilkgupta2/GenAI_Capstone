from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.ai.schemas import ChatRequest, ChatResponse
from app.ai.service import chat, stream_chat
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import ApiResponse

router = APIRouter(tags=["ai-assistant"])


@router.post("/chat", response_model=ApiResponse)
def ai_chat(
    payload: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wants_stream = payload.stream or "text/event-stream" in request.headers.get("accept", "")
    if wants_stream:
        return StreamingResponse(
            stream_chat(db, current_user, message=payload.message, current_module=payload.current_module),
            media_type="text/event-stream",
        )
    result: ChatResponse = chat(db, current_user, message=payload.message, current_module=payload.current_module)
    return ApiResponse(message="AI response generated.", data=result.model_dump())
