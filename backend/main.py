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

class TimelineRequest(BaseModel):
    lat: float
    lon: float

@app.post("/predict/timeline")
def predict_timeline(data: TimelineRequest):
    try:
        # Determine Hemisphere
        is_northern = data.lat > 0
        
        # Base climate data (very rough approximation based on latitude)
        # Closer to equator (0) = hotter, consistent
        # Higher latitude = more seasonal variation
        abs_lat = abs(data.lat)
        base_temp = 30 - (abs_lat / 90) * 30
        
        forecast = []
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        current_month_idx = datetime.now().month - 1
        
        # Simulate next 12 months
        for i in range(12):
            idx = (current_month_idx + i) % 12
            month_name = months[idx]
            
            # Simulated Seasonality
            # Northern Summer: Jun-Aug (Indices 5-7)
            # Southern Summer: Dec-Feb (Indices 11, 0, 1)
            
            month_offset = idx
            if not is_northern:
                month_offset = (idx + 6) % 12
                
            # Sinusoidal temperature curve (Peak around month 6-7 in North)
            temp_seasonality = -math.cos(((month_offset) / 11) * 2 * math.pi) 
            sim_temp = base_temp + (temp_seasonality * 10) # +/- 10 degrees variation
            
            # Humidity roughly inverse to temp
            sim_humidity = 50 - (temp_seasonality * 30)
            sim_humidity = max(10, min(90, sim_humidity))
            
            # Wind speed random fluctuation
            sim_wind = 10 + np.random.normal(5, 2)
            sim_wind = max(0, sim_wind)
            
            # Rainfall (Roughly inverse to temp in Mediterranean/Temperate, but varies)
            sim_rain = max(0, (50 - (temp_seasonality * 40)))
            
            # NDVI (Vegetation follows rain with lag - simplified here)
            sim_ndvi = 0.5
            
            # Elevation (Constant)
            elevation = 100 # Default
            
            # Prepare input for model
            input_data = np.array([[
                sim_temp,
                sim_humidity,
                sim_wind,
                sim_rain,
                sim_ndvi,
                elevation
            ]])
            
            # Predict
            prob = float(model.predict_proba(input_data)[0][1])
            
            risk = "Low"
            if prob > 0.8: risk = "Extreme"
            elif prob > 0.6: risk = "High"
            elif prob > 0.4: risk = "Medium"
            
            forecast.append({
                "month": month_name,
                "year": datetime.now().year + (1 if (current_month_idx + i) >= 12 else 0),
                "prob": prob,
                "risk": risk,
                "temp": round(sim_temp, 1),
                "humidity": round(sim_humidity, 1),
                "rain": round(sim_rain, 1)
            })
            
        return forecast
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Authentication
users_file = os.path.join(os.path.dirname(__file__), 'users.json')

if not os.path.exists(users_file):
    with open(users_file, 'w') as f:
        json.dump([], f)

class UserRegister(BaseModel):
    username: str
    password: str
    email: str

class UserLogin(BaseModel):
    username: str
    password: str

@app.post("/auth/register")
def register(user: UserRegister):
    try:
        with open(users_file, 'r+') as f:
            try:
                users = json.load(f)
            except json.JSONDecodeError:
                users = []
            
            # Check if user exists
            if any(u['username'] == user.username for u in users):
                raise HTTPException(status_code=400, detail="Username already exists")
            
            users.append(user.dict())
            f.seek(0)
            json.dump(users, f, indent=2)
            f.truncate()
            
        return {"status": "success", "message": "User registered successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
def login(user: UserLogin):
    try:
        with open(users_file, 'r') as f:
            try:
                users = json.load(f)
            except json.JSONDecodeError:
                users = []
        
        # Simple plaintext password check (For prototype only)
        # In production, use hashing!
        matched_user = next((u for u in users if u['username'] == user.username and u['password'] == user.password), None)
        
        if matched_user:
            return {"status": "success", "message": "Login successful", "username": user.username}
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
