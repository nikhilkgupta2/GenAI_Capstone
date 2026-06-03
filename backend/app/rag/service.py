import json
import os
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from openai import OpenAI
from app.core.config import settings
from app.rag.retrieval import HybridRetriever
from app.rag.ingestion import IngestionPipeline
from app.rag.schemas import RetrievalResult, QueryClassification
from app.rag.prompts import CLASSIFICATION_PROMPT

class RAGService:
    def __init__(self, db: Session):
        self.db = db
        self.retriever = HybridRetriever(db)
        self.ingestion = IngestionPipeline(db)
        # We reuse the OpenAI client for classification if needed, or use a simple heuristic
        self.client = OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url)

    def classify_query(self, query: str) -> QueryClassification:
        """
        Classifies the query into categories.
        """
        try:
            response = self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[{"role": "system", "content": CLASSIFICATION_PROMPT.format(query=query)}],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            return QueryClassification(**data)
        except Exception as e:
            # Fallback to Hybrid if classification fails
            return QueryClassification(classification="HYBRID_QUERY", reason=f"Classification failed: {str(e)}")

    def get_context(self, query: str, tenant_id: Optional[UUID] = None) -> Tuple[str, List[RetrievalResult]]:
        """
        Retrieves relevant context for the query.
        """
        results = self.retriever.retrieve(query, tenant_id=tenant_id)
        if not results:
            return "", []
        
        context_parts = []
        for res in results:
            context_parts.append(f"Source: {res.source_type} ({res.title})\nContent: {res.chunk_text}")
        
        return "\n\n---\n\n".join(context_parts), results

    def initial_ingestion(self):
        """
        Performs initial ingestion of documentation.
        """
        # Index core project documentation
        docs_to_index = [
            "README.md",
            "SUMMARY.md",
            "QUICK_START.md",
            "GEMINI_MIGRATION.md",
            "docs/architecture.md"
        ]
        
        for doc in docs_to_index:
            path = os.path.join(os.getcwd(), "..", doc)
            if os.path.exists(path):
                print(f"Indexing {doc}...")
                self.ingestion.ingest_text_file(path)
            else:
                print(f"File not found: {path}")
        
        # In a real app, we would also trigger indexing for all existing products/suppliers
        # for each tenant.
