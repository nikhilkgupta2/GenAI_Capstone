"""add_tenant_fields

Revision ID: 690994e9c80f
Revises: 20260527_0016
Create Date: 2026-05-27 15:03:00.283268

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '690994e9c80f'
down_revision: str | None = '20260527_0016'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Alter type tenant_status (both cases to be safe)
    op.execute("ALTER TYPE tenant_status ADD VALUE IF NOT EXISTS 'PENDING'")
    op.execute("ALTER TYPE tenant_status ADD VALUE IF NOT EXISTS 'REJECTED'")
    op.execute("ALTER TYPE tenant_status ADD VALUE IF NOT EXISTS 'pending'")
    op.execute("ALTER TYPE tenant_status ADD VALUE IF NOT EXISTS 'rejected'")

    # 2. Add columns to tenants with server_defaults
    op.add_column('tenants', sa.Column('plan', sa.String(length=50), nullable=False, server_default='free'))
    op.add_column('tenants', sa.Column('max_users', sa.Integer(), nullable=False, server_default='5'))
    op.add_column('tenants', sa.Column('max_warehouses', sa.Integer(), nullable=False, server_default='2'))
    op.add_column('tenants', sa.Column('max_products', sa.Integer(), nullable=False, server_default='50'))
    op.add_column('tenants', sa.Column('feature_barcode', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('tenants', sa.Column('feature_warehouses', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('tenants', sa.Column('feature_procurement', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('tenants', sa.Column('feature_analytics', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('tenants', sa.Column('feature_exports', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('tenants', sa.Column('feature_audit_logs', sa.Boolean(), nullable=False, server_default='true'))


def downgrade() -> None:
    op.drop_column('tenants', 'feature_audit_logs')
    op.drop_column('tenants', 'feature_exports')
    op.drop_column('tenants', 'feature_analytics')
    op.drop_column('tenants', 'feature_procurement')
    op.drop_column('tenants', 'feature_warehouses')
    op.drop_column('tenants', 'feature_barcode')
    op.drop_column('tenants', 'max_products')
    op.drop_column('tenants', 'max_warehouses')
    op.drop_column('tenants', 'max_users')
    op.drop_column('tenants', 'plan')
