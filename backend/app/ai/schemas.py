from __future__ import annotations

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    session_id: str | None = None
    current_module: str | None = None
    stream: bool = False


class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = Field(default_factory=list)


class ToolResult(BaseModel):
    name: str
    allowed: bool
    source: str
    data: list[dict] | dict
    message: str | None = None
