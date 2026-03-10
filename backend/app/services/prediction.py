from sqlalchemy.orm import Session
from app.models.job import Job, JobOperation
from datetime import datetime, timedelta
import random

def get_delay_risk_score(job: Job, operations: list) -> dict:
    """
    Scores a job's risk of missing due date.
    Returns a score 0-100 and a reason.
    """
    score = 0
    reasons = []

    # Check if due date has passed
    if job.due_date:
        days_left = (job.due_date - datetime.utcnow()).days
        if days_left < 0:
            score += 50
            reasons.append(f"Already {abs(days_left)} days overdue")
        elif days_left < 2:
            score += 35
            reasons.append(f"Only {days_left} day(s) until due date")
        elif days_left < 5:
            score += 15
            reasons.append(f"{days_left} days until due date")

    # Check operation variances
    high_variance_ops = []
    for op in operations:
        if op.actual_time_minutes and op.predicted_time_minutes:
            variance_pct = ((op.actual_time_minutes - op.predicted_time_minutes) / op.predicted_time_minutes) * 100
            if variance_pct > 30:
                score += 20
                high_variance_ops.append(op.operation_name)

    if high_variance_ops:
        reasons.append(f"High time variance at: {', '.join(high_variance_ops)}")

    # Pending operations count
    pending = [op for op in operations if op.status == "pending"]
    if len(pending) > 3:
        score += 10
        reasons.append(f"{len(pending)} operations still pending")

    # Priority boost
    if job.priority == "critical":
        score += 5
    
    score = min(score, 100)

    if score >= 70:
        level = "critical"
        color = "#ef4444"
    elif score >= 40:
        level = "high"
        color = "#f59e0b"
    elif score >= 20:
        level = "medium"
        color = "#38bdf8"
    else:
        level = "low"
        color = "#22c55e"

    return {
        "score": score,
        "level": level,
        "color": color,
        "reasons": reasons if reasons else ["On track"],
    }


def predict_ship_date(job: Job, operations: list) -> dict:
    """
    Predicts realistic ship date based on remaining operations.
    """
    remaining_minutes = 0
    remaining_ops = []

    for op in operations:
        if op.status in ["pending", "in_progress"]:
            # Use actual if in progress, else predicted
            if op.status == "in_progress" and op.start_time:
                elapsed = (datetime.utcnow() - op.start_time).total_seconds() / 60
                remaining = max(0, (op.predicted_time_minutes or 60) - elapsed)
                remaining_minutes += remaining
            else:
                remaining_minutes += op.predicted_time_minutes or 60
            remaining_ops.append(op.operation_name)

    # Convert to working hours (8hr days, Mon-Fri)
    working_hours_per_day = 8
    days_needed = remaining_minutes / 60 / working_hours_per_day

    predicted = datetime.utcnow() + timedelta(days=days_needed)
    due = job.due_date

    will_miss = predicted > due if due else False
    days_variance = (predicted - due).days if due else 0

    return {
        "predicted_ship_date": predicted.strftime("%Y-%m-%d"),
        "remaining_operations": remaining_ops,
        "remaining_minutes": round(remaining_minutes),
        "will_miss_due_date": will_miss,
        "days_variance": days_variance,
    }


def get_shipping_target_prediction(jobs: list, target_amount: float = 150000) -> dict:
    """
    Predicts if monthly shipping target will be met.
    Uses job count and status as proxy for shipping value.
    """
    shipped = [j for j in jobs if j.status == "shipped"]
    in_progress = [j for j in jobs if j.status == "in_progress"]
    delayed = [j for j in jobs if j.status == "delayed"]

    # Simulate shipping value per job (in real system this comes from Dynamics)
    avg_job_value = target_amount / 20  # assume 20 jobs needed to hit target
    current_shipped_value = len(shipped) * avg_job_value

    # Project completions by end of month
    days_in_month = 30
    today = datetime.utcnow()
    days_elapsed = today.day
    days_remaining = days_in_month - days_elapsed

    # Rate of shipping
    daily_rate = len(shipped) / max(days_elapsed, 1)
    projected_additional = daily_rate * days_remaining
    projected_total_value = (len(shipped) + projected_additional) * avg_job_value

    gap = target_amount - projected_total_value
    on_track = projected_total_value >= target_amount
    confidence = min(100, int((projected_total_value / target_amount) * 100))

    # How many more jobs needed
    jobs_needed = max(0, int(gap / avg_job_value))

    return {
        "target": target_amount,
        "current_shipped_value": round(current_shipped_value),
        "projected_total_value": round(projected_total_value),
        "on_track": on_track,
        "confidence_pct": confidence,
        "gap": round(max(0, gap)),
        "jobs_needed_to_close_gap": jobs_needed,
        "days_remaining": days_remaining,
        "shipped_count": len(shipped),
        "in_progress_count": len(in_progress),
        "delayed_count": len(delayed),
    }


def get_truck_dispatch_alerts(jobs: list, operations_by_job: dict) -> list:
    """
    Identifies jobs that completed an operation at one plant
    and need transport to next plant.
    """
    alerts = []
    plant_names = {
        1: "Plant A - Brampton",
        2: "Plant B - Mississauga",
        3: "Plant C - Oakville",
        4: "Plant D - Burlington",
    }

    for job in jobs:
        ops = operations_by_job.get(job.id, [])
        for i, op in enumerate(ops):
            if op.status == "completed" and i + 1 < len(ops):
                next_op = ops[i + 1]
                if next_op.status == "pending" and op.plant_id != next_op.plant_id:
                    alerts.append({
                        "job_number": job.job_number,
                        "part_name": job.part_name,
                        "quantity": job.quantity,
                        "completed_operation": op.operation_name,
                        "from_plant": plant_names.get(op.plant_id, f"Plant {op.plant_id}"),
                        "next_operation": next_op.operation_name,
                        "to_plant": plant_names.get(next_op.plant_id, f"Plant {next_op.plant_id}"),
                        "priority": job.priority,
                        "due_date": job.due_date.strftime("%Y-%m-%d") if job.due_date else None,
                    })

    # Sort by priority
    priority_order = {"critical": 0, "high": 1, "normal": 2, "low": 3}
    alerts.sort(key=lambda x: priority_order.get(x["priority"], 2))

    return alerts