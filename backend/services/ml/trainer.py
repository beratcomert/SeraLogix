import json
import time
from datetime import datetime
from sqlalchemy.orm import Session

import models
from services.ml.feature_engineering import FeatureEngineer
from services.ml.health_scorer import HealthScorer
from services.ml.anomaly_detector import AnomalyDetector
from services.ml.model_store import model_store

TRAINING_TRIGGER_N = 100
MIN_ROWS_FOR_TRAINING = 50
MAX_TRAINING_ROWS = 2000


class ContinuousTrainer:
    def __init__(self):
        self.fe = FeatureEngineer()

    def _get_total_rows(self, db: Session, greenhouse_id: int) -> int:
        return db.query(models.SensorData).filter(
            models.SensorData.greenhouse_id == greenhouse_id
        ).count()

    def _get_last_trigger_count(self, db: Session, greenhouse_id: int) -> int:
        last = (
            db.query(models.TrainingEvent)
            .filter(
                models.TrainingEvent.greenhouse_id == greenhouse_id,
                models.TrainingEvent.status == "success",
            )
            .order_by(models.TrainingEvent.created_at.desc())
            .first()
        )
        return last.trigger_row_count if last else 0

    def should_retrain(self, db: Session, greenhouse_id: int) -> bool:
        total = self._get_total_rows(db, greenhouse_id)
        if total < MIN_ROWS_FOR_TRAINING:
            return False
        last = self._get_last_trigger_count(db, greenhouse_id)
        return (total - last) >= TRAINING_TRIGGER_N

    def train(self, db: Session, greenhouse_id: int) -> models.TrainingEvent:
        start = time.time()
        total_rows = self._get_total_rows(db, greenhouse_id)

        event = models.TrainingEvent(
            greenhouse_id=greenhouse_id,
            trigger_row_count=total_rows,
            status="failed",
            models_updated=json.dumps([]),
            created_at=datetime.utcnow(),
        )
        db.add(event)

        try:
            df = self.fe.load_from_db(db, greenhouse_id, limit=MAX_TRAINING_ROWS)
            if len(df) < MIN_ROWS_FOR_TRAINING:
                event.status = "skipped"
                event.error_message = f"Yetersiz veri: {len(df)} satır"
                db.commit()
                return event

            X = self.fe.extract_batch_features(df, window=24)
            if X is None or len(X) < 5:
                event.status = "skipped"
                event.error_message = "Yeterli pencere verisi yok"
                db.commit()
                return event

            updated_models = []

            # HealthScorer eğitimi
            scorer = HealthScorer()
            hs_score = scorer.fit(X)
            hs_version = self._get_next_version(db, greenhouse_id, "health_scorer")
            scorer.version = hs_version
            hs_path = model_store.get_model_path(greenhouse_id, "health_scorer", hs_version)
            scorer.save(hs_path)
            model_store.save_model(db, greenhouse_id, "health_scorer", hs_path, len(X), hs_score)
            updated_models.append("health_scorer")

            # AnomalyDetector eğitimi
            detector = AnomalyDetector()
            ad_score = detector.fit(X)
            ad_version = self._get_next_version(db, greenhouse_id, "anomaly_detector")
            ad_path = model_store.get_model_path(greenhouse_id, "anomaly_detector", ad_version)
            detector.save(ad_path)
            model_store.save_model(db, greenhouse_id, "anomaly_detector", ad_path, len(X), ad_score)
            updated_models.append("anomaly_detector")

            # Eğitim sonrası skorlanmamış satırları doldur
            self._backfill_health_scores(db, greenhouse_id, scorer, detector, df)

            event.status = "success"
            event.models_updated = json.dumps(updated_models)
            event.duration_seconds = round(time.time() - start, 2)

            # Model önbelleğini temizle
            from services.ml.scheduler import model_cache
            model_cache.invalidate(greenhouse_id)

        except Exception as e:
            event.status = "failed"
            event.error_message = str(e)[:500]

        db.commit()
        return event

    def _get_next_version(self, db: Session, greenhouse_id: int, model_type: str) -> int:
        last = (
            db.query(models.MLModel)
            .filter(
                models.MLModel.greenhouse_id == greenhouse_id,
                models.MLModel.model_type == model_type,
            )
            .order_by(models.MLModel.model_version.desc())
            .first()
        )
        return (last.model_version + 1) if last else 1

    def _backfill_health_scores(self, db, greenhouse_id, scorer, detector, df):
        import json as json_lib
        # Son 200 satır için skoru geri doldur
        scored_ids = {
            r.sensor_data_id
            for r in db.query(models.PlantHealthScore)
            .filter(models.PlantHealthScore.greenhouse_id == greenhouse_id)
            .all()
        }

        window = 24
        unscored = []
        for i, row in df.iterrows():
            if int(row["id"]) not in scored_ids:
                unscored.append(row)

        for row in unscored[-200:]:
            idx = df[df["id"] == row["id"]].index[0]
            start_idx = max(0, idx - window + 1)
            chunk = df.iloc[start_idx: idx + 1]

            from services.ml.feature_engineering import FeatureEngineer
            fe = FeatureEngineer()
            x = fe._build_feature_vector(chunk)

            h_score, breakdown = scorer.score(x)
            a_score, is_anom = detector.score(x)

            hs = models.PlantHealthScore(
                greenhouse_id=greenhouse_id,
                sensor_data_id=int(row["id"]),
                health_score=h_score,
                anomaly_score=a_score,
                is_anomaly=is_anom,
                score_breakdown=json_lib.dumps(breakdown),
                created_at=datetime.utcnow(),
            )
            db.add(hs)

        db.commit()


trainer = ContinuousTrainer()