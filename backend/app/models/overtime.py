from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from app.database import Base
from datetime import datetime

class OvertimePost(Base):
    __tablename__ = "overtime_posts"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    operation_name = Column(String, nullable=False)
    plant_id = Column(Integer, ForeignKey("plants.id"))
    posted_by = Column(Integer, ForeignKey("employees.id"))
    date_required = Column(DateTime, nullable=False)
    hours_required = Column(Float, nullable=False)
    base_bonus = Column(Float, nullable=False)
    final_bonus = Column(Float, nullable=True)
    status = Column(String, default="open")  # open, closed, cancelled
    winner_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)


class OvertimeBid(Base):
    __tablename__ = "overtime_bids"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("overtime_posts.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    bid_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_winner = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)