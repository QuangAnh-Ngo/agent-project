# --- Stage 1: Build stage ---
FROM python:3.11-slim as builder

WORKDIR /app

# Cài đặt công cụ build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Cài đặt thư viện vào thư mục cục bộ của user
RUN pip install --user --no-cache-dir -r requirements.txt

# --- Stage 2: Final stage ---
FROM python:3.11-slim

WORKDIR /app

# FAISS và một số thư viện toán học thường cần libgomp1
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Chỉ copy những thứ cần thiết từ stage builder
COPY --from=builder /root/.local /root/.local
COPY . .

# Đảm bảo các script trong .local/bin có thể chạy được
ENV PATH=/root/.local/bin:$PATH
# Ngăn Python tạo ra các file .pyc và giúp log hiện ra ngay lập tức
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]