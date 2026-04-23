import os
from datetime import datetime
from sqlalchemy.orm import Session
import models


ML_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models")


class ModelStore:
    def __init__(self):
        os.makedirs(ML_MODELS_DIR, exist_ok=True)

    def get_model_path(self, greenhouse_id: int, model_type: str, version: int) -> str:
        gh_dir = os.path.join(ML_MODELS_DIR, str(greenhouse_id))
        os.makedirs(gh_dir, exist_ok=True)
        return os.path.join(gh_dir, f"{model_type}_v{version}.joblib")

    def save_model(
        self,
        db: Session,
        greenhouse_id: int,
        model_type: str,
        file_path: str,
        trained_on_rows: int,
        training_score: float,
    ) -> models.MLModel:
        # Önceki aktif modeli devre dışı bırak
        db.query(models.MLModel).filter(
            models.MLModel.greenhouse_id == greenhouse_id,
            models.MLModel.model_type == model_type,
            models.MLModel.is_active == True,
        ).update({"is_active": False})

        # Yeni versiyon numarasını belirle
        last = (
            db.query(models.MLModel)
            .filter(
                models.MLModel.greenhouse_id == greenhouse_id,
                models.MLModel.model_type == model_type,
            )
            .order_by(models.MLModel.model_version.desc())
            .first()
        )
        new_version = (last.model_version + 1) if last else 1

        new_model = models.MLModel(
            greenhouse_id=greenhouse_id,
            model_type=model_type,
            model_version=new_version,
            file_path=file_path,
            trained_on_rows=trained_on_rows,
            training_score=training_score,
            is_active=True,
            created_at=datetime.utcnow(),
        )
        db.add(new_model)
        db.commit()
        db.refresh(new_model)
        return new_model

    def load_active_model(self, db: Session, greenhouse_id: int, model_type: str):
        record = (
            db.query(models.MLModel)
            .filter(
                models.MLModel.greenhouse_id == greenhouse_id,
                models.MLModel.model_type == model_type,
                models.MLModel.is_active == True,
            )
            .first()
        )
        if not record:
            return None, None

        if not os.path.exists(record.file_path):
            # Dosya kaybolmuşsa kaydı pasife al
            record.is_active = False
            db.commit()
            return None, None

        return record.file_path, record

    def get_status(self, db: Session, greenhouse_id: int) -> list:
        records = (
            db.query(models.MLModel)
            .filter(
                models.MLModel.greenhouse_id == greenhouse_id,
                models.MLModel.is_active == True,
            )
            .all()
        )
        return records


model_store = ModelStore()