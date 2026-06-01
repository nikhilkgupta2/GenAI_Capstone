"""add chat conversation session id

Revision ID: 20260601_0023
Revises: 20260601_0022
Create Date: 2026-06-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "20260601_0023"
down_revision: str | None = "20260601_0022"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("chat_conversations")}
    if "session_id" not in columns:
        op.add_column(
            "chat_conversations",
            sa.Column("session_id", sa.String(length=120), nullable=False, server_default="default"),
        )
        op.alter_column("chat_conversations", "session_id", server_default=None)
    indexes = {index["name"] for index in inspector.get_indexes("chat_conversations")}
    if "ix_chat_conversations_session_id" not in indexes:
        op.create_index(op.f("ix_chat_conversations_session_id"), "chat_conversations", ["session_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "chat_conversations" not in inspector.get_table_names():
        return
    indexes = {index["name"] for index in inspector.get_indexes("chat_conversations")}
    if "ix_chat_conversations_session_id" in indexes:
        op.drop_index(op.f("ix_chat_conversations_session_id"), table_name="chat_conversations")
    columns = {column["name"] for column in inspector.get_columns("chat_conversations")}
    if "session_id" in columns:
        op.drop_column("chat_conversations", "session_id")
