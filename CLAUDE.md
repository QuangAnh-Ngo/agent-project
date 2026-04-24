# CLAUDE.md — RAG-Context_Background-Tools_Bar

Tài liệu định hướng cho Claude khi làm việc trong repo này. Tóm tắt kiến trúc, data flow, stack và các điểm cần lưu ý khi sửa code.

---

## 1. Tổng quan dự án

**Tên:** RAG-Context_Background-Tools_Bar
**Mục đích:** Chrome Extension dịch thuật thông minh theo ngữ cảnh. Khi user bôi đen 1 đoạn text trên bất kỳ trang web nào, extension gửi đoạn đó + URL hiện tại về backend. Backend dùng **RAG** (Retrieval-Augmented Generation) — lấy các chunk liên quan nhất của *chính bài viết đó* từ Qdrant, rồi feed vào **Gemini** để dịch sang tiếng Việt với thuật ngữ chuẩn theo ngữ cảnh bài.

**Hai flow chính:**
1. **Ingest flow** — khi trang web load xong, content script gom toàn bộ văn bản (`p`, `h1–h6`, `span` > 30 ký tự), gửi về `/api/v1/ingest`. Backend chunk + embed + upsert vào Qdrant, có cache theo URL.
2. **Translate flow** — user bôi đen text → floating UI hiện nút "🪄 Dịch AI (RAG)" → gửi về `/api/v1/translate` → backend truy vấn top-3 chunks cùng URL → Gemini dịch với context kèm theo → trả bản dịch tiếng Việt.

---

## 2. Cấu trúc thư mục

```
.
├── backend/                       # FastAPI service (port 8080)
│   ├── main.py                    # Entry point, CORS + Private Network middleware
│   ├── Dockerfile                 # Multi-stage build, Python 3.11-slim
│   ├── requirements.txt           # LƯU Ý: file đang ở encoding UTF-16 LE (BOM), có khoảng trắng xen ký tự
│   └── app/
│       ├── api/translate.py       # Router: POST /ingest, POST /translate
│       ├── schemas/
│       │   ├── requests.py        # IngestRequest, TranslateRequest
│       │   └── responses.py       # TranslateResponse
│       ├── services/
│       │   ├── rag.py             # Chunking, embedding, upsert, retrieval (Qdrant)
│       │   └── llm.py             # Gemini client + prompt template
│       ├── vector_store/
│       │   └── qdrant_db.py       # Khởi tạo QdrantClient + collection + payload index
│       └── ai/                    # (rỗng, placeholder)
├── frontend/                      # Chrome Extension (Manifest V3)
│   ├── manifest.json              # service_worker + content_scripts cho <all_urls>
│   ├── background.js              # Service worker: proxy fetch để tránh CORS
│   ├── content.js                 # Inject UI nổi + bắt sự kiện bôi đen + ingest on load
│   ├── style.css                  # Style floating UI (#rag-translator-wrapper, .rag-result-box)
│   └── images.png                 # Icon 128px
├── docker-compose.yml             # backend service, port 8080:8080, mount ./backend:/app
├── .github/workflows/
│   └── docker-publish.yml         # CI: build & push lên quanganhngo2107/agent_project-backend
└── .gitignore                     # bỏ venv, __pycache__, .env, qdrant_storage/
```

---

## 3. Data flow chi tiết

### 3.1 Ingest (auto-run khi trang load)
```
[Webpage load]
    │
    ▼
content.js → window "load" event
    │  (gom p/h1..h6/span text > 30 ký tự, tổng > 100 ký tự)
    ▼
chrome.runtime.sendMessage({type: "API_CALL", url: /ingest, data: {url, content}})
    │
    ▼
background.js → fetch POST http://localhost:8080/api/v1/ingest
    │
    ▼
FastAPI /api/v1/ingest → process_and_store_document(url, content)
    │
    ├─ Qdrant scroll filter by url → nếu có điểm → return "Hit Cache"
    │
    ├─ RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=100)
    ├─ embed_model = SentenceTransformer('BAAI/bge-base-en-v1.5') → 768-dim
    └─ q_client.upsert(PointStruct{id=uuid4, vector, payload={url, text}})
```

