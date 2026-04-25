from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from api import auth, admin, user, sensor, mobile, ai

# Veritabanı tablolarını oluştur (Basit yaklaşım, Alembic önerilir ama şimdilik yeterli)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SeraLogix API", version="2.0.0")

@app.on_event("startup")
async def startup_event():
    import os
    os.makedirs("ml_models", exist_ok=True)
    from services.ml.scheduler import start_scheduler
    start_scheduler()

# CORS (frontend için şart)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları ekle
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(user.router, prefix="/user", tags=["User"])
app.include_router(sensor.router, prefix="/sensor", tags=["Sensor"])
app.include_router(mobile.router, prefix="/mobile", tags=["Mobile"])
app.include_router(ai.router, prefix="/ai", tags=["AI"])


@app.get("/")
def root():
    return {
        "message": "SeraLogix Akıllı Tarım API Çalışıyor",
        "docs": "/docs"
    }