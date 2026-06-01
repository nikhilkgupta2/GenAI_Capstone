"""add notification soft delete

Revision ID: 20260601_0021
Revises: 5bc4a1e15321
Create Date: 2026-06-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260601_0021"
down_revision: str | None = "5bc4a1e15321"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "notifications",
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index(op.f("ix_notifications_is_deleted"), "notifications", ["is_deleted"], unique=False)
    op.alter_column("notifications", "is_deleted", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_notifications_is_deleted"), table_name="notifications")
    op.drop_column("notifications", "is_deleted")
