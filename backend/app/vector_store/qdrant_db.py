import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PayloadSchemaType

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "web_contexts_dev")

VECTOR_SIZE = 768

def init_qdrant() -> QdrantClient:
    try:
        client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY
        )
        
        if not client.collection_exists(collection_name=COLLECTION_NAME):
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )
            print(f"✅ Created: '{COLLECTION_NAME}'")
        else:
            print(f"✅ Ready: '{COLLECTION_NAME}'")
        
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="url",
            field_schema=PayloadSchemaType.KEYWORD,
        )
            
        print("🚀 QDRANT CONNECTION SUCCESS!")
        return client
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

client = init_qdrant()