from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas
from services.auth_service import get_db, get_current_admin
from typing import List

router = APIRouter()

@router.post("/devices", response_model=schemas.DeviceResponse)
def create_device(device: schemas.DeviceBase, db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin)):
    db_device = db.query(models.Device).filter(models.Device.device_id == device.device_id).first()
    if db_device:
        raise HTTPException(status_code=400, detail="Cihaz ID zaten kayıtlı")
    
    new_device = models.Device(
        device_id=device.device_id,
        name=device.name
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    return new_device

@router.get("/devices", response_model=List[schemas.DeviceResponse])
def get_all_devices(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin)):
    return db.query(models.Device).all()

@router.delete("/devices/{device_id}")
def delete_device(device_id: str, db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin)):
    db_device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")
    
    db.delete(db_device)
    db.commit()
    return {"message": "Cihaz silindi"}
