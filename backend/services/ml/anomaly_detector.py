import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Optional


class AnomalyDetector:
    def __init__(self):
        self.model: Optional[IsolationForest] = None
        self.scaler: Optional[StandardScaler] = None
        self.threshold: float = 0.0

    def fit(self, X: np.ndarray) -> float:
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42,
        )
        self.model.fit(X_scaled)

        scores = self.model.decision_function(X_scaled)
        self.threshold = float(np.percentile(scores, 5))
        return float(np.mean(scores))

    def score(self, x: np.ndarray) -> Tuple[float, bool]:
        if self.model is None or self.scaler is None:
            return 0.0, False

        x_scaled = self.scaler.transform(x.reshape(1, -1))
        decision = float(self.model.decision_function(x_scaled)[0])
        is_anomaly = decision < self.threshold
        # Pozitif = daha anomalik
        anomaly_score = round(max(0, -decision) * 10, 3)
        return anomaly_score, is_anomaly

    def save(self, path: str) -> None:
        joblib.dump({
            "model": self.model,
            "scaler": self.scaler,
            "threshold": self.threshold,
        }, path)

    @classmethod
    def load(cls, path: str) -> "AnomalyDetector":
        data = joblib.load(path)
        detector = cls()
        detector.model = data["model"]
        detector.scaler = data["scaler"]
        detector.threshold = data.get("threshold", 0.0)
        return detector