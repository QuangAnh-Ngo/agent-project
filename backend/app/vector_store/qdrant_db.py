"""
Purpose: Manages the connection to the Qdrant vector database instance.
"""
import os
from qdrant_client import QdrantClient

# Fetch the Qdrant URL from environment variables, defaulting to the Docker service name
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")

def get_qdrant_client() -> QdrantClient:
    # Attempt to establish a connection to Qdrant and return the client object
    try:
        client = QdrantClient(url=QDRANT_URL)
        print("Successfully connected to Qdrant Vector DB")
        return client
    except Exception as e:
        print(f"Failed to connect to Qdrant: {e}")
        return None

# Initialize a singleton client instance to be imported by other modules
client = get_qdrant_client()