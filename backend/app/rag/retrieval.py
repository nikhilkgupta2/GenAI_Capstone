from typing import List, Optional
from uuid import UUID
from sqlalchemy import text, func
from sqlalchemy.orm import Session
from app.rag.models import get_embedding_model
from app.rag.vector_store import VectorChunk
from app.rag.schemas import RetrievalResult

class HybridRetriever:
    def __init__(self, db: Session, model_name: str = "all-MiniLM-L6-v2"):
        self.db = db
        self.model = get_embedding_model(model_name)

    def retrieve(self, query: str, tenant_id: Optional[UUID] = None, top_k: int = 5, min_confidence: float = 0.2) -> List[RetrievalResult]:
        """
        Hybrid retrieval combining vector similarity and full-text search.
        """
        query_embedding = self.model.encode(query).tolist()
        
        # 1. Vector Search (using cosine distance/similarity)
        # 0 <=> same, 2 <=> opposite
        # We want 1 - distance for similarity
        vector_similarity = 1 - VectorChunk.embedding.cosine_distance(query_embedding)
        
        # 2. Full-text Search Score
        fts_score = func.ts_rank_cd(
            func.to_tsvector('english', VectorChunk.chunk_text),
            func.plainto_tsquery('english', query)
        )

        # Combined scoring (Reciprocal Rank Fusion or weighted sum)
        # For simplicity, we use weighted sum here
        combined_score = (vector_similarity * 0.7 + fts_score * 0.3).label("confidence")

        query_obj = self.db.query(
            VectorChunk,
            combined_score,
            vector_similarity.label("v_sim"),
            fts_score.label("fts")
        )

        # Tenant isolation
        if tenant_id:
            query_obj = query_obj.filter(
                (VectorChunk.tenant_id == tenant_id) | (VectorChunk.tenant_id == None)
            )
        else:
            query_obj = query_obj.filter(VectorChunk.tenant_id == None)

        results = query_obj.order_by(combined_score.desc()).limit(top_k).all()

        return [
            RetrievalResult(
                chunk_text=row.VectorChunk.chunk_text,
                source_type=row.VectorChunk.source_type,
                source_id=row.VectorChunk.source_id,
                title=row.VectorChunk.title,
                confidence=float(row.confidence),
                metadata=row.VectorChunk.metadata_json
            )
            for row in results if row.confidence >= min_confidence
        ]