### 3.2 Translate (user-triggered)
```
[User selects text → mouseup]
    │
    ▼
content.js → createFloatingUI(x, y, text) → button "🪄 Dịch AI (RAG)"
    │
    ▼ (click)
triggerTranslation(text) → render loading spinner
    │
    ▼
chrome.runtime.sendMessage({type: "API_CALL", url: /translate, data: {url, highlighted_text}})
    │
    ▼
background.js → fetch POST http://localhost:8080/api/v1/translate
    │
    ▼
FastAPI /api/v1/translate
    │
    ├─ retrieve_relevant_context(query, url):
    │     instruction = "Represent this sentence for searching relevant passages: "
    │     q_client.query_points(query=embed(instruction+query), filter=url, limit=3)
    │     → context = "\n\n".join(top 3 chunks)
    │
    └─ get_gemini_translation(text, context):
          gemini-2.5-flash.generate_content(prompt với text + context)
          → trả về text tiếng Việt (preserve paragraph structure)
    │
    ▼
TranslateResponse{status, translation} → background.js → content.js
    │
    ▼
Render .rag-result-box với nội dung + nút Copy
```

---

## 4. Tech stack & thư viện cốt lõi

### Backend (Python 3.11)
- **FastAPI** `0.133.0` + **uvicorn** `0.41.0` — REST API, chạy port 8080
- **pydantic** `2.12.5` — validate request/response
- **qdrant-client** — vector DB client (Qdrant Cloud qua `QDRANT_URL` + `QDRANT_API_KEY`)
- **sentence-transformers** — embedding model `BAAI/bge-base-en-v1.5` (768-dim, cosine)
- **langchain-text-splitters** — `RecursiveCharacterTextSplitter` (700 / 100 overlap)
- **google-generativeai** — Gemini `gemini-2.5-flash` cho dịch thuật
- **torch** (CPU-only) — dependency của sentence-transformers, cài từ PyTorch CPU index trong Dockerfile
- **python-dotenv** — load `.env`

### Frontend (Chrome Extension MV3)
- Vanilla JS, không framework
- **Manifest V3**: `service_worker` (background.js), `content_scripts` inject vào `<all_urls>` lúc `document_idle`
- **Permissions**: `activeTab`, `scripting`, `storage`; host `http://localhost:8080/*`

### Infra
- **Docker Compose** — 1 service `backend` (image `quanganhngo2107/agent_project-backend:latest`)
- **GitHub Actions** — build & push Docker image theo tên branch (mọi branch đều trigger)
- Qdrant chạy **cloud** (không chạy local — phần qdrant service trong compose đã bị comment)

---

## 5. Biến môi trường (.env)

Backend đọc qua `os.getenv`:
- `QDRANT_URL` — endpoint Qdrant Cloud
- `QDRANT_API_KEY` — API key Qdrant
- `COLLECTION_NAME` — mặc định `web_contexts_dev` (CI dùng `web_contexts_ci`)
- `GEMINI_API_KEY` — Google AI Studio key

File `.env` đã được `.gitignore`.

---

## 6. Business logic & design choices cần nhớ

1. **Cache theo URL:** Trước khi chunk + embed, `process_and_store_document` scroll Qdrant filter `url==` — nếu đã tồn tại ≥ 1 point → return `"Hit Cache"` (không ingest lại). → Extension có thể gọi ingest mỗi lần load trang mà không lo trùng lặp.

2. **Filter theo URL khi retrieve:** `retrieve_relevant_context` **luôn** filter `url==request.url`. Nghĩa là ngữ cảnh chỉ lấy từ *chính trang user đang đọc* — không cross-page. Để dùng được cần phải ingest trước, nếu không sẽ retrieve rỗng.

3. **Prefix instruction cho BGE:** Query vector có prepend `"Represent this sentence for searching relevant passages: "` (chuẩn của `BAAI/bge-base-en-v1.5` cho asymmetric search). Document embedding không có prefix.

4. **Prompt Gemini (`llm.py`):**
   - Role: Expert Technical Translator (CS/Software)
   - BẮT BUỘC preserve paragraph structure, line breaks, list formatting
   - Dùng RAG context để chuẩn hóa thuật ngữ chuyên ngành
   - Output: raw text, không markdown code block, không preface

5. **CORS + Private Network Access:** `main.py` có middleware riêng xử lý preflight `OPTIONS` trả `Access-Control-Allow-Private-Network: true` — để tránh lỗi khi Chrome block loopback từ public website.

