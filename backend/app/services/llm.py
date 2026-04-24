import os
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

async def get_gemini_translation(text: str, context: str):
    prompt = f"""
    Role: Expert Technical Translator specializing in Computer Science and Software Development.
    Task: Translate the provided English text into natural, professional Vietnamese.

    INPUT DATA:
    - Text to translate: "{text}"
    - Reference Context (from RAG): 
    ---
    {context}
    ---

    STRICT REQUIREMENTS FOR SPRINT 4.2:
    1. FORMATTING: You MUST preserve the EXACT paragraph structure, line breaks, and any list formatting (bullets/numbers) of the original text.
    2. TERMINOLOGY: Use the provided "Reference Context" to ensure technical terms are translated accurately according to the article's theme.
    3. TONE: The Vietnamese output should be natural, fluid, and suitable for a technical audience (avoiding overly literal or clunky translations).
    4. OUTPUT: Return ONLY the raw translated text. No introductions, no markdown code blocks (```), and no post-translation explanations.

    Translation:
    """
    
    response = model.generate_content(prompt)
    return response.text.strip()