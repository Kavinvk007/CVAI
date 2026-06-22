import os
import sys
import json
from datetime import datetime, timedelta

# Add the backend directory to sys.path to allow importing from models and database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User, Resume, Analysis, AnalyticsEvent
from auth import get_password_hash

def seed_demo_data():
    db = SessionLocal()
    try:
        demo_email = "demo@cvai.com"
        demo_password = "DemoPassword123!"
        
        # Check if demo user exists
        user = db.query(User).filter(User.email == demo_email).first()
        if not user:
            hashed_password = get_password_hash(demo_password)
            user = User(
                name="Demo User",
                email=demo_email,
                password_hash=hashed_password,
                is_admin=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created demo user: {demo_email}")
        else:
            print(f"Demo user already exists.")

        # Check if demo resume exists
        resume = db.query(Resume).filter(Resume.user_id == user.id).first()
        if not resume:
            resume = Resume(
                user_id=user.id,
                file_name="Jane_Doe_Software_Engineer.pdf",
                extracted_text="Jane Doe\nSoftware Engineer\nExperience: 5 years in Python, React, AWS.\nBuilt scalable microservices and increased revenue by 20%.",
                ats_score=85.0
            )
            db.add(resume)
            db.commit()
            db.refresh(resume)
            
            analysis = Analysis(
                resume_id=resume.id,
                skills=json.dumps(["Python", "React", "AWS", "Microservices"]),
                missing_skills=json.dumps(["Docker", "Kubernetes"]),
                suggestions="Add more quantitative results to your recent roles. Mention containerization experience if applicable.",
                interview_questions=json.dumps([
                    "Can you describe a microservice architecture you designed?",
                    "How did your work increase revenue by 20%?"
                ]),
                job_match_score=80.0
            )
            db.add(analysis)
            
            # Add some analytics events over the past 7 days
            events = [
                AnalyticsEvent(user_id=user.id, event_type='UPLOAD_RESUME', created_at=datetime.utcnow() - timedelta(days=6)),
                AnalyticsEvent(user_id=user.id, event_type='MOCK_INTERVIEW', created_at=datetime.utcnow() - timedelta(days=5)),
                AnalyticsEvent(user_id=user.id, event_type='LINKEDIN_ANALYSIS', created_at=datetime.utcnow() - timedelta(days=2)),
                AnalyticsEvent(user_id=user.id, event_type='COVER_LETTER_GEN', created_at=datetime.utcnow() - timedelta(days=1))
            ]
            db.add_all(events)
            db.commit()
            print("Successfully seeded demo resume and analytics data.")
        else:
            print("Demo data already seeded.")
            
    except Exception as e:
        print(f"Error seeding demo data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
