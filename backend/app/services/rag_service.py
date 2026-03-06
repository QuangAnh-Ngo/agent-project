import os
import uuid
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

# 1. Lấy thông tin Cloud từ file .env
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "web_contexts"

# 2. Khởi tạo Model cũ (384 chiều) để khớp với Collection hiện tại
embed_model = SentenceTransformer('all-MiniLM-L6-v2') 
qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

async def process_and_store_document(url: str, content: str):
    # Task 2.3: Kiểm tra Cache trên Cloud trước khi nạp
    existing_points = qdrant_client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=Filter(
            must=[FieldCondition(key="url", match=MatchValue(value=url))]
        ),
        limit=1
    )
    
    if existing_points[0]:
        print(f"⏩ URL {url} đã có trên Cloud. Bỏ qua.")
        return "Hit Cache"

    # Task 2.2: Băm nhỏ văn bản (Chunking)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=100)
    chunks = text_splitter.split_text(content)
    print("Cut into", len(chunks), "chunk")

    # Task 2.3: Embedding (384 dims) & Upsert lên Cloud
    points = []
    for chunk in chunks:
        vector = embed_model.encode(chunk).tolist()
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={"url": url, "text": chunk}
        ))

    qdrant_client.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"✅ Đã đẩy thành công {len(chunks)} đoạn lên Qdrant Cloud.")
    return "Success"