from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.plant import Plant
from app.models.job import Job

router = APIRouter(prefix="/plants", tags=["plants"])

@router.get("/")
def get_all_plants(db: Session = Depends(get_db)):
    plants = db.query(Plant).all()
    result = []
    for plant in plants:
        active_jobs = db.query(Job).filter(
            Job.current_plant_id == plant.id,
            Job.status == "in_progress"
        ).count()
        delayed_jobs = db.query(Job).filter(
            Job.current_plant_id == plant.id,
            Job.status == "delayed"
        ).count()
        result.append({
            "id": plant.id,
            "name": plant.name,
            "location": plant.location,
            "lat": plant.lat,
            "lng": plant.lng,
            "active_jobs": active_jobs,
            "delayed_jobs": delayed_jobs,
        })
    return result