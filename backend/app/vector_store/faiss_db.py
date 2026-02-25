# Bộ nhớ tạm: Cấu trúc { "session_id": [ Danh sách các chunk ] }
memory_db = {}

def save_chunks_to_memory(session_id: str, chunks: list):
    """Giả lập việc lưu và nhúng Vector"""
    if session_id not in memory_db:
        memory_db[session_id] = []
    memory_db[session_id].extend(chunks)

def search_in_memory(session_id: str, query: str):
    """Giả lập việc tìm kiếm Semantic Search"""
    if session_id not in memory_db or len(memory_db[session_id]) == 0:
        return None
    
    # Mock: Luôn trả về chunk đầu tiên trong RAM như một "kết quả tìm thấy"
    # Sau này ở Sprint 2, hàm này sẽ được thay bằng FAISS vector search thực thụ
    return memory_db[session_id][0]

def clear_session_memory(session_id: str):
    """Xóa dữ liệu khi user đóng tab"""
    if session_id in memory_db:
        del memory_db[session_id]