import numpy as np
import joblib
from datetime import datetime
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Optional

# Domates için optimal aralıklar (cluster sıralama referansı)
TOMATO_OPTIMAL = {
    "temp_mean": 22.0,
    "humidity_mean": 70.0,
    "soil_moisture_mean": 60.0,
    "light_mean": 25000.0,
    "vpd": 0.8,
}

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

FEATURE_WEIGHTS = {
    "temp_mean": 0.20,
    "humidity_mean": 0.15,
    "soil_moisture_mean": 0.20,
    "light_mean": 0.20,
    "vpd": 0.25,
}


class HealthScorer:
    def __init__(self):
        self.kmeans: Optional[KMeans] = None
        self.scaler: Optional[StandardScaler] = None
        self.cluster_health_rank: dict = {}
        self.version: int = 1
        self.trained_at: Optional[str] = None

    def fit(self, X: np.ndarray) -> float:
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        n_clusters = min(3, len(X))
        self.kmeans = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
        self.kmeans.fit(X_scaled)

        self.cluster_health_rank = self._rank_clusters(X)
        self.trained_at = datetime.utcnow().isoformat()

        from sklearn.metrics import silhouette_score
        if len(X) > n_clusters:
            labels = self.kmeans.labels_
            try:
                score = float(silhouette_score(X_scaled, labels))
            except Exception:
                score = 0.0
        else:
            score = 0.0
        return score

    def _rank_clusters(self, X: np.ndarray) -> dict:
        centers = self.kmeans.cluster_centers_
        original_centers = self.scaler.inverse_transform(centers)

        scores = {}
        for i, center in enumerate(original_centers):
            feature_dict = {FEATURE_NAMES[j]: center[j] for j in range(len(FEATURE_NAMES))}

            # Domates optimaline uzaklık — düşük = iyi
            temp_dev = abs(feature_dict.get("temp_mean", 22) - TOMATO_OPTIMAL["temp_mean"]) / 10
            hum_dev = abs(feature_dict.get("humidity_mean", 70) - TOMATO_OPTIMAL["humidity_mean"]) / 30
            sm_dev = abs(feature_dict.get("soil_moisture_mean", 60) - TOMATO_OPTIMAL["soil_moisture_mean"]) / 40
            light_dev = max(0, (TOMATO_OPTIMAL["light_mean"] - feature_dict.get("light_mean", 25000)) / 25000)
            vpd_dev = abs(feature_dict.get("vpd", 0.8) - TOMATO_OPTIMAL["vpd"]) / 2

            raw = temp_dev * 0.2 + hum_dev * 0.15 + sm_dev * 0.2 + light_dev * 0.2 + vpd_dev * 0.25
            scores[i] = raw

        # En düşük sapma = en iyi sağlık skoru (100)
        max_dev = max(scores.values()) if scores.values() else 1
        ranked = {}
        for cluster_id, dev in scores.items():
            ranked[cluster_id] = max(10, round(100 - (dev / (max_dev + 1e-5)) * 70))
        return ranked

    def score(self, x: np.ndarray) -> Tuple[float, dict]:
        if self.kmeans is None or self.scaler is None:
            return 50.0, {}

        x_scaled = self.scaler.transform(x.reshape(1, -1))
        cluster = int(self.kmeans.predict(x_scaled)[0])
        base_score = float(self.cluster_health_rank.get(cluster, 50))

        breakdown = self._compute_breakdown(x.flatten())
        return base_score, breakdown

    def _compute_breakdown(self, x: np.ndarray) -> dict:
        feature_dict = {FEATURE_NAMES[i]: float(x[i]) for i in range(min(len(FEATURE_NAMES), len(x)))}

        temp = feature_dict.get("temp_mean", 22)
        hum = feature_dict.get("humidity_mean", 70)
        sm = feature_dict.get("soil_moisture_mean", 60)
        light = feature_dict.get("light_mean", 25000)
        vpd = feature_dict.get("vpd", 0.8)

        # Her parametre için 0-100 skoru (domates optimaline göre)
        def score_param(val, optimal, tolerance):
            dev = abs(val - optimal)
            return max(0, round(100 - (dev / tolerance) * 100))

        return {
            "sicaklik": min(100, score_param(temp, 22, 12)),
            "nem": min(100, score_param(hum, 70, 25)),
            "toprak_nemi": min(100, score_param(sm, 60, 40)),
            "isik": min(100, score_param(light, 25000, 25000)),
            "vpd": min(100, score_param(vpd, 0.8, 2.0)),
        }

    def save(self, path: str) -> None:
        joblib.dump({
            "kmeans": self.kmeans,
            "scaler": self.scaler,
            "cluster_health_rank": self.cluster_health_rank,
            "version": self.version,
            "trained_at": self.trained_at,
        }, path)

    @classmethod
    def load(cls, path: str) -> "HealthScorer":
        data = joblib.load(path)
        scorer = cls()
        scorer.kmeans = data["kmeans"]
        scorer.scaler = data["scaler"]
        scorer.cluster_health_rank = data["cluster_health_rank"]
        scorer.version = data.get("version", 1)
        scorer.trained_at = data.get("trained_at")
        return scorer