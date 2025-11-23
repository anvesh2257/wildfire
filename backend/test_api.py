import requests
import json

url = "http://localhost:8000/predict"
data = {
    "lat": 34.05,
    "lon": -118.25,
    "temperature": 30.0,
    "humidity": 20.0,
    "wind_speed": 15.0,
    "rainfall": 0.0,
    "ndvi": 0.3,
    "elevation": 100.0
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
