from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.job import Job, JobOperation
from app.models.overtime import OvertimePost, OvertimeBid
from app.models.employee import Employee
from app.services.prediction import (
    get_delay_risk_score,
    predict_ship_date,
    get_shipping_target_prediction,
    get_truck_dispatch_alerts
)
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/ai", tags=["AI Insights"])

# ---------- AI ENDPOINTS ----------

@router.get("/shipping-target")
def shipping_target(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    return get_shipping_target_prediction(jobs)

@router.get("/truck-alerts")
def truck_alerts(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    operations_by_job = {}
    for job in jobs:
        ops = db.query(JobOperation).filter(
            JobOperation.job_id == job.id
        ).order_by(JobOperation.sequence).all()
        operations_by_job[job.id] = ops
    return get_truck_dispatch_alerts(jobs, operations_by_job)

@router.get("/delay-risks")
def delay_risks(db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.status != "shipped").all()
    results = []
    for job in jobs:
        ops = db.query(JobOperation).filter(
            JobOperation.job_id == job.id
        ).order_by(JobOperation.sequence).all()
        risk = get_delay_risk_score(job, ops)
        ship = predict_ship_date(job, ops)
        results.append({
            "job_id": job.id,
            "job_number": job.job_number,
            "part_name": job.part_name,
            "customer": job.customer,
            "priority": job.priority,
            "due_date": job.due_date,
            "risk": risk,
            "prediction": ship,
        })
    results.sort(key=lambda x: x["risk"]["score"], reverse=True)
    return results

@router.get("/overtime-recommendations")
def overtime_recommendations(db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.status != "shipped").all()
    recommendations = []
    for job in jobs:
        ops = db.query(JobOperation).filter(
            JobOperation.job_id == job.id
        ).order_by(JobOperation.sequence).all()
        ship = predict_ship_date(job, ops)
        if ship["will_miss_due_date"] and ship["days_variance"] > 0:
            current_op = next((op for op in ops if op.status == "in_progress"), None)
            if current_op:
                recommendations.append({
                    "job_number": job.job_number,
                    "part_name": job.part_name,
                    "customer": job.customer,
                    "operation": current_op.operation_name,
                    "days_behind": ship["days_variance"],
                    "suggested_overtime_hours": min(ship["days_variance"] * 4, 16),
                    "priority": job.priority,
                })
    recommendations.sort(key=lambda x: x["days_behind"], reverse=True)
    return recommendations

# ---------- OVERTIME BIDDING ENDPOINTS ----------

class PostOvertimeRequest(BaseModel):
    job_id: int
    operation_name: str
    plant_id: int
    posted_by: int
    date_required: str
    hours_required: float
    base_bonus: float
    notes: Optional[str] = None

class SubmitBidRequest(BaseModel):
    post_id: int
    employee_id: int
    bid_amount: float
    notes: Optional[str] = None

@router.get("/overtime-posts")
def get_overtime_posts(db: Session = Depends(get_db)):
    posts = db.query(OvertimePost).order_by(OvertimePost.created_at.desc()).all()
    result = []
    for post in posts:
        bids = db.query(OvertimeBid).filter(OvertimeBid.post_id == post.id).all()
        job = db.query(Job).filter(Job.id == post.job_id).first()
        plant = db.query(Employee).filter(Employee.plant_id == post.plant_id).first()
        poster = db.query(Employee).filter(Employee.id == post.posted_by).first()
        winner = db.query(Employee).filter(Employee.id == post.winner_employee_id).first() if post.winner_employee_id else None

        result.append({
            "id": post.id,
            "job_number": job.job_number if job else None,
            "part_name": job.part_name if job else None,
            "operation_name": post.operation_name,
            "plant_id": post.plant_id,
            "posted_by_name": poster.name if poster else None,
            "date_required": post.date_required,
            "hours_required": post.hours_required,
            "base_bonus": post.base_bonus,
            "final_bonus": post.final_bonus,
            "status": post.status,
            "notes": post.notes,
            "created_at": post.created_at,
            "bid_count": len(bids),
            "lowest_bid": min([b.bid_amount for b in bids], default=None),
            "winner_name": winner.name if winner else None,
        })
    return result

@router.post("/overtime-posts")
def create_overtime_post(req: PostOvertimeRequest, db: Session = Depends(get_db)):
    post = OvertimePost(
        job_id=req.job_id,
        operation_name=req.operation_name,
        plant_id=req.plant_id,
        posted_by=req.posted_by,
        date_required=datetime.fromisoformat(req.date_required),
        hours_required=req.hours_required,
        base_bonus=req.base_bonus,
        notes=req.notes,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"message": "Overtime post created", "id": post.id}

@router.post("/overtime-bids")
def submit_bid(req: SubmitBidRequest, db: Session = Depends(get_db)):
    post = db.query(OvertimePost).filter(OvertimePost.id == req.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.status != "open":
        raise HTTPException(status_code=400, detail="This overtime post is no longer open")
    if req.bid_amount > post.base_bonus:
        raise HTTPException(status_code=400, detail=f"Bid must be less than or equal to base bonus ${post.base_bonus}")

    existing = db.query(OvertimeBid).filter(
        OvertimeBid.post_id == req.post_id,
        OvertimeBid.employee_id == req.employee_id
    ).first()
    if existing:
        existing.bid_amount = req.bid_amount
        existing.notes = req.notes
        db.commit()
        return {"message": "Bid updated"}

    bid = OvertimeBid(
        post_id=req.post_id,
        employee_id=req.employee_id,
        bid_amount=req.bid_amount,
        notes=req.notes,
    )
    db.add(bid)
    db.commit()
    return {"message": "Bid submitted successfully"}

@router.post("/overtime-posts/{post_id}/close")
def close_overtime_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(OvertimePost).filter(OvertimePost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    bids = db.query(OvertimeBid).filter(OvertimeBid.post_id == post_id).order_by(OvertimeBid.bid_amount).all()
    if not bids:
        raise HTTPException(status_code=400, detail="No bids to close with")

    winner = bids[0]
    winner.is_winner = True
    post.status = "closed"
    post.final_bonus = winner.bid_amount
    post.winner_employee_id = winner.employee_id

    db.commit()
    winner_emp = db.query(Employee).filter(Employee.id == winner.employee_id).first()
    return {
        "message": "Overtime closed",
        "winner": winner_emp.name if winner_emp else None,
        "final_bonus": winner.bid_amount,
    }

@router.get("/overtime-posts/{post_id}/bids")
def get_bids(post_id: int, db: Session = Depends(get_db)):
    bids = db.query(OvertimeBid).filter(
        OvertimeBid.post_id == post_id
    ).order_by(OvertimeBid.bid_amount).all()
    result = []
    for bid in bids:
        emp = db.query(Employee).filter(Employee.id == bid.employee_id).first()
        result.append({
            "id": bid.id,
            "employee_name": emp.name if emp else None,
            "employee_code": emp.employee_code if emp else None,
            "bid_amount": bid.bid_amount,
            "is_winner": bid.is_winner,
            "created_at": bid.created_at,
            "notes": bid.notes,
        })
    return result
