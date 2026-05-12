"""
Purpose: Serves as the main entry point for the FastAPI application.
"""
from app.schemas.requests import IngestRequest
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.api.translate import router as translate_router
from app.vector_store.qdrant_db import client
from app.services.rag import process_and_store_document

# Initialize the FastAPI application instance with a title
app = FastAPI(title="Web Translate API")

# Register the translate router under the /api/v1 prefix
app.include_router(translate_router, prefix="/api/v1", tags=["Translate"])

# Define a simple health check endpoint at the root path
@app.get("/")
def read_root():
    # Return a status message confirming the server is running
    return {"status": "Backend is running smoothly with Qdrant!"}

# 1. Cấu hình CORS tiêu chuẩn
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Header quan trọng để sửa lỗi "loopback address space"
    expose_headers=["Access-Control-Allow-Private-Network"],
)

# 2. Xử lý yêu cầu Preflight (OPTIONS) cho Private Network
@app.middleware("http")
async def add_private_network_access_header(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response()
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
    
    response = await call_next(request)
    return response

# @app.post("/api/v1/ingest")
# async def ingest_data(data: IngestRequest):
#     print(f"DEBUG: Đang Nhận yêu cầu Ingest cho URL: {data.url}")
#     result = await process_and_store_document(data.url, data.content)
#     return {"status": "success", "message": result}