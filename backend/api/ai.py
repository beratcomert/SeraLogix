import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

import models
import schemas
from services.auth_service import get_db, get_current_user, get_current_admin
from services.ai import analyze

router = APIRouter()


def _load_scorer(db: Session, greenhouse_id: int):
    from services.ml.scheduler import model_cache
    from services.ml.model_store import model_store
    from services.ml.health_scorer import HealthScorer

    cached = model_cache.get(greenhouse_id, "health_scorer")
    if cached:
        return cached

    path, _ = model_store.load_active_model(db, greenhouse_id, "health_scorer")
    if not path:
        return None

    scorer = HealthScorer.load(path)
    model_cache.set(greenhouse_id, "health_scorer", scorer)
    return scorer


def _load_detector(db: Session, greenhouse_id: int):
    from services.ml.scheduler import model_cache
    from services.ml.model_store import model_store
    from services.ml.anomaly_detector import AnomalyDetector

    cached = model_cache.get(greenhouse_id, "anomaly_detector")
    if cached:
        return cached

    path, _ = model_store.load_active_model(db, greenhouse_id, "anomaly_detector")
    if not path:
        return None

    detector = AnomalyDetector.load(path)
    model_cache.set(greenhouse_id, "anomaly_detector", detector)
    return detector


def _get_active_model_info(db: Session, greenhouse_id: int, model_type: str):
    return (
        db.query(models.MLModel)
        .filter(
            models.MLModel.greenhouse_id == greenhouse_id,
            models.MLModel.model_type == model_type,
            models.MLModel.is_active == True,
        )
        .first()
    )


