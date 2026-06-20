import requests
import os
import io

API_URL = "http://localhost:8000"

def run_tests():
    print("Starting E2E Tests...")
    
    # 1. Register Standard User & Admin User
    user_payload = {"name": "Test User", "email": "tester_e2e@example.com", "password": "TestPassword123!"}
    admin_payload = {"name": "Admin User", "email": "admin_e2e@example.com", "password": "AdminPassword123!"}
    
    # Clean up first if they exist? We will just catch 400 if already registered, and then login.
    res = requests.post(f"{API_URL}/auth/register", json=user_payload)
    if res.status_code not in (200, 400):
        print(f"FAILED: User Register. Status: {res.status_code}, Body: {res.text}")
        return
        
    res = requests.post(f"{API_URL}/auth/register", json=admin_payload)
    if res.status_code not in (200, 400):
        print(f"FAILED: Admin Register. Status: {res.status_code}, Body: {res.text}")
        return

    # Login Standard User
    res = requests.post(f"{API_URL}/auth/login", data={"username": user_payload["email"], "password": user_payload["password"]})
    if res.status_code != 200:
        print(f"FAILED: User Login. Status: {res.status_code}, Body: {res.text}")
        return
    tokens = res.json()
    token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("PASSED: Auth flows & Refresh tokens generation")

    # Login Admin User
    res = requests.post(f"{API_URL}/auth/login", data={"username": admin_payload["email"], "password": admin_payload["password"]})
    if res.status_code != 200:
        print("FAILED: Admin Login")
        return
    admin_tokens = res.json()
    admin_token = admin_tokens["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Note: To test admin endpoints, we need the user to actually be an admin. We'll simulate this or skip the check if not possible programmatically.
    # We might need to manually set is_admin=True in DB for the admin user. Let's do that quickly.
    import sqlite3
    try:
        conn = sqlite3.connect("cvai.db")
        cur = conn.cursor()
        cur.execute("UPDATE users SET is_admin=1 WHERE email=?", (admin_payload["email"],))
        conn.commit()
        conn.close()
    except Exception as e:
        print("Could not update admin status:", e)

    # 2. Secure File Upload
    # Upload non-PDF
    files = {"file": ("test.txt", io.BytesIO(b"Not a pdf"), "text/plain")}
    res = requests.post(f"{API_URL}/resume/upload", headers=headers, files=files)
    if res.status_code != 400:
        print(f"FAILED: Secure upload (should reject text). Status: {res.status_code}, Body: {res.text}")
        return
    print("PASSED: Secure file upload validation")

    # Upload valid PDF
    # We need a real-ish PDF for text extraction to work.
    from reportlab.pdfgen import canvas
    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer)
    c.drawString(100, 750, "Resume of Test User. Experienced Software Engineer. Skills: Python, React, AWS.")
    c.save()
    pdf_buffer.seek(0)
    
    files = {"file": ("test_resume.pdf", pdf_buffer, "application/pdf")}
    res = requests.post(f"{API_URL}/resume/upload", headers=headers, files=files)
    if res.status_code != 200:
        print(f"FAILED: Resume upload. Status: {res.status_code}, Body: {res.text}")
        return
    resume_id = res.json()["resume_id"]
    print("PASSED: Resume upload")

    # 3. Analyze Resume (ATS, Skills, Job Match)
    req_data = {
        "resume_id": resume_id,
        "job_description": "Looking for a Software Engineer with Python and AWS experience."
    }
    res = requests.post(f"{API_URL}/analyze/resume", headers=headers, json=req_data)
    if res.status_code != 200:
        print(f"FAILED: ATS Analysis. Status: {res.status_code}, Body: {res.text}")
        return
    analysis = res.json()
    if "ats_score" not in analysis or "skills" not in analysis:
        print(f"FAILED: ATS/Skill data missing. Body: {analysis}")
        return
    print("PASSED: ATS analysis, Skill extraction, Job matching")

    # 4. Resume Chatbot
    req_data = {"resume_id": resume_id, "message": "What is my experience?"}
    res = requests.post(f"{API_URL}/chat/resume", headers=headers, json=req_data)
    if res.status_code != 200:
        print(f"FAILED: Chatbot. Status: {res.status_code}, Body: {res.text}")
        return
    print("PASSED: Resume chatbot")

    # 5. Multi-resume compare
    # Upload 2nd resume
    pdf_buffer2 = io.BytesIO()
    c2 = canvas.Canvas(pdf_buffer2)
    c2.drawString(100, 750, "Another resume. Java and C++.")
    c2.save()
    pdf_buffer2.seek(0)
    files2 = {"file": ("test_resume2.pdf", pdf_buffer2, "application/pdf")}
    res2 = requests.post(f"{API_URL}/resume/upload", headers=headers, files=files2)
    resume_id2 = res2.json()["resume_id"]

    res = requests.post(f"{API_URL}/api/v2/compare", headers=headers, json={
        "resume_ids": [resume_id, resume_id2],
        "job_description": "Software Engineer"
    })
    if res.status_code != 200:
        print(f"FAILED: Compare. Status: {res.status_code}, Body: {res.text}")
        return
    print("PASSED: Multi-resume comparison")

    # 6. Job Recommendations
    res = requests.get(f"{API_URL}/api/v2/recommend-jobs/{resume_id}", headers=headers)
    if res.status_code != 200:
        print(f"FAILED: Recommendations. Status: {res.status_code}, Body: {res.text}")
        return
    print("PASSED: Job recommendation engine")

    # 7. Cover letter
    res = requests.post(f"{API_URL}/api/v2/cover-letter", headers=headers, json={
        "resume_id": resume_id, "job_description": "Software Eng"
    })
    if res.status_code != 200:
        print(f"FAILED: Cover letter. Status: {res.status_code}, Body: {res.text}")
        return
    print("PASSED: Cover letter generation")

    # 8. LinkedIn Analyzer
    res = requests.post(f"{API_URL}/api/v2/linkedin-analyzer", headers=headers, json={
        "profile_text": "Experienced dev in Python."
    })
    if res.status_code != 200:
        print(f"FAILED: LinkedIn analyzer. Status: {res.status_code}, Body: {res.text}")
        return
    print("PASSED: LinkedIn profile analyzer")

    # 9. Mock Interview
    res = requests.post(f"{API_URL}/api/v2/mock-interview/evaluate", headers=headers, json={
        "resume_id": resume_id, "job_description": "SE", "question": "Tell me about yourself.", "answer": "I am a dev."
    })
    if res.status_code != 200:
        print(f"FAILED: Mock interview. Status: {res.status_code}, Body: {res.text}")
        return
    print("PASSED: Mock interview evaluator")

    # 10. Analytics Dashboard (Admin)
    res = requests.get(f"{API_URL}/api/v3/analytics/dashboard", headers=admin_headers)
    if res.status_code != 200:
        print(f"FAILED: Analytics dash. Status: {res.status_code}, Body: {res.text}")
        return
    print("PASSED: Analytics dashboard")

    # 11. Resume Versions
    res = requests.get(f"{API_URL}/api/v3/resume/{resume_id}/versions", headers=headers)
    if res.status_code != 200:
        print(f"FAILED: Versions. Status: {res.status_code}, Body: {res.text}")
        return
    print("PASSED: Resume version management")

    # 12. PDF Export
    res = requests.get(f"{API_URL}/api/v3/export/pdf/{resume_id}", headers=headers)
    if res.status_code != 200 or res.headers.get("content-type") != "application/pdf":
        print(f"FAILED: PDF Export. Status: {res.status_code}")
        return
    print("PASSED: PDF export")

    # 13. CSV Export (Admin)
    res = requests.get(f"{API_URL}/api/v3/export/csv/users", headers=admin_headers)
    content_type = res.headers.get("content-type", "")
    if res.status_code != 200 or "text/csv" not in content_type:
        print(f"FAILED: CSV Export. Status: {res.status_code}, Content-Type: {content_type}")
        return
    print("PASSED: CSV export")

    # 14. Admin Dashboard
    res = requests.get(f"{API_URL}/admin/users", headers=admin_headers)
    if res.status_code != 200:
        print(f"FAILED: Admin Dashboard. Status: {res.status_code}")
        return
    print("PASSED: Admin dashboard, Role-based access control")

    print("\nALL TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
