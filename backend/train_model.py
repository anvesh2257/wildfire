import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import json
import os

# 1. Generate Synthetic Data
# We simulate environmental factors and their correlation with fire risk.
def generate_synthetic_data(n_samples=5000):
    np.random.seed(42)
    
    # Features
    temperature = np.random.normal(25, 10, n_samples) # Mean 25C, SD 10
    humidity = np.random.normal(50, 20, n_samples)    # Mean 50%, SD 20
    wind_speed = np.random.normal(15, 10, n_samples)  # Mean 15km/h, SD 10
    rainfall = np.random.exponential(5, n_samples)    # Exponential dist for rain
    ndvi = np.random.uniform(0, 1, n_samples)         # Vegetation index 0-1
    elevation = np.random.uniform(0, 3000, n_samples) # Elevation 0-3000m
    
    # Clip values to realistic ranges
    temperature = np.clip(temperature, -10, 50)
    humidity = np.clip(humidity, 0, 100)
    wind_speed = np.clip(wind_speed, 0, 100)
    
    # Target Variable (Fire Risk: 0=No Fire, 1=Fire)
    # Logic: High Temp + Low Humidity + High Wind = High Risk
    # Base risk from individual factors
    risk_score = (
        (temperature / 50) * 0.3 + 
        ((100 - humidity) / 100) * 0.2 + 
        (wind_speed / 100) * 0.2 + 
        (ndvi) * 0.1
    )
    
    # Interaction Terms (Critical Combinations)
    # High Temp (>30) AND Low Humidity (<30)
    risk_score += ((temperature > 30) & (humidity < 30)) * 0.2
    
    # High Wind (>20) AND Low Humidity (<30)
    risk_score += ((wind_speed > 20) & (humidity < 30)) * 0.2
    
    # Add some noise
    risk_score += np.random.normal(0, 0.05, n_samples)
    
    # Threshold for fire occurrence (simulating ground truth)
    fire_occurrence = (risk_score > 0.55).astype(int)
    
    df = pd.DataFrame({
        'temperature': temperature,
        'humidity': humidity,
        'wind_speed': wind_speed,
        'rainfall': rainfall,
        'ndvi': ndvi,
        'elevation': elevation,
        'fire_occurrence': fire_occurrence
    })
    
    return df

def train_model():
    print("Generating synthetic data...")
    df = generate_synthetic_data()
    
    X = df.drop('fire_occurrence', axis=1)
    y = df['fire_occurrence']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost model...")
    model = xgb.XGBClassifier(
        objective='binary:logistic',
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        use_label_encoder=False,
        eval_metric='logloss'
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model
    model_path = os.path.join(os.path.dirname(__file__), 'wildfire_model.json')
    model.save_model(model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_model()
