from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    role = Column(String(20), default="user") # 'admin' or 'user'
    created_at = Column(DateTime, default=datetime.utcnow)

    greenhouses = relationship("Greenhouse", back_populates="owner")

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True) # E.g. SERA-001
    name = Column(String(200), nullable=True)
    is_assigned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    greenhouse = relationship("Greenhouse", back_populates="device", uselist=False)

class Greenhouse(Base):
    __tablename__ = "greenhouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    owner_id = Column(Integer, ForeignKey("users.id"))
    device_id = Column(String(50), ForeignKey("devices.device_id"), unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="greenhouses")
    device = relationship("Device", back_populates="greenhouse")
    sensor_data = relationship("SensorData", back_populates="greenhouse")

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    greenhouse_id = Column(Integer, ForeignKey("greenhouses.id"))
    temperature = Column(Float)
    humidity = Column(Float)
    soil_moisture = Column(Float)
    light = Column(Float)
    soil_temperature = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    greenhouse = relationship("Greenhouse", back_populates="sensor_data")
    health_score = relationship("PlantHealthScore", back_populates="sensor_data", uselist=False)


class MLModel(Base):
    __tablename__ = "ml_models"

    id = Column(Integer, primary_key=True, index=True)
    greenhouse_id = Column(Integer, ForeignKey("greenhouses.id"))
    model_type = Column(String(50))  # "health_scorer", "anomaly_detector"
    model_version = Column(Integer, default=1)
    file_path = Column(String(500))
    trained_on_rows = Column(Integer, default=0)
    training_score = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    greenhouse = relationship("Greenhouse")


class PlantHealthScore(Base):
    __tablename__ = "plant_health_scores"

    id = Column(Integer, primary_key=True, index=True)
    greenhouse_id = Column(Integer, ForeignKey("greenhouses.id"))
    sensor_data_id = Column(Integer, ForeignKey("sensor_data.id"))
    health_score = Column(Float)       # 0-100
    anomaly_score = Column(Float)
    is_anomaly = Column(Boolean, default=False)
    score_breakdown = Column(Text)     # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    greenhouse = relationship("Greenhouse")
    sensor_data = relationship("SensorData", back_populates="health_score")


class FarmerFeedback(Base):
    __tablename__ = "farmer_feedback"

    id = Column(Integer, primary_key=True, index=True)
    greenhouse_id = Column(Integer, ForeignKey("greenhouses.id"))
    feedback_type = Column(String(30))  # "alert_useful", "yield_rating"
    payload = Column(Text)              # JSON string
    sensor_data_id = Column(Integer, ForeignKey("sensor_data.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    greenhouse = relationship("Greenhouse")


class TrainingEvent(Base):
    __tablename__ = "training_events"

    id = Column(Integer, primary_key=True, index=True)
    greenhouse_id = Column(Integer, ForeignKey("greenhouses.id"))
    trigger_row_count = Column(Integer)
    duration_seconds = Column(Float, nullable=True)
    models_updated = Column(Text)       # JSON list
    status = Column(String(20))         # "success", "failed", "skipped"
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    greenhouse = relationship("Greenhouse")

