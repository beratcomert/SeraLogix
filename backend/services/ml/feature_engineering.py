import numpy as np
import pandas as pd
import math
from sqlalchemy.orm import Session
from typing import Optional


class FeatureEngineer:
    FEATURE_NAMES = [
        "temp_mean", "temp_std",
        "humidity_mean", "humidity_std",
        "soil_moisture_mean", "soil_moisture_std",
        "light_mean", "light_std",
        "soil_temp_mean",
        "vpd",
        "temp_humidity_ratio",
        "hour_sin",
    ]

    def load_from_db(self, db: Session, greenhouse_id: int, limit: int = 2000) -> pd.DataFrame:
        import models
        rows = (
            db.query(models.SensorData)
            .filter(models.SensorData.greenhouse_id == greenhouse_id)
            .order_by(models.SensorData.created_at.asc())
            .limit(limit)
            .all()
        )
        if not rows:
            return pd.DataFrame()

        data = []
        for r in rows:
            data.append({
                "id": r.id,
                "temperature": r.temperature or 20.0,
                "humidity": r.humidity or 60.0,
                "soil_moisture": r.soil_moisture or 50.0,
                "light": r.light or 10000.0,
                "soil_temperature": r.soil_temperature or 20.0,
                "created_at": r.created_at,
            })
        return pd.DataFrame(data)

    def _compute_vpd(self, temp: float, humidity: float) -> float:
        # Vapor Pressure Deficit — en kritik bitki fizyolojisi metriği
        es = 0.6108 * math.exp(17.27 * temp / (temp + 237.3))
        return round((1 - humidity / 100.0) * es, 4)

    def extract_features(self, df: pd.DataFrame, window: int = 24) -> Optional[np.ndarray]:
        if df.empty:
            return None
        subset = df.tail(window)
        return self._build_feature_vector(subset).reshape(1, -1)

    def extract_batch_features(self, df: pd.DataFrame, window: int = 24) -> Optional[np.ndarray]:
        if len(df) < window:
            return None
        vectors = []
        for i in range(window, len(df) + 1):
            chunk = df.iloc[i - window:i]
            vectors.append(self._build_feature_vector(chunk))
        return np.array(vectors)

    def _build_feature_vector(self, df: pd.DataFrame) -> np.ndarray:
        temp = df["temperature"].values
        hum = df["humidity"].values
        sm = df["soil_moisture"].values
        light = df["light"].values
        soil_t = df["soil_temperature"].values

        temp_mean = float(np.mean(temp))
        hum_mean = float(np.mean(hum))

        vpd = self._compute_vpd(temp_mean, hum_mean)

        hour = 12
        if "created_at" in df.columns and not df["created_at"].isnull().all():
            last_ts = df["created_at"].iloc[-1]
            if hasattr(last_ts, "hour"):
                hour = last_ts.hour

        return np.array([
            temp_mean,
            float(np.std(temp)) if len(temp) > 1 else 0.0,
            hum_mean,
            float(np.std(hum)) if len(hum) > 1 else 0.0,
            float(np.mean(sm)),
            float(np.std(sm)) if len(sm) > 1 else 0.0,
            float(np.mean(light)),
            float(np.std(light)) if len(light) > 1 else 0.0,
            float(np.mean(soil_t)),
            vpd,
            temp_mean / (hum_mean + 1e-5),
            math.sin(2 * math.pi * hour / 24),
        ], dtype=np.float64)