from fastapi import APIRouter, HTTPException
from app.schemas.requests import IngestRequest, TranslateRequest
from app.schemas.responses import TranslateResponse
from app.services.rag import process_and_store_document, retrieve_relevant_context
from app.services.llm import get_translation

router = APIRouter()

@router.post("/ingest")
async def ingest_data(data: IngestRequest):
    print(f"DEBUG: Ingesting {data.url}")
    result = await process_and_store_document(data.url, data.content)
    return {"message": result}

@router.post("/translate", response_model=TranslateResponse)
async def translate(request: TranslateRequest):
    try:
        # 1. Lấy ngữ cảnh liên quan từ Qdrant (Task 3.1)
        context = await retrieve_relevant_context(request.highlighted_text, request.url)
        
        # 2. Gọi LLM theo OpenAI SDK để dịch thuật thông minh
        translation = await get_translation(request.highlighted_text, context)
        
        return TranslateResponse(
            status="success",
            translation=translation
        )
    except Exception as e:
        print(f"❌ Lỗi dịch thuật: {e}")
        raise HTTPException(status_code=500, detail="Không thể thực hiện dịch thuật RAG")