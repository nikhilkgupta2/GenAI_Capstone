from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Text, Index, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.db.base import Base

class VectorChunk(Base):
    __tablename__ = "vector_chunks"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    source_type = Column(String(50), nullable=False, index=True) # file, product, supplier, etc.
    source_id = Column(String(255), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    metadata_json = Column(JSON, nullable=False, server_default='{}')
    
    # Using 384 dimensions for all-MiniLM-L6-v2
    embedding = Column(Vector(384), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Full-text search index for hybrid search
    __table_args__ = (
        Index(
            "ix_vector_chunks_fst",
            text("to_tsvector('english', chunk_text)"),
            postgresql_using="gin",
        ),
    )
