"""
Purpose: Defines the API endpoints for processing transcripts and performing semantic searches.
"""
from fastapi import APIRouter
from app.schemas.requests import ProcessVideoRequest, SearchRequest
from app.schemas.responses import ProcessVideoResponse, SearchResponse

# Initialize the router to group related search endpoints
router = APIRouter()

# Define the endpoint to receive and process video transcripts
@router.post("/process-video", response_model=ProcessVideoResponse)
async def mock_process_video(request: ProcessVideoRequest):
    # Return a mocked success response indicating the transcript was received
    return ProcessVideoResponse(
        status="success",
        video_id=request.video_id,
        message=f"Received {len(request.transcript)} transcript items. Ready for Qdrant."
    )

# Define the endpoint to perform semantic searches on a specific video
@router.post("/search", response_model=SearchResponse)
async def mock_search(request: SearchRequest):
    # Log the incoming search query for debugging purposes
    print(f"Searching '{request.query}' in video {request.video_id}")
    
    # Return mocked search results with hardcoded timestamps and scores
    return SearchResponse(
        status="success",
        results=[
            {"text": "Mocked segment explaining the concept...", "timestamp": 125.0, "score": 0.95},
            {"text": "Second mocked segment for testing UI jump...", "timestamp": 310.0, "score": 0.88}
        ]
    )