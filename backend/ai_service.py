import os
import json
import time
import logging
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    try:
        models = list(genai.list_models())
        available_models = [m.name for m in models]
        logger.info(f"Available Gemini models: {available_models}")
        
        gen_models = [m.name for m in models if 'generateContent' in m.supported_generation_methods]
        
        selected_model_name = None
        for pref in ["models/gemini-2.5-flash", "models/gemini-2.0-flash"]:
            if pref in gen_models:
                selected_model_name = pref
                break
                
        if not selected_model_name and gen_models:
            selected_model_name = gen_models[0]
            
        if selected_model_name:
            logger.info(f"Using Gemini model: {selected_model_name}")
            model = genai.GenerativeModel(selected_model_name)
        else:
            logger.warning("No generateContent models found.")
            model = None
    except Exception as e:
        logger.error(f"Error initializing Gemini models: {e}")
        model = None
else:
    model = None
    logger.warning("Warning: GEMINI_API_KEY is not set.")

def truncate_text(text: str, max_chars: int = 15000) -> str:
    """Truncates text to approximately 4000 tokens (assuming ~3-4 chars per token)."""
    if len(text) > max_chars:
        logger.warning(f"Truncating text from {len(text)} to {max_chars} chars.")
        return text[:max_chars]
    return text

def analyze_resume_with_ai(resume_text: str, job_description: str = "") -> dict:
    """
    Uses Gemini API to extract skills, find missing skills based on a JD,
    calculate an ATS score, generate suggestions, and formulate interview questions.
    """
    def fallback_analysis(error_msg: str):
        text_lower = resume_text.lower()
        common_skills = ["python", "java", "javascript", "react", "docker", "sql", "aws", "machine learning", "c++", "linux", "html", "css"]
        found_skills = [s for s in common_skills if s in text_lower]
        
        base_score = min(75, len(resume_text) // 50)
        ats_score = min(100, base_score + (len(found_skills) * 2))
        
        return {
            "error": error_msg,
            "skills": found_skills if found_skills else ["Communication", "Problem Solving"],
            "missing_skills": ["Advanced AI", "Cloud Architecture"] if job_description else [],
            "ats_score": ats_score,
            "job_match_score": 50 if job_description else 0,
            "suggestions": "Fallback Analysis: Add more quantifiable achievements.",
            "interview_questions": [
                "Can you describe your experience?",
                "What is your greatest strength?"
            ]
        }

    if not model:
        return fallback_analysis("Gemini API key not configured")

    safe_resume_text = truncate_text(resume_text, max_chars=15000)
    safe_jd_text = truncate_text(job_description, max_chars=10000)

    prompt = f"""
    You are an expert AI Resume Analyzer and Career Coach.
    Please analyze the following resume text.
    
    Resume Text:
    {safe_resume_text}

    Job Description (if any):
    {safe_jd_text}

    Return the analysis strictly as a JSON object with the following keys:
    - "skills": a list of strings representing the skills found in the resume.
    - "missing_skills": a list of strings representing skills missing from the resume based on the job description (if provided).
    - "ats_score": a number from 0 to 100 indicating how well the resume is written. Be strict and realistic.
    - "job_match_score": a number from 0 to 100 indicating how well the resume matches the job description (0 if no job description).
    - "suggestions": a string with 2-3 sentences on how to improve the resume, being specific to the text.
    - "interview_questions": a list of 3-5 potential interview questions based on the resume.

    Ensure the response is valid JSON. Do not include markdown formatting like ```json or ```.
    """

    max_retries = 3
    base_delay = 2

    for attempt in range(max_retries):
        try:
            start_time = time.time()
            logger.info(f"Attempt {attempt + 1}: Sending request to Gemini API...")
            
            response = model.generate_content(prompt, request_options={"timeout": 120})
            
            duration = time.time() - start_time
            logger.info(f"Gemini API request succeeded in {duration:.2f} seconds.")

            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]

            data = json.loads(response_text)
            return data
            
        except Exception as e:
            duration = time.time() - start_time
            logger.warning(f"Attempt {attempt + 1} failed after {duration:.2f} seconds. Error: {str(e)}")
            
            if attempt < max_retries - 1:
                sleep_time = base_delay ** (attempt + 1)
                logger.info(f"Retrying in {sleep_time} seconds...")
                time.sleep(sleep_time)
            else:
                logger.error("All Gemini API retries failed.")
                return {"error": "AI Analysis is currently unavailable due to high demand. Please try again later."}
