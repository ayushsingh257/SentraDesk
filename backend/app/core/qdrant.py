import os
from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.core.logging import logger

from app.core.config import settings

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
QDRANT_URL = os.getenv("QDRANT_URL", f"http://{QDRANT_HOST}:{QDRANT_PORT}")

logger.info(f"Connecting to Qdrant at: {QDRANT_URL}")

if settings.ENVIRONMENT == "testing":
    qdrant_client = QdrantClient(":memory:", timeout=1.0)
else:
    qdrant_client = QdrantClient(url=QDRANT_URL, check_compatibility=False, timeout=1.0)

def init_qdrant_schema():
    """Create collection 'complaints' for duplicate detection search (Phase 61)."""
    collection_name = "complaints"
    try:
        collections = qdrant_client.get_collections().collections
        exists = any(c.name == collection_name for c in collections)
        
        if not exists:
            logger.info(f"Initializing collection '{collection_name}' in Qdrant (dimension=200, Cosine)...")
            qdrant_client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=200,  # Matches TF-IDF max_features limit
                    distance=models.Distance.COSINE
                )
            )
            logger.info(f"Collection '{collection_name}' created successfully in Qdrant.")
        else:
            logger.info(f"Collection '{collection_name}' already exists in Qdrant.")
    except Exception as e:
        logger.error(f"Error connecting to Qdrant or creating collection: {e}")

# Try initialization on import
try:
    init_qdrant_schema()
except Exception as e:
    logger.error(f"Failed to auto-initialize Qdrant collection schema: {e}")
