from fastapi import APIRouter, HTTPException
from app.schemas.requests import IngestRequest, TranslateRequest, AskRequest
from app.schemas.responses import TranslateResponse, AskResponse
from app.services.rag import process_and_store_document, retrieve_relevant_context
from app.services.llm import get_ai_response # Sẽ tạo ở Task 3.2

tool_router = APIRouter()

@tool_router.post("/translate", response_model=TranslateResponse)
async def translate(request: TranslateRequest):
    try:
        context = await retrieve_relevant_context(request.highlighted_text, request.url)
        gen = get_ai_response(
            text=request.highlighted_text, 
            context=context, 
            task="translate"
        )
        return StreamingResponse(gen, media_type="text/plain")
    
    except Exception as e:
        print(f"❌ Lỗi dịch thuật: {e}")
        raise HTTPException(status_code=500, detail="Không thể thực hiện dịch thuật RAG")
    
@tool_router.post("/ask", response_model=AskResponse)
async def ask_ai(request: AskRequest):
    try:
        context = await retrieve_relevant_context(request.highlighted_text, request.url)
        gen = get_ai_response(
            text=request.highlighted_text, 
            context=context, 
            question=request.user_question, 
            task="ask"
        )
        return StreamingResponse(gen, media_type="text/plain")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))