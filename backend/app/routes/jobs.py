from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.job import Job, JobOperation
from app.models.plant import Plant
from datetime import datetime

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/")
def get_all_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    result = []
    for job in jobs:
        days_until_due = (job.due_date - datetime.utcnow()).days if job.due_date else None
        is_at_risk = days_until_due is not None and days_until_due < 3 and job.status != "shipped"
        result.append({
            "id": job.id,
            "job_number": job.job_number,
            "part_number": job.part_number,
            "part_name": job.part_name,
            "quantity": job.quantity,
            "customer": job.customer,
            "due_date": job.due_date,
            "predicted_ship_date": job.predicted_ship_date,
            "status": job.status,
            "priority": job.priority,
            "current_operation": job.current_operation,
            "current_plant_id": job.current_plant_id,
            "days_until_due": days_until_due,
            "is_at_risk": is_at_risk,
        })
    return result

@router.get("/summary")
def get_jobs_summary(db: Session = Depends(get_db)):
    total = db.query(Job).count()
    in_progress = db.query(Job).filter(Job.status == "in_progress").count()
    delayed = db.query(Job).filter(Job.status == "delayed").count()
    shipped = db.query(Job).filter(Job.status == "shipped").count()
    at_risk = db.query(Job).filter(
        Job.status != "shipped",
        Job.due_date < datetime.utcnow()
    ).count()

    return {
        "total": total,
        "in_progress": in_progress,
        "delayed": delayed,
        "shipped": shipped,
        "at_risk": at_risk,
    }

@router.get("/{job_id}")
def get_job_detail(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        return {"error": "Job not found"}
    
    operations = db.query(JobOperation).filter(
        JobOperation.job_id == job_id
    ).order_by(JobOperation.sequence).all()

    ops_data = []
    for op in operations:
        variance = None
        if op.actual_time_minutes and op.predicted_time_minutes:
            variance = round(op.actual_time_minutes - op.predicted_time_minutes, 1)
        ops_data.append({
            "id": op.id,
            "operation_name": op.operation_name,
            "plant_id": op.plant_id,
            "sequence": op.sequence,
            "predicted_time_minutes": op.predicted_time_minutes,
            "actual_time_minutes": op.actual_time_minutes,
            "setup_time_minutes": op.setup_time_minutes,
            "status": op.status,
            "start_time": op.start_time,
            "end_time": op.end_time,
            "parts_completed": op.parts_completed,
            "variance_minutes": variance,
        })

    return {
        "id": job.id,
        "job_number": job.job_number,
        "part_number": job.part_number,
        "part_name": job.part_name,
        "quantity": job.quantity,
        "customer": job.customer,
        "due_date": job.due_date,
        "predicted_ship_date": job.predicted_ship_date,
        "status": job.status,
        "priority": job.priority,
        "current_operation": job.current_operation,
        "operations": ops_data,
    }