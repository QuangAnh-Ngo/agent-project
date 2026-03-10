import os
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

async def get_gemini_translation(text: str, context: str):
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
    
    response = model.generate_content(prompt)
    return response.text.strip()