from sqlalchemy import Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import SupportRequestStatus, SupportRequestType
from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class SupportRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "support_requests"

    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    request_type: Mapped[SupportRequestType] = mapped_column(
        Enum(SupportRequestType, name="support_request_type"),
        nullable=False,
        default=SupportRequestType.OTHER,
    )
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[SupportRequestStatus] = mapped_column(
        Enum(SupportRequestStatus, name="support_request_status"),
        nullable=False,
        default=SupportRequestStatus.PENDING,
    )
