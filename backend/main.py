from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models
import auth

from resume_parser import extract_text_from_pdf
from ai_service import analyze_resume_with_ai
from rag_service import add_resume_to_rag, ask_resume_question
import json
import logging
import mimetypes
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CVAI API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from auth import verify_password, get_password_hash, create_access_token, get_current_user, oauth2_scheme

# --- AUTH ROUTES ---
from pydantic import BaseModel, EmailStr, field_validator
import re

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator('password')
    @classmethod
    def password_complexity(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v) > 72:
            raise ValueError('Password cannot exceed 72 characters')
        if not re.search(r"[A-Z]", v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r"[a-z]", v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r"[0-9]", v):
            raise ValueError('Password must contain at least one number')
        return v

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    is_admin: bool

@app.post("/auth/register", response_model=UserResponse)
@limiter.limit("5/minute")
def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(name=user.name, email=user.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login")
@limiter.limit("10/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = auth.create_refresh_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name
    }

# --- RESUME ROUTES ---
@app.post("/resume/upload")
@limiter.limit("10/minute")
async def upload_resume(request: Request, file: UploadFile = File(...), current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs are allowed.")
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")

    contents = await file.read()
    if file.filename.endswith(".pdf"):
        text = extract_text_from_pdf(contents)
    else:
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    if not text:
         raise HTTPException(status_code=400, detail="Failed to extract text from PDF")
        
    resume = models.Resume(user_id=current_user.id, file_name=file.filename, extracted_text=text)
    db.add(resume)
    db.commit()
    db.refresh(resume)
    
    # Add to RAG
    add_resume_to_rag(resume.id, text)
    
    return {"message": "Resume uploaded successfully", "resume_id": resume.id}

@app.get("/resume/{id}")
def get_resume(id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == id, models.Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    analysis = db.query(models.Analysis).filter(models.Analysis.resume_id == id).first()
    
    return {
        "id": resume.id,
        "file_name": resume.file_name,
        "created_at": resume.created_at,
        "has_analysis": analysis is not None
    }

@app.get("/user/resumes")
def get_user_resumes(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    resumes = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).all()
    return resumes

# --- ANALYSIS ROUTES ---
class AnalysisRequest(BaseModel):
    resume_id: int
    job_description: str = ""

@app.post("/analyze/resume")
def analyze_resume(req: AnalysisRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == req.resume_id, models.Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    logger.info(f"Analyzing resume {resume.id} with JD: {req.job_description}")
    
    result = analyze_resume_with_ai(resume.extracted_text, req.job_description)
    
    if "error" in result:
        logger.warning(f"AI Analysis returned an error (fallback used): {result['error']}")

    # Convert lists to strings for DB storage
    skills_str = json.dumps(result.get("skills", []))
    missing_skills_str = json.dumps(result.get("missing_skills", []))
    questions_str = json.dumps(result.get("interview_questions", []))
    
    # Update resume ATS score
    resume.ats_score = result.get("ats_score", 0)
    db.commit()

    # Create or update analysis
    analysis = db.query(models.Analysis).filter(models.Analysis.resume_id == resume.id).first()
    if analysis:
        analysis.skills = skills_str
        analysis.missing_skills = missing_skills_str
        analysis.suggestions = result.get("suggestions", "")
        analysis.interview_questions = questions_str
        analysis.job_match_score = result.get("job_match_score", 0)
    else:
        analysis = models.Analysis(
            resume_id=resume.id,
            skills=skills_str,
            missing_skills=missing_skills_str,
            suggestions=result.get("suggestions", ""),
            interview_questions=questions_str,
            job_match_score=result.get("job_match_score", 0)
        )
        db.add(analysis)
    
    db.commit()
    db.refresh(analysis)
    return result

@app.get("/analyze/{resume_id}")
def get_analysis(resume_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
     resume = db.query(models.Resume).filter(models.Resume.id == resume_id, models.Resume.user_id == current_user.id).first()
     if not resume:
         raise HTTPException(status_code=404, detail="Resume not found")
         
     analysis = db.query(models.Analysis).filter(models.Analysis.resume_id == resume_id).first()
     if not analysis:
         raise HTTPException(status_code=404, detail="Analysis not found")
         
     return {
         "ats_score": resume.ats_score,
         "skills": json.loads(analysis.skills) if analysis.skills else [],
         "missing_skills": json.loads(analysis.missing_skills) if analysis.missing_skills else [],
         "suggestions": analysis.suggestions,
         "interview_questions": json.loads(analysis.interview_questions) if analysis.interview_questions else [],
         "job_match_score": analysis.job_match_score
     }

# --- CHAT ROUTES ---
class ChatRequest(BaseModel):
    resume_id: int
    message: str

@app.post("/chat/resume")
def chat_resume(req: ChatRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == req.resume_id, models.Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    answer = ask_resume_question(req.resume_id, req.message)
    return {"reply": answer}

# --- ADMIN ROUTES ---
@app.get("/admin/users")
def get_admin_users(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    users = db.query(models.User).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "created_at": u.created_at} for u in users]

@app.get("/admin/analytics")
def get_admin_analytics(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    total_users = db.query(models.User).count()
    total_resumes = db.query(models.Resume).count()
    total_analyses = db.query(models.Analysis).count()
    return {
        "total_users": total_users,
        "total_resumes": total_resumes,
        "total_analyses": total_analyses
    }

from routes_phase2 import router as phase2_router
app.include_router(phase2_router)

from routes_phase3 import router as phase3_router
app.include_router(phase3_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
