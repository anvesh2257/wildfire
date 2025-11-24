from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import xgboost as xgb
import numpy as np
import os
import json
from datetime import datetime
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import math

app = FastAPI(title="Wildfire Prediction API")

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model
model = xgb.XGBClassifier()
model_path = os.path.join(os.path.dirname(__file__), 'wildfire_model.json')
history_file = os.path.join(os.path.dirname(__file__), 'prediction_history.json')

try:
    model.load_model(model_path)
    print("XGBoost model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")

# Initialize history file if not exists
if not os.path.exists(history_file):
    with open(history_file, 'w') as f:
        json.dump([], f)

class PredictionRequest(BaseModel):
    lat: float
    lon: float
    temperature: float
    humidity: float
    wind_speed: float
    rainfall: float
    ndvi: float
    elevation: float

class PredictionResponse(BaseModel):
    fire_probability: float
    risk_level: str

class ActiveFire(BaseModel):
    lat: float
    lon: float

class EvaluationResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    total_predictions: int
    correct_predictions: int

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@app.get("/")
def read_root():
    return {"status": "online", "service": "Wildfire Prediction API"}

@app.post("/predict", response_model=PredictionResponse)
def predict_fire_risk(data: PredictionRequest):
    try:
        # Prepare input
        input_data = np.array([[
            data.temperature,
            data.humidity,
            data.wind_speed,
            data.rainfall,
            data.ndvi,
            data.elevation
        ]])
        
        # Predict
        prob = float(model.predict_proba(input_data)[0][1])
        
        # Determine Risk
        if prob > 0.8: risk = "Extreme"
        elif prob > 0.6: risk = "High"
        elif prob > 0.4: risk = "Medium"
        else: risk = "Low"
            
        # Log Prediction
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "lat": data.lat,
            "lon": data.lon,
            "prob": prob,
            "risk": risk,
            "inputs": data.dict()
        }
        
        with open(history_file, 'r+') as f:
            try:
                history = json.load(f)
            except json.JSONDecodeError:
                history = []
            history.append(log_entry)
            f.seek(0)
            json.dump(history, f, indent=2)
            
        return {
            "fire_probability": prob,
            "risk_level": risk
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate", response_model=EvaluationResponse)
def evaluate_model(active_fires: List[ActiveFire]):
    try:
        with open(history_file, 'r') as f:
            history = json.load(f)
            
        if not history:
            return {
                "accuracy": 0, "precision": 0, "recall": 0,
                "total_predictions": 0, "correct_predictions": 0
            }

        tp = 0 # Predicted Fire (High/Extreme) & Fire Exists
        fp = 0 # Predicted Fire & No Fire
        tn = 0 # Predicted Safe (Low/Medium) & No Fire
        fn = 0 # Predicted Safe & Fire Exists
        
        MATCH_RADIUS_KM = 20.0 # Increased radius
        
        # Filter history to last 24 hours to ensure relevance
        current_time = datetime.now()
        recent_history = []
        for pred in history:
            try:
                pred_time = datetime.fromisoformat(pred['timestamp'])
                if (current_time - pred_time).total_seconds() < 24 * 3600:
                    recent_history.append(pred)
            except ValueError:
                continue # Skip invalid timestamps

        if not recent_history:
             return {
                "accuracy": 0, "precision": 0, "recall": 0,
                "total_predictions": 0, "correct_predictions": 0
            }

        for pred in recent_history:
            predicted_risk_high = pred['prob'] > 0.4 # Threshold for "Risk"
            
            # Check if any actual fire is near this prediction
            actual_fire_nearby = False
            for fire in active_fires:
                dist = calculate_distance(pred['lat'], pred['lon'], fire.lat, fire.lon)
                if dist <= MATCH_RADIUS_KM:
                    actual_fire_nearby = True
                    break
            
            if predicted_risk_high and actual_fire_nearby:
                tp += 1
            elif predicted_risk_high and not actual_fire_nearby:
                fp += 1
            elif not predicted_risk_high and not actual_fire_nearby:
                tn += 1
            elif not predicted_risk_high and actual_fire_nearby:
                fn += 1
                
        total = tp + fp + tn + fn
        accuracy = (tp + tn) / total if total > 0 else 0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        
        return {
            "accuracy": round(accuracy * 100, 2),
            "precision": round(precision * 100, 2),
            "recall": round(recall * 100, 2),
            "total_predictions": total,
            "correct_predictions": tp + tn
        }
        
    except Exception as e:
        print(f"Evaluation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
