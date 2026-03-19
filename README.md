# 🌱 Seralogix

**Seralogix** is an AI-powered smart agriculture platform that transforms greenhouse management into a data-driven, intelligent process.

It provides farmers with real-time insights and actionable recommendations based on environmental sensor data.

---

## 🚀 Vision

To eliminate guesswork in agriculture and empower farmers with a simple answer to:

> “What should I do in my greenhouse today?”

Seralogix focuses on delivering an **accessible, intelligent decision support system** instead of complex and expensive automation.

---

## 🎯 Key Features

* 🌡️ Real-time environmental monitoring (temperature, humidity, light, soil)
* 🤖 AI-powered disease prediction
* 💧 Smart irrigation recommendations
* 📊 Greenhouse health scoring system
* 🔔 Instant alerts & actionable notifications
* 📈 Historical data tracking & trend analysis

---

## 🧠 How It Works

1. **Data Collection**
   Sensors (BME280, BH1750, soil moisture, etc.) collect environmental data.

2. **Data Transmission**
   Arduino + ESP8266 sends data to the cloud.

3. **AI Analysis**
   The system analyzes conditions and detects risks or needs.

4. **Actionable Insights**
   Farmers receive clear recommendations via mobile app.

---

## 🛠️ Tech Stack

### Frontend

* Next.js

### Backend

* Node.js / Express.js (Microservices Architecture)

### AI & Data

* Gemini API
* PostgreSQL

### IoT Hardware

* Arduino Uno
* ESP8266 Wi-Fi Module
* BME280 (Temperature & Humidity)
* BH1750 (Light Sensor)
* Capacitive Soil Moisture Sensor
* DS18B20 (Soil Temperature)

---

## 📱 Application Modules

* **Dashboard:** Daily tasks & health score
* **Notifications:** Real-time alerts
* **Analytics:** 24-hour data visualization

---

## 🔬 AI Approach

Seralogix uses a hybrid AI model:

* Rule-based system (initial phase)
* Real-time data learning
* Continuous improvement via user feedback

---

## 🎯 Goals

* 💧 Reduce water waste
* 🌿 Increase crop yield
* ⚠️ Detect diseases early
* 👨‍🌾 Provide a smart farming assistant

---

## 📦 Installation (Development)

```bash
# clone repository
git clone https://github.com/beratcomert/seralogix.git

# frontend
cd frontend
npm install
npm run dev

# backend
cd backend
npm install
npm run start
```

---

## 📄 License

MIT License

