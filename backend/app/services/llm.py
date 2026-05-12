import os
from functools import lru_cache
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

# Hàm kiểm tra biến môi trường (Giúp bạn biết ngay nếu quên config .env)
def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"⚠️ Thiếu biến môi trường: {name}")
    return value

# Tạo Client dùng chung (Singleton) để tiết kiệm tài nguyên
@lru_cache(maxsize=1)
def _get_llm_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=_require_env("LLM_API_KEY"),
        base_url=_require_env("LLM_BASE_URL"),
    )

def _get_model_name() -> str:
    return _require_env("LLM_MODEL")

# HÀM CHÍNH: Xử lý cả Dịch và Hỏi (Sprint 4.6)
async def get_ai_response(text: str, context: str, question: str = None, task: str = "translate") -> str:
    if task == "translate":
        system_msg = "You are an expert technical translator from English to Vietnamese."
        prompt = f"""
        Task: Translate the following English text into professional Vietnamese.
        Constraints:
        1. Preserve EXACT paragraph structure and line breaks.
        2. Use the provided context for technical accuracy.
        3. Return ONLY the translated text.

        Context: {context}
        Text: "{text}"
        """
    else:
        system_msg = "You are a helpful AI Assistant analyzing webpage content."
        prompt = f"""
        Task: Answer the user's question about the highlighted text based on the provided webpage context.
        
        Highlighted Text: "{text}"
        User Question: "{question}"
        Web Context: {context}

        Requirements: Answer in Vietnamese, be concise and technical.
        """

    # Đây là nơi lỗi UndefinedVariable biến mất vì hàm đã được định nghĩa ở trên
    response = await _get_llm_client().chat.completions.create(
        model=_get_model_name(),
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content.strip()
