from pydantic import BaseModel
from typing import List

class TranscriptChunk(BaseModel):
    text: str
    start_time: float
    end_time: float

class AddTranscriptRequest(BaseModel):
    session_id: str
    video_id: str
    chunks: List[TranscriptChunk]

class SearchQueryRequest(BaseModel):
    session_id: str
    query: str