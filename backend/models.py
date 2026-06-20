from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255))
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    resumes = relationship("Resume", back_populates="owner")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    parent_id = Column(Integer, ForeignKey("resumes.id"), nullable=True) # For versioning
    file_name = Column(String(255))
    extracted_text = Column(Text)
    ats_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="resumes")
    analysis = relationship("Analysis", back_populates="resume", uselist=False)

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"))
    skills = Column(Text) # Stored as comma-separated string or JSON string
    missing_skills = Column(Text)
    suggestions = Column(Text)
    interview_questions = Column(Text)
    job_match_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    resume = relationship("Resume", back_populates="analysis")

class AnalyticsEvent(Base):
    __tablename__ = 'analytics_events'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    event_type = Column(String(255)) # e.g. 'UPLOAD_RESUME', 'MOCK_INTERVIEW'
    created_at = Column(DateTime, default=datetime.utcnow)

