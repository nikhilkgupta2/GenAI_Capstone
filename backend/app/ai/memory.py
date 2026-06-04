from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.chat_conversation import ChatConversation


def load_recent_history(db: Session, *, user_id: UUID, tenant_id: UUID | None, session_id: str = "default", limit: int = 8) -> list[dict[str, str]]:
    rows = (
        db.query(ChatConversation)
        .filter(ChatConversation.user_id == user_id)
        .filter(ChatConversation.tenant_id == tenant_id)
        .filter(ChatConversation.session_id == session_id)
        .order_by(ChatConversation.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {"message": row.message, "response": row.response}
        for row in reversed(rows)
    ]


def save_conversation(db: Session, *, user_id: UUID, tenant_id: UUID | None, session_id: str = "default", message: str, response: str) -> None:
    db.add(ChatConversation(tenant_id=tenant_id, user_id=user_id, session_id=session_id, message=message, response=response))
    db.commit()