6. **Content script thu thập text:** `content.js` dùng `document.querySelectorAll("p, h1..h6, span")`, filter > 30 ký tự, tổng > 100 ký tự mới gửi ingest. → Trang có quá ít text sẽ không được index.

7. **Floating UI lifecycle:** Bôi đen `mouseup` → tạo nút. Click vào khu vực ngoài container → `mousedown` handler tự destroy. Một container tại một thời điểm (biến `ragContainer`).

---

## 7. Cách chạy local

### Backend
```bash
# Từ repo root
cd backend
pip install -r requirements.txt       # Lưu ý encoding UTF-16 — có thể cần convert sang UTF-8 trước
# Tạo file .env ở repo root với QDRANT_URL, QDRANT_API_KEY, GEMINI_API_KEY, COLLECTION_NAME
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

Hoặc qua Docker:
```bash
docker compose up -d
curl http://localhost:8080/docs       # FastAPI Swagger UI
```

### Frontend (Chrome Extension)
1. Chrome → `chrome://extensions/` → bật Developer mode
2. "Load unpacked" → chọn thư mục `frontend/`
3. Truy cập 1 trang web bất kỳ → bôi đen text → click nút "🪄 Dịch AI (RAG)"

---

## 8. Endpoints

| Method | Path                  | Request                                   | Response                          |
| ------ | --------------------- | ----------------------------------------- | --------------------------------- |
| GET    | `/`                   | —                                         | `{status: "Backend is running…"}` |
| POST   | `/api/v1/ingest`      | `{url: str, content: str}`                | `{message: "Success"|"Hit Cache"}`|
| POST   | `/api/v1/translate`   | `{url: str, highlighted_text: str}`       | `{status, translation}`           |

---

## 9. Lưu ý khi chỉnh sửa

- **`requirements.txt` đang ở UTF-16 LE (BOM)** — thể hiện qua ký tự `��` và khoảng trắng xen kẽ. Nếu cần edit bằng công cụ UTF-8 thuần, convert encoding trước (`iconv -f UTF-16LE -t UTF-8`).
- **Không có test suite** — CI chỉ kiểm tra `curl /docs` sau khi compose up.
- **Thư mục `backend/app/ai/`** tồn tại nhưng rỗng — placeholder, có thể bỏ qua.
- **README.md rỗng** — dự án chưa có docs chính thức, CLAUDE.md này là nguồn tham chiếu.
- **CI push image theo branch name** — `main` → `:main`, `feature/foo` → `:feature-foo`. Docker Hub repo: `quanganhngo2107/agent_project-backend`.
- **Gemini model** hiện là `gemini-2.5-flash` — nếu cần nâng cấp xem `backend/app/services/llm.py:6`.
- **Embedding model** là `BAAI/bge-base-en-v1.5` (tiếng Anh). Vector size `768` được hard-code ở `qdrant_db.py:9` — đổi model phải đổi cả đây + có thể cần drop & recreate collection.
- **`main.py` có code ingest commented out** (dòng 48-52) — logic đã chuyển sang `api/translate.py`, đừng uncomment lại.

---

## 10. Việc tiếp theo có thể làm (observations)

- README.md trống → có thể viết quick start
- `backend/app/ai/` rỗng → có thể xóa hoặc dùng cho tương lai
- Không có `.env.example` → khó onboard người mới
- Hardcoded `localhost:8080` trong `content.js` và `manifest.json` host_permissions → khó deploy production

---

## 11. Quy tắc làm việc cho Claude (user instructions)

Các quy tắc bắt buộc tuân thủ khi Claude làm việc trong repo này:

### 11.1 Không tự ý tạo PR vào `main`
- **KHÔNG** tạo Pull Request trực tiếp từ branch Claude vào `main`.
- Khi hoàn thành task và cần push lên GitHub:
  - **Chỉ push lên branch của Claude** (ví dụ: `claude/workspace`, `claude/<task-name>`, hoặc branch Claude đã có sẵn).
  - **KHÔNG** chạy `gh pr create` hoặc tương đương để mở PR vào `main`.
  - Để user tự review branch trên GitHub và tự quyết định có mở PR hay không.
- Nếu cần tạo branch mới cho 1 task riêng, đặt tên theo format `claude/<mô-tả-ngắn>` và base từ `main` (hoặc branch user chỉ định).
- Nếu user **explicitly** yêu cầu "tạo PR" thì mới được mở PR — mặc định không tự mở.
