from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas
from services.auth_service import get_db, get_current_user
from typing import List

router = APIRouter()

@router.post("/greenhouses", response_model=schemas.GreenhouseResponse)
def add_greenhouse(greenhouse: schemas.GreenhouseBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Cihazın sistemde olup olmadığını kontrol et
    db_device = db.query(models.Device).filter(models.Device.device_id == greenhouse.device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Cihaz sistemde kayıtlı değil (Admin tarafından eklenmemiş)")
    
    # 2. Cihazın önceden birine atanıp atanmadığını kontrol et
    if db_device.is_assigned:
        raise HTTPException(status_code=400, detail="Cihaz zaten başka bir hesaba kayıtlı")
    
    # 3. Serayı oluştur ve cihazı ata
    new_greenhouse = models.Greenhouse(
        name=greenhouse.name,
        owner_id=current_user.id,
        device_id=greenhouse.device_id
    )
    db_device.is_assigned = True
    
    db.add(new_greenhouse)
    db.commit()
    db.refresh(new_greenhouse)
    return new_greenhouse

@router.get("/greenhouses", response_model=List[schemas.GreenhouseResponse])
def get_user_greenhouses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Greenhouse).filter(models.Greenhouse.owner_id == current_user.id).all()
