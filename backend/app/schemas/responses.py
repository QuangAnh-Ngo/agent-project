"""
Purpose: Defines the Pydantic models for structuring outgoing API responses.
"""
from pydantic import BaseModel
from typing import List

# Represents a single matched subtitle snippet and its exact timestamp
class SearchResultItem(BaseModel):
    text: str
    timestamp: float
    score: float

# Represents the final response payload returned to the user after a search
class SearchResponse(BaseModel):
    status: str
    results: List[SearchResultItem]

# Represents the acknowledgment payload returned after receiving a transcript
class ProcessVideoResponse(BaseModel):
    status: str
    video_id: str
    message: str