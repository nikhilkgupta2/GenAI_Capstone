"""add chat conversations

Revision ID: 20260601_0022
Revises: 20260601_0021
Create Date: 2026-06-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision: str = "20260601_0022"
down_revision: str | None = "20260601_0021"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "chat_conversations" not in inspector.get_table_names():
        op.create_table(
            "chat_conversations",
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("response", sa.Text(), nullable=False),
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )

    existing_indexes = {index["name"] for index in inspector.get_indexes("chat_conversations")}
    if "ix_chat_conversations_tenant_id" not in existing_indexes:
        op.create_index(op.f("ix_chat_conversations_tenant_id"), "chat_conversations", ["tenant_id"], unique=False)
    if "ix_chat_conversations_user_id" not in existing_indexes:
        op.create_index(op.f("ix_chat_conversations_user_id"), "chat_conversations", ["user_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "chat_conversations" not in inspector.get_table_names():
        return
    existing_indexes = {index["name"] for index in inspector.get_indexes("chat_conversations")}
    if "ix_chat_conversations_user_id" in existing_indexes:
        op.drop_index(op.f("ix_chat_conversations_user_id"), table_name="chat_conversations")
    if "ix_chat_conversations_tenant_id" in existing_indexes:
        op.drop_index(op.f("ix_chat_conversations_tenant_id"), table_name="chat_conversations")
    op.drop_table("chat_conversations")
