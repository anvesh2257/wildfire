import { WildfireInputData, PredictionResult, RiskLevel, ActiveFire, TimelineForecast } from '../types';
import { fetchActiveFires } from './nasaFirmsService';

const createPrompt = (data: WildfireInputData): string => {
  return `
    You are a predictive intelligence agent specializing in wildfire risk assessment. Your core model is a sophisticated spatiotemporal model trained on vast environmental and historical fire data from sources like NASA FIRMS.

    Based on the following real-time environmental data for a specific grid cell located at "${data.locationName}", predict the wildfire ignition or spread risk. Provide your assessment in the requested JSON format.

    Environmental Data:
    - Temperature: ${data.temperature}°C
    - Relative Humidity: ${data.humidity}%
    - Wind Speed: ${data.windSpeed} km/h
    - Recent Rainfall (last 24h): ${data.rainfall} mm
    - Vegetation Index (NDVI): ${data.ndvi.toFixed(2)}
    - Topography Elevation: ${data.elevation} meters
    - Topography Slope: ${data.slope}°

    Analyze these factors to determine the fire probability. High temperatures, low humidity, and high winds are critical risk factors. Low rainfall and high NDVI (dense vegetation) increase fuel load. Steeper slopes can accelerate fire spread.

    Return the risk level and a concise explanation.
  `;
};

export const fetchWildfirePrediction = async (data: WildfireInputData, lat?: number, lon?: number): Promise<PredictionResult> => {
  try {
    // 1. Try to get prediction from local XGBoost API
    try {
        const response = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lat: lat || 0,
                lon: lon || 0,
                temperature: data.temperature,
                humidity: data.humidity,
                wind_speed: data.windSpeed,
                rainfall: data.rainfall,
                ndvi: data.ndvi,
                elevation: data.elevation
            }),
        });

        if (response.ok) {
            const result = await response.json();
            
            // Map string risk to Enum
            let riskLevel = RiskLevel.Low;
            if (result.risk_level === "Extreme") riskLevel = RiskLevel.Extreme;
            else if (result.risk_level === "High") riskLevel = RiskLevel.High;
            else if (result.risk_level === "Medium") riskLevel = RiskLevel.Medium;

            return {
                riskLevel,
                explanation: `XGBoost Model Prediction: ${(result.fire_probability * 100).toFixed(2)}% probability. Risk Level: ${result.risk_level}. (Temp: ${data.temperature.toFixed(1)}°C, Wind: ${data.windSpeed.toFixed(1)}km/h)`,
                source: 'XGBoost'
            };
        }
    } catch (apiError) {
        console.warn("Local XGBoost API unavailable, falling back to heuristic/Gemini...", apiError);
    }

    // 2. Fallback to original logic if API fails
    // Fetch active fire data from NASA FIRMS API
    const fireData = await fetchActiveFires();
    
    let nearbyFireCount = 0;
    let nearestFireDistance = Infinity;
    
    // If coordinates provided, calculate proximity to fires
    if (lat !== undefined && lon !== undefined) {
      fireData.forEach(fire => {
        const distance = calculateDistance(lat, lon, fire.lat, fire.lon);
        if (distance < nearestFireDistance) {
          nearestFireDistance = distance;
        }
        if (distance < 100) { // within 100km
          nearbyFireCount++;
        }
      });
    }
    
    // Calculate risk score based on environmental factors
    let riskScore = 0;
    const factors: string[] = [];
    
    // Temperature factor (higher temp = higher risk)
    if (data.temperature > 35) {
      riskScore += 3;
      factors.push('extreme heat');
    } else if (data.temperature > 30) {
      riskScore += 2;
      factors.push('high temperature');
    }
    
    // Humidity factor (lower humidity = higher risk)
    if (data.humidity < 30) {
      riskScore += 3;
      factors.push('low humidity');
    } else if (data.humidity < 50) {
      riskScore += 1;
      factors.push('moderate humidity');
    }
    
    // Wind speed factor (higher wind = higher risk)
    if (data.windSpeed > 25) {
      riskScore += 2;
      factors.push('strong winds');
    } else if (data.windSpeed > 15) {
      riskScore += 1;
      factors.push('moderate winds');
    }
    
    // Rainfall factor (less rain = higher risk)
    if (data.rainfall < 2) {
      riskScore += 2;
      factors.push('dry conditions');
    }
    
    // Vegetation factor (higher NDVI = more fuel)
    if (data.ndvi > 0.6) {
      riskScore += 2;
      factors.push('dense vegetation');
    } else if (data.ndvi > 0.4) {
      riskScore += 1;
    }
    
    // Slope factor (steeper = faster spread)
    if (data.slope > 20) {
      riskScore += 1;
      factors.push('steep terrain');
    }
    
    // Nearby fires factor
    if (nearbyFireCount > 0) {
      riskScore += 3;
      factors.push(`${nearbyFireCount} active fire(s) within 100km`);
    }
    
    // Determine risk level based on score
    let riskLevel: RiskLevel;
    if (riskScore >= 10) {
      riskLevel = RiskLevel.Extreme;
    } else if (riskScore >= 7) {
      riskLevel = RiskLevel.High;
    } else if (riskScore >= 4) {
      riskLevel = RiskLevel.Medium;
    } else {
      riskLevel = RiskLevel.Low;
    }
    
    // Generate explanation
    let explanation = `Risk assessment for ${data.locationName}: `;
    
    if (nearbyFireCount > 0) {
      explanation += `${nearbyFireCount} active fire(s) detected within 100km (nearest: ${nearestFireDistance.toFixed(1)}km). `;
    } else {
      explanation += `No active fires detected within 100km. `;
    }
    
    if (factors.length > 0) {
      explanation += `Risk factors: ${factors.join(', ')}. `;
    }
    
    explanation += `Environmental conditions: ${data.temperature.toFixed(1)}°C, ${data.humidity.toFixed(0)}% humidity, ${data.windSpeed.toFixed(1)} km/h winds, ${data.rainfall.toFixed(1)}mm rain.`;

    return {
      riskLevel,
      explanation,
    };
  } catch (error) {
    console.error('Error fetching wildfire prediction from NASA FIRMS:', error);
    throw new Error('Failed to get prediction from NASA FIRMS API.');
  }
};

