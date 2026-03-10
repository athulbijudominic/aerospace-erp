from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    employee_code = Column(String, unique=True, nullable=False)
    role = Column(String, nullable=False)  # operator, supervisor, manager, driver
    plant_id = Column(Integer, ForeignKey("plants.id"))
    department = Column(String)
    is_active = Column(Boolean, default=True)