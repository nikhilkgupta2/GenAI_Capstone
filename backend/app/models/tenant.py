from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import TenantStatus
from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Tenant(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tenants"

    company_name: Mapped[str] = mapped_column(String(160), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    status: Mapped[TenantStatus] = mapped_column(
        Enum(TenantStatus, name="tenant_status"),
        nullable=False,
        default=TenantStatus.ACTIVE,
    )

    plan: Mapped[str] = mapped_column(String(50), nullable=False, default="free")
    max_users: Mapped[int] = mapped_column(nullable=False, default=5)
    max_warehouses: Mapped[int] = mapped_column(nullable=False, default=2)
    max_products: Mapped[int] = mapped_column(nullable=False, default=50)

    feature_barcode: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    feature_warehouses: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    feature_procurement: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    feature_analytics: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    feature_exports: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    feature_audit_logs: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    users = relationship("User", back_populates="tenant")
