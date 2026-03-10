from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    lat = Column(Float)
    lng = Column(Float)