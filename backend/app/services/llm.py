import os
from functools import lru_cache

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


@lru_cache(maxsize=1)
def _get_llm_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=_require_env("LLM_API_KEY"),
        base_url=_require_env("LLM_BASE_URL"),
    )


def _get_model_name() -> str:
    return _require_env("LLM_MODEL")


async def get_translation(text: str, context: str) -> str:
    prompt = f"""
    Role: Expert Technical Translator.
    Task: Translate the following English text into natural Vietnamese.

    Text to translate: "{text}"

    Context from the article:
    ---
    {context}
    ---

    Requirements:
    1. Use appropriate technical terminology based on the context.
    2. Ensure the translation is natural and professional.
    3. Return ONLY the translated text, no explanations.
    """

    response = await _get_llm_client().chat.completions.create(
        model=_get_model_name(),
        messages=[
            {
                "role": "system",
                "content": "You are an expert technical translator from English to Vietnamese.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    if not response.choices:
        raise RuntimeError("LLM provider returned no choices")

    content = response.choices[0].message.content
    if not content:
        raise RuntimeError("LLM provider returned empty content")

    return content.strip()