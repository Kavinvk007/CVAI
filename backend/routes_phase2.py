from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import models
from database import get_db
from ai_features import (
    compare_resumes_ai,
    recommend_jobs_ai,
    generate_cover_letter_ai,
    analyze_linkedin_ai,
    evaluate_mock_interview_ai
)

from auth import get_current_user

router = APIRouter(prefix="/api/v2", tags=["v2_features"])

class CompareRequest(BaseModel):
    resume_ids: List[int]
    job_description: str

@router.post("/compare")
def compare_resumes(req: CompareRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    resumes_data = []
    for rid in req.resume_ids:
        r = db.query(models.Resume).filter(models.Resume.id == rid, models.Resume.user_id == current_user.id).first()
        if r:
            resumes_data.append({"resume_id": r.id, "text": r.extracted_text})
    if len(resumes_data) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 valid resumes to compare.")
    
    result = compare_resumes_ai(resumes_data, req.job_description)
    return result

@router.get("/recommend-jobs/{resume_id}")
def recommend_jobs(resume_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(models.Resume).filter(models.Resume.id == resume_id, models.Resume.user_id == current_user.id).first()
    if not r: raise HTTPException(status_code=404, detail="Resume not found")
    return recommend_jobs_ai(r.extracted_text)

class CoverLetterReq(BaseModel):
    resume_id: int
    job_description: str

@router.post("/cover-letter")
def generate_cover_letter(req: CoverLetterReq, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(models.Resume).filter(models.Resume.id == req.resume_id, models.Resume.user_id == current_user.id).first()
    if not r: raise HTTPException(status_code=404, detail="Resume not found")
    return generate_cover_letter_ai(r.extracted_text, req.job_description)

class LinkedInReq(BaseModel):
    profile_text: str

@router.post("/linkedin-analyzer")
def analyze_linkedin(req: LinkedInReq, current_user: models.User = Depends(get_current_user)):
    return analyze_linkedin_ai(req.profile_text)

class MockInterviewReq(BaseModel):
    resume_id: int
    job_description: str
    question: str
    answer: str

@router.post("/mock-interview/evaluate")
def evaluate_mock_interview(req: MockInterviewReq, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(models.Resume).filter(models.Resume.id == req.resume_id, models.Resume.user_id == current_user.id).first()
    if not r: raise HTTPException(status_code=404, detail="Resume not found")
    return evaluate_mock_interview_ai(req.question, req.answer, r.extracted_text, req.job_description)
