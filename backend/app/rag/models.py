from sentence_transformers import SentenceTransformer

# Global singleton for the embedding model to avoid repeated loading
_MODEL_INSTANCE = None

def get_embedding_model(model_name: str = "all-MiniLM-L6-v2"):
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is None:
        print(f"Loading embedding model: {model_name}")
        _MODEL_INSTANCE = SentenceTransformer(model_name)
    return _MODEL_INSTANCE
