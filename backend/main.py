"""
Purpose: Serves as the main entry point for the FastAPI application.
"""
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.api.tools import tool_router
from app.api.ingest import ingest_router

app = FastAPI(title="Web Translate API")

app.include_router(tool_router, prefix="/api/v1", tags=["AI Tools"])
app.include_router(ingest_router, prefix="/api/v1", tags=["Data Management"])

@app.get("/")
def read_root():
    return {"status": "Backend is running smoothly with Qdrant!"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Access-Control-Allow-Private-Network"],
)

@app.middleware("http")
async def add_private_network_access_header(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response()
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
    
    response = await call_next(request)
    return response