const createEnvironmentDataPrompt = (lat: number, lon: number): string => {
  return `
    As an environmental data retrieval agent, find the most recent and accurate data for the specified geographic coordinates.
    Provide the data in the requested JSON format, including a human-readable location name. If a precise value isn't available, provide a reasonable, recent estimate based on reliable sources (e.g., weather APIs, satellite data).

    Coordinates:
    - Latitude: ${lat.toFixed(5)}
    - Longitude: ${lon.toFixed(5)}

    Data Points Required:
    - Temperature (°C)
    - Relative Humidity (%)
    - Wind Speed (km/h)
    - Rainfall in last 24h (mm)
    - Normalized Difference Vegetation Index (NDVI)
    - Elevation (meters)
    - Slope (degrees, average for the area)
    - Location Name (e.g., "region, country")

    Return ONLY the JSON object.
  `;
};

// Helper function to get location name from coordinates using reverse geocoding
const getLocationName = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
    if (response.ok) {
      const data = await response.json();
      return data.display_name || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    }
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
  }
  return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
};

// Generate environmental data based on location using Open-Meteo API
export const fetchEnvironmentalDataForCoords = async (lat: number, lon: number, name?: string): Promise<WildfireInputData> => {
  try {
    // Get location name (use provided name or reverse geocode)
    const locationName = name || await getLocationName(lat, lon);
    
    // Fetch real-time weather data from Open-Meteo
    const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m&forecast_days=1`
    );
    
    if (!weatherResponse.ok) {
        throw new Error("Failed to fetch weather data");
    }

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;

    // Use real data
    const temperature = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const windSpeed = current.wind_speed_10m;
    const rainfall = current.rain; // Rain in last hour/current interval, close enough for real-time check

    // NDVI and Slope are not in standard weather APIs, so we estimate or keep mock for now
    // In a real production app, you'd use a satellite API (e.g., Sentinel Hub) for NDVI
    const ndvi = Math.max(0, Math.min(1, 0.5 + (Math.random() * 0.2 - 0.1))); 
    const elevation = Math.max(0, Math.abs(lat) * 10 + Math.random() * 100); // Rough estimate
    const slope = Math.max(0, Math.random() * 20); // Rough estimate
    
    return {
      locationName,
      temperature,
      humidity,
      windSpeed,
      rainfall,
      ndvi,
      elevation,
      slope
    };

  } catch (error) {
    console.error("Error fetching environmental data:", error);
    // Fallback to estimates if API fails
    const baseTemp = 35 - (Math.abs(lat) / 90) * 50;
    return {
        locationName: name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        temperature: baseTemp,
        humidity: 50,
        windSpeed: 10,
        rainfall: 0,
        ndvi: 0.5,
        elevation: 100,
        slope: 5
    };
  }
};

// Calculate distance between two coordinates in kilometers (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export interface EvaluationMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    total_predictions: number;
    correct_predictions: number;
}

export const evaluateModel = async (activeFires: ActiveFire[]): Promise<EvaluationMetrics | null> => {
    try {
        const response = await fetch('http://localhost:8000/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activeFires.map(f => ({ lat: f.lat, lon: f.lon })))
        });
        
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.warn("Failed to evaluate model:", error);
        return null;
    }
};

export const fetchTimelinePrediction = async (lat: number, lon: number): Promise<TimelineForecast[]> => {
    try {
        const response = await fetch('http://localhost:8000/predict/timeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lon })
        });
        
        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (error) {
        console.warn("Failed to fetch timeline:", error);
        return [];
    }
};
