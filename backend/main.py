from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.sensor import router as sensor_router

app = FastAPI()

# CORS (frontend için şart)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensor_router, prefix="/sensor")

@app.get("/")
def root():
    return {"message": "Smart Farming API Running"}