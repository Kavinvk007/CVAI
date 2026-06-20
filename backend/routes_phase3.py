from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import models
from database import get_db
from auth import get_current_user
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import csv

router = APIRouter(prefix="/api/v3", tags=["v3_analytics_exports"])

# Track Analytics Event Helper
def track_event(db: Session, user_id: int, event_type: str):
    try:
        new_event = models.AnalyticsEvent(user_id=user_id, event_type=event_type)
        db.add(new_event)
        db.commit()
    except Exception as e:
        print("Failed to track event:", e)

@router.get("/analytics/dashboard")
def get_analytics_dashboard(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Example aggregations
    total_resumes = db.query(models.Resume).count()
    avg_ats = db.query(func.avg(models.Resume.ats_score)).scalar() or 0
    event_counts = db.query(models.AnalyticsEvent.event_type, func.count(models.AnalyticsEvent.id)).group_by(models.AnalyticsEvent.event_type).all()
    
    return {
        "total_resumes": total_resumes,
        "average_ats_score": round(avg_ats, 2),
        "events": {e[0]: e[1] for e in event_counts}
    }

@router.get("/resume/{resume_id}/versions")
def get_resume_versions(resume_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Find all resumes that share the same parent_id or where this resume is the parent
    r = db.query(models.Resume).filter(models.Resume.id == resume_id, models.Resume.user_id == current_user.id).first()
    if not r: raise HTTPException(status_code=404, detail="Resume not found")
    
    target_id = r.parent_id if r.parent_id else r.id
    versions = db.query(models.Resume).filter((models.Resume.id == target_id) | (models.Resume.parent_id == target_id)).order_by(models.Resume.created_at.desc()).all()
    
    return [{"id": v.id, "file_name": v.file_name, "ats_score": v.ats_score, "created_at": v.created_at} for v in versions]

@router.get("/export/pdf/{resume_id}")
def export_pdf(resume_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(models.Resume).filter(models.Resume.id == resume_id, models.Resume.user_id == current_user.id).first()
    if not r: raise HTTPException(status_code=404, detail="Resume not found")
    
    track_event(db, current_user.id, 'EXPORT_PDF')
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.drawString(100, 750, f"CVAI Resume Analysis Report")
    p.drawString(100, 730, f"User: {current_user.name}")
    p.drawString(100, 710, f"File: {r.file_name}")
    p.drawString(100, 690, f"ATS Score: {r.ats_score}%")
    
    analysis = db.query(models.Analysis).filter(models.Analysis.resume_id == r.id).first()
    if analysis:
        p.drawString(100, 650, "Suggestions:")
        # Simple text wrap logic (not robust but works for demo)
        suggs = analysis.suggestions.split('.')
        y = 630
        for s in suggs:
            if len(s.strip()) > 0:
                p.drawString(100, y, f"- {s.strip()[:80]}...")
                y -= 20

    p.showPage()
    p.save()
    buffer.seek(0)
    
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=Analysis_{resume_id}.pdf"})

@router.get("/export/csv/users")
def export_csv_users(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    track_event(db, current_user.id, 'EXPORT_CSV_USERS')

    users = db.query(models.User).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["ID", "Name", "Email", "Is Admin", "Created At"])
    for u in users:
        writer.writerow([u.id, u.name, u.email, u.is_admin, u.created_at])
    
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=users.csv"})
