from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "user"

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class DeviceBase(BaseModel):
    device_id: str
    name: Optional[str] = None

class DeviceResponse(DeviceBase):
    is_assigned: bool
    created_at: datetime

    class Config:
        from_attributes = True

class GreenhouseBase(BaseModel):
    name: str
    device_id: str

class GreenhouseResponse(GreenhouseBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SensorSchema(BaseModel):
    temperature: float
    humidity: float
    soil_moisture: float
    light: float
    soil_temperature: Optional[float] = None
    device_id: str # Arduino identifies by its device_id
class SensorLatestResponse(BaseModel):
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    soil_moisture: Optional[float] = None
    light: Optional[float] = None
    soil_temperature: Optional[float] = None
    device_id: str


# AI / ML Şemaları
class AIAnalysisResponse(BaseModel):
    health_score: float
    anomaly_score: float
    is_anomaly: bool
    score_breakdown: dict
    recommendations: List[str]
    rule_alerts: List[str]
    model_version: Optional[int] = None
    last_trained_at: Optional[datetime] = None

class HealthScoreResponse(BaseModel):
    id: int
    greenhouse_id: int
    sensor_data_id: int
    health_score: float
    anomaly_score: float
    is_anomaly: bool
    score_breakdown: dict
    created_at: datetime

    class Config:
        from_attributes = True

class FeedbackCreate(BaseModel):
    feedback_type: str
    payload: dict
    sensor_data_id: Optional[int] = None

class ModelStatusResponse(BaseModel):
    greenhouse_id: int
    model_type: str
    model_version: int
    trained_on_rows: int
    training_score: Optional[float] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TrainingEventResponse(BaseModel):
    id: int
    greenhouse_id: int
    trigger_row_count: int
    duration_seconds: Optional[float] = None
    models_updated: List[str]
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True