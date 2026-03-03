"""
Purpose: Defines the API endpoints for ingesting web content and performing translations.
"""
from fastapi import APIRouter
from app.schemas.requests import IngestRequest, TranslateRequest
from app.schemas.responses import TranslateResponse

# Initialize the router to group related translate endpoints
router = APIRouter()

# Define the endpoint to receive and ingest article text
@router.post("/ingest")
async def ingest(request: IngestRequest):
    print(request.url)
    return {"status": "success"}

# Define the endpoint to translate highlighted text
@router.post("/translate", response_model=TranslateResponse)
async def translate(request: TranslateRequest):
    return TranslateResponse(
        status="success",
        translation="Đây là bản dịch giả lập từ Backend."
    )
