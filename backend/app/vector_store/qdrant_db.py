"""
Purpose: Connects to Qdrant Cloud and ensures the collection exists.
"""
import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

# Lấy thông tin từ file .env
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "web_contexts_dev")

# Vector size = 384 (Phù hợp với model MiniLM mà chúng ta sẽ dùng ở Sprint 2)
VECTOR_SIZE = 384 

def init_qdrant() -> QdrantClient:
    try:
        # Kết nối lên Cloud bằng URL và API Key
        client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY
        )
        
        # Kiểm tra xem Collection đã tồn tại chưa, nếu chưa thì tự động tạo
        if not client.collection_exists(collection_name=COLLECTION_NAME):
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
            )
            print(f"✅ Đã tạo mới Collection: '{COLLECTION_NAME}' trên Qdrant Cloud")
        else:
            print(f"✅ Collection '{COLLECTION_NAME}' đã sẵn sàng.")
            
        print("🚀 KẾT NỐI QDRANT CLOUD THÀNH CÔNG!")
        return client
        
    except Exception as e:
        print(f"❌ Lỗi kết nối Qdrant Cloud: {e}")
        return None

# Khởi tạo instance kết nối ngay khi file này được import
client = init_qdrant()