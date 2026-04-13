from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from services.auth_service import get_db, get_current_user
from typing import List

router = APIRouter()

@router.get("/dashboard")
def get_mobile_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Kullanıcının sahip olduğu tüm seraları ve her seranın en son sensör verilerini döner.
    Mobil uygulama ana ekranı için tek seferde tüm veriyi almak verimlidir.
    """
    greenhouses = db.query(models.Greenhouse).filter(models.Greenhouse.owner_id == current_user.id).all()
    
    dashboard_data = []
    for gh in greenhouses:
        # En son sensör verisini çek (created_at'e göre en yeni olanı alıyoruz)
        latest_data = db.query(models.SensorData).filter(
            models.SensorData.greenhouse_id == gh.id
        ).order_by(models.SensorData.id.desc()).first()
        
        gh_info = {
            "id": gh.id,
            "name": gh.name,
            "device_id": gh.device_id,
            "latest_stats": {
                "temperature": latest_data.temperature if latest_data else None,
                "humidity": latest_data.humidity if latest_data else None,
                "soil_moisture": latest_data.soil_moisture if latest_data else None,
                "light": latest_data.light if latest_data else None,
                "soil_temperature": latest_data.soil_temperature if latest_data else None,
                "last_update": latest_data.created_at if latest_data else None
            }
        }
        dashboard_data.append(gh_info)
        
    return dashboard_data

@router.get("/profile", response_model=schemas.UserResponse)
def get_profile(current_user: models.User = Depends(get_current_user)):
    """
    Giriş yapan kullanıcının profil bilgilerini döner.
    """
    return current_user
