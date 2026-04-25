def analyze(sensor_data: dict) -> list:
    alerts = []
    temp = sensor_data.get("temperature", 20)
    humidity = sensor_data.get("humidity", 60)
    soil = sensor_data.get("soilMoisture", 50)
    light = sensor_data.get("light", 10000)

    if temp > 32:
        alerts.append("Sıcaklık çok yüksek!")
    elif temp < 12:
        alerts.append("Sıcaklık çok düşük!")

    if humidity > 90:
        alerts.append("Nem çok yüksek!")
    elif humidity < 40:
        alerts.append("Nem çok düşük!")

    if soil < 25:
        alerts.append("Toprak nemi kritik seviyede düşük!")

    if light < 3000:
        alerts.append("Işık yetersiz!")

    return alerts