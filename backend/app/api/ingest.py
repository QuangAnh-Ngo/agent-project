from fastapi import APIRouter, HTTPException
from app.schemas.requests import IngestRequest
from app.services.rag import process_and_store_document
from app.vector_store.qdrant_db import client, COLLECTION_NAME
from qdrant_client.models import Filter, FieldCondition, MatchValue

ingest_router = APIRouter()

@ingest_router.get("/check-url")
async def check_url(url: str):
    results, _ = client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=Filter(must=[FieldCondition(key="url", match=MatchValue(value=url))]),
        limit=1
    )
    return {"exists": len(results) > 0}

@ingest_router.post("/ingest")
async def ingest_data(data: IngestRequest):
    print(f"DEBUG: Ingesting {data.url}")
    result = await process_and_store_document(data.url, data.content)
    return {"status": "success", "message": result}