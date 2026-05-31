from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr

from app.core.enums import SupportRequestStatus, SupportRequestType


class SupportRequestBase(BaseModel):
    full_name: str
    email: EmailStr
    request_type: SupportRequestType
    subject: str | None = None
    description: str


class SupportRequestCreate(SupportRequestBase):
    pass


class SupportRequestUpdate(BaseModel):
    status: SupportRequestStatus


class SupportRequestResponse(SupportRequestBase):
    id: UUID
    status: SupportRequestStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
