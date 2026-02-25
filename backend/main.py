from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import search

app = FastAPI(title="YouTube RAG Backend", version="1.0")

# Bật CORS cho Chrome Extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Hoặc giới hạn ở "chrome-extension://<id_của_bạn>"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các API Endpoint
app.include_router(search.router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "Backend is running flawlessly!"}