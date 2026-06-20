import json
from ai_service import model

def helper_clean_json(text: str) -> dict:
    if text.startswith("```json"):
        text = text[7:]
    if text.endswith("```"):
        text = text[:-3]
    try:
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        return {}

def compare_resumes_ai(resumes_data: list, job_description: str) -> dict:
    if not model: return {"error": "API not configured"}
    
    prompt = f"""
    You are an expert recruiter. Compare the following resumes against this Job Description:
    {job_description}

    Resumes:
    {json.dumps(resumes_data)}

    Return a JSON object with:
    - "ranked_resumes": list of objects containing "resume_id", "rank", "match_score", "strengths", "weaknesses".
    - "summary": a brief summary of the comparison.
    """
    try:
        resp = model.generate_content(prompt)
        return helper_clean_json(resp.text)
    except Exception as e:
        return {"error": str(e)}

def recommend_jobs_ai(resume_text: str) -> dict:
    if not model: return {"error": "API not configured"}
    
    prompt = f"""
    Based on this resume, recommend 3 suitable job roles.
    Resume: {resume_text}

    Return JSON:
    - "roles": list of objects with "title", "match_percentage", "reason", "learning_roadmap" (array of steps to improve).
    """
    try:
        resp = model.generate_content(prompt)
        return helper_clean_json(resp.text)
    except Exception as e:
        return {"error": str(e)}

def generate_cover_letter_ai(resume_text: str, job_description: str) -> dict:
    if not model: return {"error": "API not configured"}
    
    prompt = f"""
    Write a professional and compelling cover letter using this resume and job description.
    Resume: {resume_text}
    Job Description: {job_description}

    Return JSON:
    - "cover_letter": the full text of the cover letter.
    """
    try:
        resp = model.generate_content(prompt)
        return helper_clean_json(resp.text)
    except Exception as e:
        return {"error": str(e)}

def analyze_linkedin_ai(profile_text: str) -> dict:
    if not model: return {"error": "API not configured"}
    
    prompt = f"""
    Analyze this LinkedIn profile text and provide improvement suggestions.
    Profile: {profile_text}

    Return JSON:
    - "profile_strength": 0 to 100
    - "headline_suggestions": array of strings
    - "about_suggestions": string
    - "skills_to_add": array of strings
    - "general_improvements": array of strings
    """
    try:
        resp = model.generate_content(prompt)
        return helper_clean_json(resp.text)
    except Exception as e:
        return {"error": str(e)}

def evaluate_mock_interview_ai(question: str, answer: str, resume_text: str, job_description: str) -> dict:
    if not model: return {"error": "API not configured"}
    
    prompt = f"""
    You are an expert interviewer. The candidate was asked this question:
    "{question}"
    
    Candidate Answer:
    "{answer}"

    Context (Resume & JD):
    Resume: {resume_text}
    JD: {job_description}

    Evaluate the answer. Return JSON:
    - "score": 0 to 10
    - "feedback": constructive feedback
    - "improved_answer": a better way to answer
    """
    try:
        resp = model.generate_content(prompt)
        return helper_clean_json(resp.text)
    except Exception as e:
        return {"error": str(e)}
