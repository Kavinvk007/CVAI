import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    model = None
    print("Warning: GEMINI_API_KEY is not set.")

def analyze_resume_with_ai(resume_text: str, job_description: str = "") -> dict:
    """
    Uses Gemini API to extract skills, find missing skills based on a JD,
    calculate an ATS score, generate suggestions, and formulate interview questions.
    """
    def fallback_analysis(error_msg: str):
        # Basic fallback logic to ensure frontend receives useful mock data
        text_lower = resume_text.lower()
        common_skills = ["python", "java", "javascript", "react", "docker", "sql", "aws", "machine learning", "c++", "linux", "html", "css"]
        found_skills = [s for s in common_skills if s in text_lower]
        
        # Calculate a mock score based on text length and found skills
        base_score = min(75, len(resume_text) // 50)
        ats_score = min(100, base_score + (len(found_skills) * 2))
        
        return {
            "error": error_msg,
            "skills": found_skills if found_skills else ["Communication", "Problem Solving"],
            "missing_skills": ["Advanced AI", "Cloud Architecture"] if job_description else [],
            "ats_score": ats_score,
            "job_match_score": 50 if job_description else 0,
            "suggestions": "Fallback Analysis: Add more quantifiable achievements. " + error_msg,
            "interview_questions": [
                "Can you describe your experience?",
                "What is your greatest strength?"
            ]
        }

    if not model:
        return fallback_analysis("Gemini API key not configured")

    prompt = f"""
    You are an expert AI Resume Analyzer and Career Coach.
    Please analyze the following resume text.
    
    Resume Text:
    {resume_text}

    Job Description (if any):
    {job_description}

    Return the analysis strictly as a JSON object with the following keys:
    - "skills": a list of strings representing the skills found in the resume.
    - "missing_skills": a list of strings representing skills missing from the resume based on the job description (if provided).
    - "ats_score": a number from 0 to 100 indicating how well the resume is written.
    - "job_match_score": a number from 0 to 100 indicating how well the resume matches the job description (0 if no job description).
    - "suggestions": a string with 2-3 sentences on how to improve the resume.
    - "interview_questions": a list of 3-5 potential interview questions based on the resume.

    Ensure the response is valid JSON. Do not include markdown formatting like ```json or ```.
    """

    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Strip potential markdown formatting from Gemini response
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        data = json.loads(response_text)
        return data
    except Exception as e:
        print(f"Error in Gemini AI analysis: {e}")
        return fallback_analysis(str(e))
