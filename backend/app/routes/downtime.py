from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.downtime import Downtime
from app.models.employee import Employee

router = APIRouter(prefix="/downtime", tags=["downtime"])

@router.get("/")
def get_all_downtimes(db: Session = Depends(get_db)):
    downtimes = db.query(Downtime).order_by(Downtime.created_at.desc()).all()
    result = []
    for d in downtimes:
        reporter = db.query(Employee).filter(Employee.id == d.reported_by).first()
        result.append({
            "id": d.id,
            "job_operation_id": d.job_operation_id,
            "reason": d.reason,
            "duration_minutes": d.duration_minutes,
            "is_approved": d.is_approved,
            "is_recurring": d.is_recurring,
            "technician_notified": d.technician_notified,
            "machine_id": d.machine_id,
            "part_number": d.part_number,
            "created_at": d.created_at,
            "reported_by_name": reporter.name if reporter else None,
        })
    return result

@router.get("/recurring")
def get_recurring_issues(db: Session = Depends(get_db)):
    recurring = db.query(Downtime).filter(Downtime.is_recurring == True).all()
    return [{"machine_id": d.machine_id, "part_number": d.part_number, "reason": d.reason} for d in recurring]