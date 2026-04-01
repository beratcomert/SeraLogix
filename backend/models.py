from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey, Boolean
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