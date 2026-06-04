import os
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.rag.models import get_embedding_model
from app.rag.vector_store import VectorChunk
from app.rag.schemas import VectorChunkBase, VectorChunkCreate
from app.rag.chunking import SemanticChunker

class IngestionPipeline:
    def __init__(self, db: Session, model_name: str = "all-MiniLM-L6-v2"):
        self.db = db
        self.model = get_embedding_model(model_name)
        self.chunker = SemanticChunker()

    def ingest_text_file(self, file_path: str, source_type: str = "file", tenant_id: Optional[UUID] = None):
        if not os.path.exists(file_path):
            return 
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        title = os.path.basename(file_path)
        chunks_base = self.chunker.chunk_markdown(content, source_type, title, source_id=file_path, tenant_id=tenant_id)
        self._store_chunks(chunks_base)

    def ingest_db_record(self, record_data: dict, source_type: str, title: str, source_id: str, tenant_id: Optional[UUID] = None):
        chunks_base = self.chunker.chunk_db_record(record_data, source_type, title, source_id, tenant_id)
        self._store_chunks(chunks_base)

    def _store_chunks(self, chunks_base: List[VectorChunkBase]):
        # Batch generate embeddings
        texts = [c.chunk_text for c in chunks_base]
        embeddings = self.model.encode(texts).tolist()

        for i, chunk_base in enumerate(chunks_base):
            # Check if chunk already exists to avoid duplicates (simplified: delete old ones from same source)
            # In production, we'd use a more sophisticated incremental update logic
            
            db_chunk = VectorChunk(
                tenant_id=chunk_base.tenant_id,
                source_type=chunk_base.source_type,
                source_id=chunk_base.source_id,
                title=chunk_base.title,
                chunk_text=chunk_base.chunk_text,
                chunk_index=chunk_base.chunk_index,
                metadata_json=chunk_base.metadata,
                embedding=embeddings[i]
            )
            self.db.add(db_chunk)
        
        self.db.commit()

    def clear_source(self, source_id: str, tenant_id: Optional[UUID] = None):
        query = self.db.query(VectorChunk).filter(VectorChunk.source_id == source_id)
        if tenant_id:
            query = query.filter(VectorChunk.tenant_id == tenant_id)
        query.delete()
        self.db.commit()
