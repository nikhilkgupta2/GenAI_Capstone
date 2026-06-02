from uuid import UUID

from datetime import datetime

from sqlalchemy import Boolean, Enum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import UserRole
from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (Index("ix_users_tenant_id_email", "tenant_id", "email"),)

    tenant_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        nullable=False,
        default=UserRole.RETAILER_ADMIN,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    assigned_warehouse: Mapped[str | None] = mapped_column(String(255), nullable=True)

    tenant = relationship("Tenant", back_populates="users")

    @property
    def company_name(self) -> str | None:
        return self.tenant.company_name if self.tenant else "System Administration"

    @property
    def current_plan(self) -> str:
        return self.tenant.plan if self.tenant else "free"

    @property
    def subscription_status(self) -> str:
        return self.tenant.subscription_status if self.tenant else "inactive"

    @property
    def subscription_start_date(self) -> datetime | None:
        return self.tenant.subscription_start_date if self.tenant else None

    @property
    def subscription_end_date(self) -> datetime | None:
        return self.tenant.subscription_end_date if self.tenant else None

    @property
    def feature_barcode(self) -> bool:
        return bool(getattr(self.tenant, "feature_barcode", False)) if self.tenant else False

    @property
    def feature_analytics(self) -> bool:
        return bool(getattr(self.tenant, "feature_analytics", False)) if self.tenant else False

    @property
    def feature_exports(self) -> bool:
        return bool(getattr(self.tenant, "feature_exports", False)) if self.tenant else False

    @property
    def feature_audit_logs(self) -> bool:
        return bool(getattr(self.tenant, "feature_audit_logs", False)) if self.tenant else False
