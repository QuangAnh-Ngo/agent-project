import os
import uuid
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "web_contexts_dev")

embed_model = SentenceTransformer('all-MiniLM-L6-v2') 
q_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

async def process_and_store_document(url: str, content: str):
    # Kiểm tra Cache
    existing_points, _ = q_client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=Filter(
            must=[FieldCondition(key="url", match=MatchValue(value=url))]
        ),
        limit=1
    )
    
    if existing_points:
        return "Hit Cache"

    # Chunking
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=100)
    chunks = text_splitter.split_text(content)

    # Embedding & Upsert
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=embed_model.encode(chunk).tolist(),
            payload={"url": url, "text": chunk}
        ) for chunk in chunks
    ]

    q_client.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"✅ Đã nạp {len(chunks)} đoạn từ {url}")
    return "Success"

# --- MỚI: Hàm lấy ngữ cảnh cho Sprint 3 ---
async def retrieve_relevant_context(query_text: str, url: str):
    query_vector = embed_model.encode(query_text).tolist()
    
    # Sử dụng Query API mới nhất
    response = q_client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector, # Trong query_points, tham số là 'query' thay vì 'query_vector'
        query_filter=Filter(
            must=[FieldCondition(key="url", match=MatchValue(value=url))]
        ),
        limit=3
    )
    
    # query_points trả về đối tượng QueryResponse, kết quả nằm trong thuộc tính .points
    search_results = response.points
    
    print(f"\n--- TOP 3 SEARCH RESULTS FOR: '{query_text}' ---")
    for i, hit in enumerate(search_results):
        print(f"Result {i+1} (Score: {hit.score:.4f}):")
        print(f"{hit.payload['text']}\n")
    print("--------------------------------------------------")

    context = "\n\n".join([hit.payload["text"] for hit in search_results])
    return context