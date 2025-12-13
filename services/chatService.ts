
import { AnalyzedHotspot, RiskLevel } from '../types';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'agent';
    text: string;
    timestamp: Date;
}

const SAFETY_RECOMMENDATIONS = {
    'Extreme': [
        "Immediate Evacuation: Be prepared to leave immediately if advised by authorities.",
        "Stay Informed: Monitor local emergency channels continuously.",
        "Defensible Space: Ensure all flammable materials are removed from the immediate vicinity of structures."
    ],
    'High': [
        "Alertness: Stay aware of changing weather conditions.",
        "Preparation: Have an emergency kit ready.",
        "Restriction: Avoid any outdoor burning or spark-generating activities."
    ],
    'Medium': [
        "Caution: Exercise care with any fire-related activities.",
        "Maintenance: clear dry leaves and debris from gutters and yards."
    ],
    'Low': [
        "Standard Safety: Follow standard fire safety regulations.",
        "Reporting: Report any unattended fires immediately."
    ]
};

export const generateAnalystResponse = (query: string, context?: AnalyzedHotspot | null): string => {
    const q = query.toLowerCase();
    
    // 1. No Context / General Greeting
    if (!context) {
        if (q.includes('hello') || q.includes('hi') || q.includes('help')) {
            return "Hello. I am the WildfireIntel Analyst. I can assist you by analyzing wildfire risks for specific locations. Please select a location on the map or search for a city to begin a detailed assessment.";
        }
        return "To provide a specific analysis, please select a location on the map or enter coordinates in the panel.";
    }

    const { locationName, temperature, humidity, windSpeed, rainfall, ndvi } = context.envData;
    const { riskLevel } = context.prediction || { riskLevel: RiskLevel.Low };
    const risk = riskLevel;

    // 2. Risk Specific Queries
    if (q.includes('risk') || q.includes('safe') || q.includes('danger') || q.includes('status')) {
        let explanation = `Currently, the wildfire risk in **${locationName}** is assessed as **${risk}**. \n\n`;
        
        explanation += "**Reasoning:** ";
        if (risk === RiskLevel.Extreme || risk === RiskLevel.High) {
            explanation += `This elevated risk is primarily driven by `;
            const causes = [];
            if (temperature > 30) causes.push(`high temperatures (${temperature.toFixed(1)}°C)`);
            if (humidity < 30) causes.push(`critically low humidity (${humidity.toFixed(0)}%)`);
            if (windSpeed > 20) causes.push(`strong winds (${windSpeed.toFixed(1)} km/h)`);
            if (ndvi > 0.5) causes.push(`dense dry vegetation`);
            if (rainfall < 2) causes.push(`lack of recent rainfall`);
            explanation += causes.join(', ') + ".";
        } else {
            explanation += `Conditions are relatively stable. Temperatures are moderate (${temperature.toFixed(1)}°C) and humidity is sufficient (${humidity.toFixed(0)}%) to suppress rapid ignition.`;
        }
        
        return explanation;
    }

    // 3. Weather / Environment Queries
    if (q.includes('weather') || q.includes('temp') || q.includes('wind') || q.includes('rain')) {
        return `**Environmental Report for ${locationName}:**\n- Temperature: ${temperature.toFixed(1)}°C\n- Humidity: ${humidity.toFixed(0)}%\n- Wind Speed: ${windSpeed.toFixed(1)} km/h\n- Rainfall (24h): ${rainfall.toFixed(1)} mm\n\nThese factors are fed directly into our predictive XGBoost model.`;
    }

    // 4. "Why" Queries
    if (q.includes('why') || q.includes('cause')) {
        if (risk === RiskLevel.Extreme || risk === RiskLevel.High) {
            return `The high risk is a result of the 'Fire Weather Index' components aligning dangerously. Specifically, the combination of **${windSpeed.toFixed(1)} km/h winds** and **${humidity.toFixed(0)}% humidity** creates an environment where a spark could spread rapidly before containment is possible.`;
        } else {
            return `The risk is currently low because moisture levels (Humidity: ${humidity.toFixed(0)}%, Rain: ${rainfall.toFixed(1)}mm) are sufficient to prevent rapid fire spread in the current vegetation conditions.`;
        }
    }

    // 5. Future / Forecast (referenced timeline)
    if (q.includes('future') || q.includes('tomorrow') || q.includes('change') || q.includes('forecast')) {
        return `Based on our 1-year predictive timeline (visible in the chart), risks fluctuate with seasonal patterns. Please refer to the timeline graph in the analysis panel for a detailed monthly breakdown. Generally, risk increases as local temperatures peak and rainfall minimizes.`;
    }

    // 6. Safety Recommendations
    if (q.includes('do') || q.includes('recommend') || q.includes('prepare') || q.includes('safety')) {
        const recommendations = SAFETY_RECOMMENDATIONS[risk] || SAFETY_RECOMMENDATIONS['Low'];
        return `**Safety Advisories for ${risk} Risk Level:**\n- ${recommendations.join('\n- ')}\n\n*Disclaimer: Always follow official instructions from local emergency services.*`;
    }

    // Default Fallback for Context
    return `I am analyzing **${locationName}**. \nCurrent Risk: **${risk}**.\n\nYou can ask me about:\n- Specific weather factors\n- Why the risk is high/low\n- Safety recommendations\n- Future forecasts`;
};
