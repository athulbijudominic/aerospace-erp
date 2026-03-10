from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models
from app.routes import jobs, plants, downtime, overtime

app = FastAPI(title="Aerospace ERP Intelligence API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(jobs.router)
app.include_router(plants.router)
app.include_router(downtime.router)
app.include_router(overtime.router)

@app.get("/")
def root():
    return {"message": "Aerospace ERP Intelligence API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}