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
    if not model:
        return {
            "error": "Gemini API key not configured",
            "skills": [],
            "missing_skills": [],
            "ats_score": 0,
            "job_match_score": 0,
            "suggestions": "API not configured.",
            "interview_questions": "API not configured."
        }

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
        return {
            "error": str(e),
            "skills": [],
            "missing_skills": [],
            "ats_score": 0,
            "job_match_score": 0,
            "suggestions": "Error processing analysis.",
            "interview_questions": []
        }
