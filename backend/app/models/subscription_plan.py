from sqlalchemy import Boolean, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class SubscriptionPlan(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "subscription_plans"

    plan_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    max_users: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    max_warehouses: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    max_products: Mapped[int] = mapped_column(Integer, nullable=False, default=50)

    # Feature flags
    feature_barcode: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    feature_warehouses: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    feature_procurement: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    feature_analytics: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    feature_exports: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    feature_audit_logs: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Quota/Storage Limits
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    storage_limit_gb: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
