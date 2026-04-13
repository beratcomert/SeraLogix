from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from services.auth_service import get_db, get_current_user
from services.ai import analyze
from typing import List
import random

router = APIRouter()

@router.post("/data")
def receive_sensor_data(data: schemas.SensorSchema, db: Session = Depends(get_db)):
    # 1. Cihazın hangi seraya ait olduğunu bul
    db_greenhouse = db.query(models.Greenhouse).filter(models.Greenhouse.device_id == data.device_id).first()
    if not db_greenhouse:
        raise HTTPException(status_code=404, detail="Cihaz bir seraya atanmamış")

    # 2. Veritabanına kaydet
    new_data = models.SensorData(
        greenhouse_id=db_greenhouse.id,
        temperature=data.temperature,
        humidity=data.humidity,
        soil_moisture=data.soil_moisture,
        light=data.light,
        soil_temperature=data.soil_temperature
    )
    db.add(new_data)
    db.commit()
    db.refresh(new_data)
    
    # 3. AI Analizi yap
    alerts = analyze({
        "temperature": data.temperature,
        "humidity": data.humidity,
        "soilMoisture": data.soil_moisture, # AI servisi eski formatı bekliyor olabilir
        "light": data.light
    })
    
    return {"status": "success", "alerts": alerts}

from sqlalchemy import func

@router.get("/latest/{greenhouse_id}", response_model=schemas.SensorLatestResponse)
def get_latest_data(greenhouse_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Kullanıcının bu seraya erişimi var mı kontrol et
    greenhouse = db.query(models.Greenhouse).filter(
        models.Greenhouse.id == greenhouse_id, 
        models.Greenhouse.owner_id == current_user.id
    ).first()
    
    if not greenhouse:
        raise HTTPException(status_code=403, detail="Bu sera verilerine erişim yetkiniz yok")
    
    # Test amaçlı: DB'deki tüm veriler arasından rastgele birini seçelim
    latest = db.query(models.SensorData).filter(
        models.SensorData.greenhouse_id == greenhouse_id
    ).order_by(func.random()).first()
    
    if not latest:
        # DB tamamen boşsa tamamen rastgele üretelim
        return {
            "temperature": round(random.uniform(22.0, 26.5), 1),
            "humidity": round(random.uniform(45.0, 65.0), 1),
            "soil_moisture": round(random.uniform(50.0, 80.0), 1),
            "light": round(random.uniform(400, 800), 0),
            "soil_temperature": round(random.uniform(18.0, 22.0), 1),
            "device_id": greenhouse.device_id
        }
    
    return {
        "temperature": latest.temperature,
        "humidity": latest.humidity,
        "soil_moisture": latest.soil_moisture,
        "light": latest.light,
        "soil_temperature": latest.soil_temperature,
        "device_id": greenhouse.device_id
    }