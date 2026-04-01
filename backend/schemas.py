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