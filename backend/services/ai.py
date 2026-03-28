def analyze(data):
    alerts = []

    if data["humidity"] > 85 and 18 <= data["temperature"] <= 24:
        alerts.append("⚠️ Yüksek mantar riski! Havalandırma yap.")

    if data["soilMoisture"] < 30:
        alerts.append("💧 Toprak kuru! Sulama önerilir.")

    if data["light"] < 8000:
        alerts.append("☀️ Işık yetersiz.")

    return alerts