@router.get("/analysis/{greenhouse_id}", response_model=schemas.AIAnalysisResponse)
def get_ai_analysis(
    greenhouse_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    greenhouse = db.query(models.Greenhouse).filter(
        models.Greenhouse.id == greenhouse_id,
        models.Greenhouse.owner_id == current_user.id,
    ).first()
    if not greenhouse:
        raise HTTPException(status_code=403, detail="Bu seraya erişim yetkiniz yok")

    # Son sensör verilerini al
    from services.ml.feature_engineering import FeatureEngineer
    from services.ml.recommender import Recommender

    fe = FeatureEngineer()
    df = fe.load_from_db(db, greenhouse_id, limit=50)

    # Legacy kural tabanlı uyarılar (her zaman çalışır)
    latest_row = (
        db.query(models.SensorData)
        .filter(models.SensorData.greenhouse_id == greenhouse_id)
        .order_by(models.SensorData.id.desc())
        .first()
    )
    rule_alerts = []
    if latest_row:
        rule_alerts = analyze({
            "temperature": latest_row.temperature or 20,
            "humidity": latest_row.humidity or 60,
            "soilMoisture": latest_row.soil_moisture or 50,
            "light": latest_row.light or 10000,
        })

    # ML modeli varsa kullan
    scorer = _load_scorer(db, greenhouse_id)
    detector = _load_detector(db, greenhouse_id)

    model_version = None
    last_trained_at = None
    health_score = 50.0
    anomaly_score = 0.0
    is_anomaly = False
    score_breakdown = {}

    if scorer and detector and not df.empty:
        x = fe.extract_features(df)
        if x is not None:
            health_score, score_breakdown = scorer.score(x.flatten())
            anomaly_score, is_anomaly = detector.score(x.flatten())

            model_info = _get_active_model_info(db, greenhouse_id, "health_scorer")
            if model_info:
                model_version = model_info.model_version
                last_trained_at = model_info.created_at

            # Bu analizi kaydet
            sensor_id = latest_row.id if latest_row else None
            if sensor_id:
                existing = db.query(models.PlantHealthScore).filter(
                    models.PlantHealthScore.sensor_data_id == sensor_id
                ).first()
                if not existing:
                    hs = models.PlantHealthScore(
                        greenhouse_id=greenhouse_id,
                        sensor_data_id=sensor_id,
                        health_score=health_score,
                        anomaly_score=anomaly_score,
                        is_anomaly=is_anomaly,
                        score_breakdown=json.dumps(score_breakdown),
                        created_at=datetime.utcnow(),
                    )
                    db.add(hs)
                    db.commit()
    else:
        # Model yokken sensör değerlerine göre basit skor üret
        if latest_row:
            health_score = _rule_based_health_score(latest_row)
            score_breakdown = _rule_based_breakdown(latest_row)
    # Öneri üret
    features = {}
    if not df.empty:
        import numpy as np
        from services.ml.feature_engineering import FeatureEngineer as FE2
        fe2 = FE2()
        x_vec = fe2.extract_features(df)
        if x_vec is not None:
            fn = [
                "temp_mean", "temp_std", "humidity_mean", "humidity_std",
                "soil_moisture_mean", "soil_moisture_std", "light_mean", "light_std",
                "soil_temp_mean", "vpd", "temp_humidity_ratio", "hour_sin",
            ]
            for i, name in enumerate(fn):
                features[name] = float(x_vec.flatten()[i])

    recommender = Recommender()
    recommendations = recommender.generate(features, health_score, is_anomaly)

    return schemas.AIAnalysisResponse(
        health_score=round(health_score, 1),
        anomaly_score=round(anomaly_score, 3),
        is_anomaly=is_anomaly,
        score_breakdown=score_breakdown,
        recommendations=recommendations,
        rule_alerts=rule_alerts,
        model_version=model_version,
        last_trained_at=last_trained_at,
    )
@router.get("/health/history/{greenhouse_id}", response_model=List[schemas.HealthScoreResponse])
def get_health_history(
    greenhouse_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    greenhouse = db.query(models.Greenhouse).filter(
        models.Greenhouse.id == greenhouse_id,
        models.Greenhouse.owner_id == current_user.id,
    ).first()
    if not greenhouse:
        raise HTTPException(status_code=403, detail="Bu seraya erişim yetkiniz yok")

    records = (
        db.query(models.PlantHealthScore)
        .filter(models.PlantHealthScore.greenhouse_id == greenhouse_id)
        .order_by(models.PlantHealthScore.created_at.desc())
        .limit(limit)
        .all()
    )

    result = []
    for r in records:
        try:
            breakdown = json.loads(r.score_breakdown) if r.score_breakdown else {}
        except Exception:
            breakdown = {}
        result.append(schemas.HealthScoreResponse(
            id=r.id,
            greenhouse_id=r.greenhouse_id,
            sensor_data_id=r.sensor_data_id,
            health_score=r.health_score,
            anomaly_score=r.anomaly_score,
            is_anomaly=r.is_anomaly,
            score_breakdown=breakdown,
            created_at=r.created_at,
        ))
    return result


@router.get("/status/{greenhouse_id}", response_model=List[schemas.ModelStatusResponse])
def get_model_status(
    greenhouse_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    greenhouse = db.query(models.Greenhouse).filter(
        models.Greenhouse.id == greenhouse_id,
        models.Greenhouse.owner_id == current_user.id,
    ).first()
    if not greenhouse:
        raise HTTPException(status_code=403, detail="Bu seraya erişim yetkiniz yok")

    from services.ml.model_store import model_store
    records = model_store.get_status(db, greenhouse_id)
    return [
        schemas.ModelStatusResponse(
            greenhouse_id=r.greenhouse_id,
            model_type=r.model_type,
            model_version=r.model_version,
            trained_on_rows=r.trained_on_rows,
            training_score=r.training_score,
            is_active=r.is_active,
            created_at=r.created_at,
        )
        for r in records
    ]


@router.get("/recommendations/{greenhouse_id}")
def get_recommendations(
    greenhouse_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    greenhouse = db.query(models.Greenhouse).filter(
        models.Greenhouse.id == greenhouse_id,
        models.Greenhouse.owner_id == current_user.id,
    ).first()
    if not greenhouse:
        raise HTTPException(status_code=403, detail="Bu seraya erişim yetkiniz yok")

    from services.ml.feature_engineering import FeatureEngineer
    from services.ml.recommender import Recommender

    fe = FeatureEngineer()
    df = fe.load_from_db(db, greenhouse_id, limit=50)

    scorer = _load_scorer(db, greenhouse_id)
    health_score = 50.0
    is_anomaly = False
    features = {}

    if scorer and not df.empty:
        x = fe.extract_features(df)
        if x is not None:
            health_score, _ = scorer.score(x.flatten())
            detector = _load_detector(db, greenhouse_id)
            if detector:
                _, is_anomaly = detector.score(x.flatten())
            fn = [
                "temp_mean", "temp_std", "humidity_mean", "humidity_std",
                "soil_moisture_mean", "soil_moisture_std", "light_mean", "light_std",
                "soil_temp_mean", "vpd", "temp_humidity_ratio", "hour_sin",
            ]
            for i, name in enumerate(fn):
                features[name] = float(x.flatten()[i])
    else:
        latest_row = (
            db.query(models.SensorData)
            .filter(models.SensorData.greenhouse_id == greenhouse_id)
            .order_by(models.SensorData.id.desc())
            .first()
        )
        if latest_row:
            health_score = _rule_based_health_score(latest_row)

    recommender = Recommender()
    recommendations = recommender.generate(features, health_score, is_anomaly)
    return {"health_score": round(health_score, 1), "recommendations": recommendations}
@router.post("/feedback/{greenhouse_id}")
def submit_feedback(
    greenhouse_id: int,
    feedback: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    greenhouse = db.query(models.Greenhouse).filter(
        models.Greenhouse.id == greenhouse_id,
        models.Greenhouse.owner_id == current_user.id,
    ).first()
    if not greenhouse:
        raise HTTPException(status_code=403, detail="Bu seraya erişim yetkiniz yok")

    fb = models.FarmerFeedback(
        greenhouse_id=greenhouse_id,
        feedback_type=feedback.feedback_type,
        payload=json.dumps(feedback.payload),
        sensor_data_id=feedback.sensor_data_id,
        created_at=datetime.utcnow(),
    )
    db.add(fb)
    db.commit()
    return {"status": "ok"}


@router.get("/training/events/{greenhouse_id}", response_model=List[schemas.TrainingEventResponse])
def get_training_events(
    greenhouse_id: int,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    greenhouse = db.query(models.Greenhouse).filter(
        models.Greenhouse.id == greenhouse_id,
        models.Greenhouse.owner_id == current_user.id,
    ).first()
    if not greenhouse:
        raise HTTPException(status_code=403, detail="Bu seraya erişim yetkiniz yok")

    events = (
        db.query(models.TrainingEvent)
        .filter(models.TrainingEvent.greenhouse_id == greenhouse_id)
        .order_by(models.TrainingEvent.created_at.desc())
        .limit(limit)
        .all()
    )

    result = []
    for e in events:
        try:
            updated = json.loads(e.models_updated) if e.models_updated else []
        except Exception:
            updated = []
        result.append(schemas.TrainingEventResponse(
            id=e.id,
            greenhouse_id=e.greenhouse_id,
            trigger_row_count=e.trigger_row_count,
            duration_seconds=e.duration_seconds,
            models_updated=updated,
            status=e.status,
            error_message=e.error_message,
            created_at=e.created_at,
        ))
    return result


@router.post("/training/trigger/{greenhouse_id}")
def trigger_training(
    greenhouse_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),
):
    from services.ml.trainer import trainer
    event = trainer.train(db, greenhouse_id)
    return {
        "status": event.status,
        "duration_seconds": event.duration_seconds,
        "models_updated": json.loads(event.models_updated) if event.models_updated else [],
    }


# Yardımcı fonksiyonlar (model yokken basit skor)
def _rule_based_health_score(row) -> float:
    score = 50.0
    temp = row.temperature or 20
    hum = row.humidity or 60
    sm = row.soil_moisture or 50
    light = row.light or 10000

    if 18 <= temp <= 26:
        score += 10
    elif temp > 32 or temp < 12:
        score -= 20

    if 60 <= hum <= 80:
        score += 10
    elif hum > 90 or hum < 40:
        score -= 15

    if sm >= 40:
        score += 10
    elif sm < 25:
        score -= 20

    if light >= 10000:
        score += 10
    elif light < 3000:
        score -= 10

    return max(0, min(100, score))
    
def _rule_based_breakdown(row) -> dict:
    temp = row.temperature or 20
    hum = row.humidity or 60
    sm = row.soil_moisture or 50
    light = row.light or 10000

    def s(val, opt, tol):
        return max(0, min(100, round(100 - abs(val - opt) / tol * 100)))

    return {
        "sicaklik": s(temp, 22, 12),
        "nem": s(hum, 70, 25),
        "toprak_nemi": s(sm, 60, 40),
        "isik": s(light, 25000, 25000),
        "vpd": 50,
    }
