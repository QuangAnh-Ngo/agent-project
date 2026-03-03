"""
Purpose: Defines the Pydantic models for structuring outgoing API responses.
"""
from pydantic import BaseModel

# Represents the response payload returned after a translation request
class TranslateResponse(BaseModel):
    status: str
    translation: str
