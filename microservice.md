



[ Fake Data / Arduino ]
          ↓
   API Gateway (Node.js)
          ↓
 ┌───────────────┬───────────────┬───────────────┐
 │ Sensor Service│ AI Service    │ Alert Service │
 │               │ (Gemini API)  │               │
 └───────────────┴───────────────┴───────────────┘
          ↓
     PostgreSQL
          ↓
      Next.js App




smart-farming/
│
├── gateway/              # API Gateway (Express)
├── services/
│   ├── sensor-service/
│   ├── ai-service/
│   ├── alert-service/
│
├── frontend/             # Next.js
├── database/             # PostgreSQL config
├── docker-compose.yml


