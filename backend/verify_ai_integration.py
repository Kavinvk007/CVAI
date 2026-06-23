import os
import sys
import json

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

# Import the functions we want to test
from ai_service import analyze_resume_with_ai
from ai_features import recommend_jobs_ai, evaluate_mock_interview_ai
import google.generativeai as genai

def run_verification():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key in ["your_gemini_api_key_here", "your_real_key"]:
        print("❌ ERROR: Real GEMINI_API_KEY not found in .env.")
        print("Please configure your Google AI Studio key in backend/.env before running this script.")
        return

    print("✅ Real GEMINI_API_KEY found. Beginning Verification...\n")
    
    # 1. Verify Gemini connection
    print("--- 1. Verifying Gemini Connection ---")
    try:
        genai.configure(api_key=api_key)
        
        models = list(genai.list_models())
        gen_models = [m.name for m in models if 'generateContent' in m.supported_generation_methods]
        selected_model_name = None
        for pref in ["models/gemini-2.5-flash", "models/gemini-2.0-flash"]:
            if pref in gen_models:
                selected_model_name = pref
                break
        if not selected_model_name and gen_models:
            selected_model_name = gen_models[0]
            
        if not selected_model_name:
            print("❌ No valid generateContent models found.")
            return

        print(f"Using model: {selected_model_name}")
        model = genai.GenerativeModel(selected_model_name)
        res = model.generate_content("Reply with exactly the word: 'CONNECTED'")
        if "CONNECTED" in res.text:
            print("✅ Connection Successful.")
        else:
            print(f"⚠️ Connection succeeded but unexpected response: {res.text}")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        return

    resume_text = "Experienced Software Engineer with 5 years in Python, React, and AWS. Built scalable microservices."
    job_desc = "Looking for a Software Engineer proficient in Python, AWS, and Docker."

    # 2. Test ATS Analysis & 3. Skill Extraction
    print("\n--- 2 & 3. Testing ATS Analysis & Skill Extraction ---")
    analysis = analyze_resume_with_ai(resume_text, job_desc)
    if "error" in analysis:
        print(f"❌ Analysis failed: {analysis['error']}")
    else:
        print("✅ Analysis Successful.")
        print(f"   ATS Score: {analysis.get('ats_score')}")
        print(f"   Extracted Skills: {analysis.get('skills')}")
        print(f"   Missing Skills: {analysis.get('missing_skills')}")
        if analysis.get('ats_score') and analysis.get('skills'):
             print("✅ Skill extraction and ATS logic verified.")

    # 4. Test Job Matching
    print("\n--- 4. Testing Job Matching (Recommendations) ---")
    recs = recommend_jobs_ai(resume_text)
    if "error" in recs:
         print(f"❌ Job Matching failed: {recs['error']}")
    else:
         print("✅ Job Matching Successful.")
         roles = recs.get("roles", [])
         for r in roles:
             print(f"   - {r.get('title')} ({r.get('match_percentage')}%)")

    # 5. Test Resume Chatbot
    print("\n--- 5. Testing Resume Chatbot ---")
    # For chatbot, we usually just call the model with a custom prompt in the route.
    # Let's do a direct test like the route does.
    chat_prompt = f"Based on this resume: '{resume_text}', answer: What are my core skills?"
    try:
        chat_res = model.generate_content(chat_prompt)
        print("✅ Chatbot Response Successful.")
        print(f"   Bot: {chat_res.text.strip()}")
    except Exception as e:
        print(f"❌ Chatbot Failed: {e}")

    # 6. Test Mock Interview Evaluation
    print("\n--- 6. Testing Mock Interview Evaluation ---")
    question = "Can you describe a time you built a scalable system?"
    answer = "I built microservices using Python and AWS which scaled well."
    eval_res = evaluate_mock_interview_ai(question, answer, resume_text, job_desc)
    if "error" in eval_res:
         print(f"❌ Mock Interview failed: {eval_res['error']}")
    else:
         print("✅ Mock Interview Evaluation Successful.")
         print(f"   Score: {eval_res.get('score')}/10")
         print(f"   Feedback: {eval_res.get('feedback')}")
         print(f"   Improved: {eval_res.get('improved_answer')}")

    # 7. Confirm Real Responses
    print("\n--- 7. Confirming Real Gemini Responses ---")
    print("If the above outputs contain dynamic, context-aware text (not generic fallback arrays), the system is confirmed to be using REAL Gemini AI.")

    print("\n🎉 VERIFICATION COMPLETE 🎉")

if __name__ == "__main__":
    run_verification()
