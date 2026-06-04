"""subscription_payments_and_tenant_subscription_fields

Revision ID: 20260602_0017
Revises: 5bc4a1e15321
Create Date: 2026-06-02

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "20260602_0017"
down_revision: str | None = "5bc4a1e15321"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:

    # Add subscription columns to tenants table
    op.add_column(
        "tenants",
        sa.Column(
            "subscription_status",
            sa.String(length=32),
            nullable=False,
            server_default="inactive",
        ),
    )

    op.add_column(
        "tenants",
        sa.Column(
            "subscription_start_date",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "tenants",
        sa.Column(
            "subscription_end_date",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:

    # Remove tenant subscription columns
    op.drop_column("tenants", "subscription_end_date")
    op.drop_column("tenants", "subscription_start_date")
    op.drop_column("tenants", "subscription_status")