from pydantic import BaseModel

class SearchResultResponse(BaseModel):
    text: str
    start_time: float
    end_time: float
    score: float