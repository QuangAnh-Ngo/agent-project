"""
Purpose: Serves as the main entry point for the FastAPI application.
"""
from fastapi import FastAPI
from app.api.search import router as search_router
from app.vector_store.qdrant_db import client

# Initialize the FastAPI application instance with a title
app = FastAPI(title="YouTube Semantic Search API")

# Register the search router under the /api/v1 prefix
app.include_router(search_router, prefix="/api/v1", tags=["Search"])

# Define a simple health check endpoint at the root path
@app.get("/")
def read_root():
    # Return a status message confirming the server is running
    return {"status": "Backend is running smoothly with Qdrant!"}