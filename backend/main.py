"""
Purpose: Serves as the main entry point for the FastAPI application.
"""
from fastapi import FastAPI
from app.api.translate import router as translate_router
from app.vector_store.qdrant_db import client

# Initialize the FastAPI application instance with a title
app = FastAPI(title="Web Translate API")

# Register the translate router under the /api/v1 prefix
app.include_router(translate_router, prefix="/api/v1", tags=["Translate"])

# Define a simple health check endpoint at the root path
@app.get("/")
def read_root():
    # Return a status message confirming the server is running
    return {"status": "Backend is running smoothly with Qdrant!"}
