# routes/sensor.py
from fastapi import APIRouter

router = APIRouter()

@router.post("/data")
def receive_data(data: dict):
    # DB'ye kaydet
    return {"status": "ok"}