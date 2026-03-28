from pydantic import BaseModel

class SensorSchema(BaseModel):
    temperature: float
    humidity: float
    soilMoisture: float
    light: float