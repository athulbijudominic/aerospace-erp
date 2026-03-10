from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_number = Column(String, unique=True, nullable=False)
    part_number = Column(String, nullable=False)
    part_name = Column(String)
    quantity = Column(Integer, nullable=False)
    customer = Column(String)
    order_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime)
    predicted_ship_date = Column(DateTime)
    actual_ship_date = Column(DateTime, nullable=True)
    status = Column(String, default="in_progress")  # in_progress, completed, delayed, shipped
    priority = Column(String, default="normal")  # low, normal, high, critical
    current_operation = Column(String)
    current_plant_id = Column(Integer, ForeignKey("plants.id"))

    operations = relationship("JobOperation", back_populates="job")


class JobOperation(Base):
    __tablename__ = "job_operations"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    operation_name = Column(String, nullable=False)
    plant_id = Column(Integer, ForeignKey("plants.id"))
    sequence = Column(Integer)
    predicted_time_minutes = Column(Float)
    actual_time_minutes = Column(Float, nullable=True)
    setup_time_minutes = Column(Float, nullable=True)
    status = Column(String, default="pending")  # pending, in_progress, completed
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    parts_completed = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

    job = relationship("Job", back_populates="operations")