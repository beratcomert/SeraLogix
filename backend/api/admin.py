from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas
from services.auth_service import get_db, get_current_admin
from typing import List, Optional
import json
from datetime import datetime

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
    # Bu cihazı bul
    db_device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")
    
    # Cascade işlemi: Cihaza bağlı serayı ve o seraya ait verileri sil
    db_greenhouse = db.query(models.Greenhouse).filter(models.Greenhouse.device_id == device_id).first()
    if db_greenhouse:
        # Önce sensor verilerini sil (greenhouse'a bağlı)
        db.query(models.SensorData).filter(models.SensorData.greenhouse_id == db_greenhouse.id).delete()
        # Sonra serayı sil
        db.delete(db_greenhouse)
        db.flush() # Değişiklikleri veritabanına hazırla (commit öncesi)

    # En son cihazın kendisini sil
    db.delete(db_device)
    db.commit()

    return {"message": f"{device_id} ID'li cihaz ve bağlı tüm sera verileri başarıyla silindi"}


@router.get("/devices/{device_id}/details")
def get_device_details(
    device_id: str,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")

    greenhouse = db.query(models.Greenhouse).filter(models.Greenhouse.device_id == device_id).first()
    if not greenhouse:
        return {
            "device": {"device_id": device.device_id, "name": device.name, "is_assigned": device.is_assigned, "created_at": device.created_at},
            "greenhouse": None,
            "owner": None,
            "sensor_stats": None,
            "recent_sensors": [],
            "health_history": [],
            "ai_analysis": None,
            "training_events": [],
        }

    owner = db.query(models.User).filter(models.User.id == greenhouse.owner_id).first()

    # Son 50 sensör verisi
    sensor_rows = (
        db.query(models.SensorData)
        .filter(models.SensorData.greenhouse_id == greenhouse.id)
        .order_by(models.SensorData.id.desc())
        .limit(50)
        .all()
    )

    recent_sensors = [
        {
            "id": r.id,
            "temperature": r.temperature,
            "humidity": r.humidity,
            "soil_moisture": r.soil_moisture,
            "light": r.light,
            "soil_temperature": r.soil_temperature,
            "created_at": r.created_at,
        }
        for r in sensor_rows
    ]

    # İstatistikler
    sensor_stats = None
    if sensor_rows:
        temps = [r.temperature for r in sensor_rows if r.temperature is not None]
        hums = [r.humidity for r in sensor_rows if r.humidity is not None]
        soils = [r.soil_moisture for r in sensor_rows if r.soil_moisture is not None]
        lights = [r.light for r in sensor_rows if r.light is not None]

        def stat(vals):
            if not vals:
                return None
            return {"min": round(min(vals), 1), "max": round(max(vals), 1), "avg": round(sum(vals) / len(vals), 1)}

        sensor_stats = {
            "count": len(sensor_rows),
            "temperature": stat(temps),
            "humidity": stat(hums),
            "soil_moisture": stat(soils),
            "light": stat(lights),
        }

    # Sağlık skoru geçmişi (son 20)
    health_rows = (
        db.query(models.PlantHealthScore)
        .filter(models.PlantHealthScore.greenhouse_id == greenhouse.id)
        .order_by(models.PlantHealthScore.created_at.desc())
        .limit(20)
        .all()
    )
    health_history = []
    for h in health_rows:
        try:
            breakdown = json.loads(h.score_breakdown) if h.score_breakdown else {}
        except Exception:
            breakdown = {}
        health_history.append({
            "id": h.id,
            "health_score": h.health_score,
            "anomaly_score": h.anomaly_score,
            "is_anomaly": h.is_anomaly,
            "score_breakdown": breakdown,
            "created_at": h.created_at,
        })

    # Son AI analizi
    ai_analysis = None
    if health_rows:
        latest_h = health_rows[0]
        try:
            breakdown = json.loads(latest_h.score_breakdown) if latest_h.score_breakdown else {}
        except Exception:
            breakdown = {}
        ai_analysis = {
            "health_score": latest_h.health_score,
            "anomaly_score": latest_h.anomaly_score,
            "is_anomaly": latest_h.is_anomaly,
            "score_breakdown": breakdown,
        }

    # AI önerileri
    recommendations = []
    model_version = None
    try:
        from services.ml.scheduler import model_cache
        from services.ml.model_store import model_store
        from services.ml.health_scorer import HealthScorer
        from services.ml.anomaly_detector import AnomalyDetector
        from services.ml.feature_engineering import FeatureEngineer
        from services.ml.recommender import Recommender

        fe = FeatureEngineer()
        df = fe.load_from_db(db, greenhouse.id, limit=50)

        scorer = model_cache.get(greenhouse.id, "health_scorer")
        if not scorer:
            path, _ = model_store.load_active_model(db, greenhouse.id, "health_scorer")
            if path:
                scorer = HealthScorer.load(path)

        detector = model_cache.get(greenhouse.id, "anomaly_detector")
        if not detector:
            path2, _ = model_store.load_active_model(db, greenhouse.id, "anomaly_detector")
            if path2:
                detector = AnomalyDetector.load(path2)

        ml_model = (
            db.query(models.MLModel)
            .filter(models.MLModel.greenhouse_id == greenhouse.id, models.MLModel.model_type == "health_scorer", models.MLModel.is_active == True)
            .first()
        )
        if ml_model:
            model_version = ml_model.model_version

        features = {}
        health_score = ai_analysis["health_score"] if ai_analysis else 50.0
        is_anomaly = ai_analysis["is_anomaly"] if ai_analysis else False

        if scorer and not df.empty:
            x = fe.extract_features(df)
            if x is not None:
                health_score, _ = scorer.score(x.flatten())
                if detector:
                    _, is_anomaly = detector.score(x.flatten())
                fn = [
                    "temp_mean", "temp_std", "humidity_mean", "humidity_std",
                    "soil_moisture_mean", "soil_moisture_std", "light_mean", "light_std",
                    "soil_temp_mean", "vpd", "temp_humidity_ratio", "hour_sin",
                ]
                for i, name in enumerate(fn):
                    features[name] = float(x.flatten()[i])

        recommender = Recommender()
        recommendations = recommender.generate(features, health_score, is_anomaly)
    except Exception:
        pass

    # Eğitim olayları (son 10)
    training_events = []
    try:
        events = (
            db.query(models.TrainingEvent)
            .filter(models.TrainingEvent.greenhouse_id == greenhouse.id)
            .order_by(models.TrainingEvent.created_at.desc())
            .limit(10)
            .all()
        )
        for e in events:
            try:
                updated = json.loads(e.models_updated) if e.models_updated else []
            except Exception:
                updated = []
            training_events.append({
                "id": e.id,
                "status": e.status,
                "trigger_row_count": e.trigger_row_count,
                "duration_seconds": e.duration_seconds,
                "models_updated": updated,
                "created_at": e.created_at,
            })
    except Exception:
        pass

    return {
        "device": {"device_id": device.device_id, "name": device.name, "is_assigned": device.is_assigned, "created_at": device.created_at},
        "greenhouse": {"id": greenhouse.id, "name": greenhouse.name, "created_at": greenhouse.created_at},
        "owner": {"id": owner.id, "username": owner.username} if owner else None,
        "sensor_stats": sensor_stats,
        "recent_sensors": recent_sensors[:20],
        "health_history": health_history,
        "ai_analysis": ai_analysis,
        "recommendations": recommendations,
        "model_version": model_version,
        "training_events": training_events,
    }
