from __future__ import annotations

from uuid import UUID

from sqlalchemy import Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class SubscriptionPayment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "subscription_payments"
    __table_args__ = (
        Index("ix_subscription_payments_tenant_created_at", "tenant_id", "created_at"),
        Index("ix_subscription_payments_order_id", "razorpay_order_id"),
        Index("ix_subscription_payments_payment_id", "razorpay_payment_id"),
    )

    tenant_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    plan_code: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="INR")
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="created")

    razorpay_order_id: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    razorpay_payment_id: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
