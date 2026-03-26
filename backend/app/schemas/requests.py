"""
Purpose: Defines the Pydantic models for validating incoming API request payloads.
"""
from pydantic import BaseModel

# Represents the payload sent by the extension to ingest article text
class IngestRequest(BaseModel):
    url: str
    content: str

# Represents the payload sent by the extension to translate highlighted text
class TranslateRequest(BaseModel):
    url: str
    highlighted_text: str

class AskRequest(BaseModel):
    url: str
    highlighted_text: str
    user_question: str # Câu hỏi cụ thể của Thai

class AskResponse(BaseModel):
    status: str
    answer: str # Nội dung câu trả lời thay vì bản dịch