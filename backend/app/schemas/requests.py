"""
Purpose: Defines the Pydantic models for validating incoming API request payloads.
"""
from pydantic import BaseModel
from typing import List

# Represents a single line of subtitle with its text and timing
class TranscriptItem(BaseModel):
    text: str
    start: float
    duration: float

# Represents the payload sent by the extension to process a new video
class ProcessVideoRequest(BaseModel):
    video_id: str
    transcript: List[TranscriptItem]

# Represents the payload sent by the extension when a user asks a query
class SearchRequest(BaseModel):
    video_id: str
    query: str