from fastapi import APIRouter, BackgroundTasks
from app.schemas.requests import AddTranscriptRequest, SearchQueryRequest
from app.schemas.responses import SearchResultResponse
from app.vector_store import faiss_db

router = APIRouter()

@router.post("/transcript")
def process_transcript(req: AddTranscriptRequest, background_tasks: BackgroundTasks):
    """Sprint 1 & 2: Kích hoạt lưu transcript và chạy ngầm"""
    # Lưu 10 phút đầu ngay lập tức
    faiss_db.save_chunks_to_memory(req.session_id, req.chunks)
    
    # Kích hoạt chạy ngầm phần còn lại (Chưa code vội, cứ để comments)
    # background_tasks.add_task(worker.process_remaining_video, req.session_id)
    
    return {"status": "success", "message": "10 phút đầu đã sẵn sàng cho RAG!"}

@router.post("/search", response_model=SearchResultResponse)
def semantic_search(req: SearchQueryRequest):
    """Sprint 1: Tìm kiếm câu trả lời"""
    match = faiss_db.search_in_memory(req.session_id, req.query)
    
    if not match:
        return SearchResultResponse(text="Không tìm thấy ngữ cảnh phù hợp", start_time=0.0, end_time=0.0, score=0.0)
    
    return SearchResultResponse(
        text=match.text,
        start_time=match.start_time,
        end_time=match.end_time,
        score=0.95 # Điểm số giả lập
    )

@router.delete("/session/{session_id}")
def cleanup_ram(session_id: str):
    """Sprint 3: Dọn dẹp RAM khi đóng tab"""
    faiss_db.clear_session_memory(session_id)
    return {"status": "cleared", "session_id": session_id}