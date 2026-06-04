from pydantic import BaseModel
from typing import List, Optional, Any
from uuid import UUID

class SearchResultItem(BaseModel):
    id: UUID
    type: str  # 'product', 'supplier', 'warehouse', 'transaction', 'user', 'po'
    title: str
    subtitle: Optional[str] = None
    link: str  # Frontend route
    metadata: Optional[dict[str, Any]] = None

class SearchResponse(BaseModel):
    results: List[SearchResultItem]
    total: int
