from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float
from app.database import Base
from datetime import datetime

class Downtime(Base):
    __tablename__ = "downtimes"

    id = Column(Integer, primary_key=True, index=True)
    job_operation_id = Column(Integer, ForeignKey("job_operations.id"))
    reported_by = Column(Integer, ForeignKey("employees.id"))
    approved_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    reason = Column(Text, nullable=False)
    photo_url = Column(String, nullable=True)
    duration_minutes = Column(Float)
    is_approved = Column(Boolean, default=False)
    is_recurring = Column(Boolean, default=False)
    technician_notified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    machine_id = Column(String, nullable=True)
    part_number = Column(String, nullable=True)