## LLM Provider Configuration (OpenAI SDK Compatible)

Backend now calls LLM via OpenAI SDK-compatible API and reads all provider settings from `.env`.

### Required environment variables

```env
LLM_BASE_URL=<provider_openai_compatible_base_url>
LLM_MODEL=<provider_model_name>
LLM_API_KEY=<provider_api_key>
```

### Current default (Gemini OpenAI-compatible endpoint)

```env
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
LLM_MODEL=gemini-2.5-flash
LLM_API_KEY=your_gemini_api_key
```

### How to switch provider

1. Update `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_API_KEY` in `.env`.
2. Restart backend service.
3. Keep using the same endpoint: `POST /api/v1/translate`.

No backend code changes are needed when switching providers, as long as the provider supports OpenAI-compatible Chat Completions API.
