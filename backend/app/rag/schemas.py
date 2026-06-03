from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, Field
from uuid import UUID

class VectorChunkBase(BaseModel):
    source_type: str
    source_id: Optional[str] = None
    tenant_id: Optional[UUID] = None
    title: str
    chunk_text: str
    chunk_index: int
    metadata: dict = Field(default_factory=dict)

class VectorChunkCreate(VectorChunkBase):
    embedding: List[float]

class VectorChunk(VectorChunkBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RetrievalResult(BaseModel):
    chunk_text: str
    source_type: str
    source_id: Optional[str]
    title: str
    confidence: float
    metadata: dict = Field(default_factory=dict)

class QueryClassification(BaseModel):
    classification: str # DATABASE_QUERY, KNOWLEDGE_QUERY, HYBRID_QUERY, OUT_OF_SCOPE
    reason: str
