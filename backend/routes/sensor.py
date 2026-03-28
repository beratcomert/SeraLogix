from fastapi import APIRouter
import json
import threading
import time
from services.ai import analyze

router = APIRouter()

# JSON verisini yükle
with open("data.json", "r") as f:
    sensor_data = json.load(f)

current_index = 0
current_data = {}

# 🔁 Arka planda veri değiştir
def update_data():
    global current_index, current_data

    while True:
        current_data = sensor_data[current_index]
        current_index = (current_index + 1) % len(sensor_data)
        time.sleep(5)

threading.Thread(target=update_data, daemon=True).start()


@router.get("/latest")
def get_latest():
    return current_data


@router.get("/analyze")
def analyze_data():
    alerts = analyze(current_data)
    return {
        "data": current_data,
        "alerts": alerts
    }


@router.get("/all")
def get_all():
    return sensor_data