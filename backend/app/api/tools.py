from fastapi import APIRouter, HTTPException
from app.schemas.requests import IngestRequest, TranslateRequest, AskRequest
from app.schemas.responses import TranslateResponse, AskResponse
from app.services.rag import process_and_store_document, retrieve_relevant_context
from app.services.llm import get_ai_response # Sẽ tạo ở Task 3.2

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
        
        # 2. Gọi Gemini để dịch thuật thông minh (Task 3.2)

        translation = await get_ai_response(request.highlighted_text, context, task="translate")
        
        return TranslateResponse(
            status="success",
            translation=translation
        )
    except Exception as e:
        print(f"❌ Lỗi dịch thuật: {e}")
        raise HTTPException(status_code=500, detail="Không thể thực hiện dịch thuật RAG")
    
@router.post("/ask", response_model=AskResponse)
async def ask_ai(request: AskRequest):
    try:
        context = await retrieve_relevant_context(request.highlighted_text, request.url)
        # Gọi hàm với task="ask" và truyền câu hỏi của user
        answer = await get_ai_response(
            request.highlighted_text, 
            context, 
            question=request.user_question, 
            task="ask"
        )
        return AskResponse(status="success", answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))