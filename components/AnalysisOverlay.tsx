import React, { useEffect, useState } from 'react';
import { AnalyzedHotspot, RiskLevel, TimelineForecast } from '../types';
import { fetchTimelinePrediction } from '../services/geminiService';
import RiskForecastChart from './RiskForecastChart';

interface AnalysisOverlayProps {
  hotspot: AnalyzedHotspot;
  onClose: () => void;
}

const getRiskColor = (riskLevel: RiskLevel | undefined) => {
  switch (riskLevel) {
    case RiskLevel.High: return 'text-orange-500';
    case RiskLevel.Extreme: return 'text-red-500';
    case RiskLevel.Medium: return 'text-yellow-500';
    case RiskLevel.Low: return 'text-green-500';
    default: return 'text-blue-500';
  }
};

const getRiskBadgeColor = (riskLevel: RiskLevel | undefined) => {
    switch (riskLevel) {
      case RiskLevel.High: return 'bg-orange-500/20 border-orange-500/30 text-orange-300';
      case RiskLevel.Extreme: return 'bg-red-500/20 border-red-500/30 text-red-300';
      case RiskLevel.Medium: return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      case RiskLevel.Low: return 'bg-green-500/20 border-green-500/30 text-green-300';
      default: return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
    }
  };

const ProgressBar: React.FC<{ label: string; value: number; max: number; unit: string; color: string }> = ({ label, value, max, unit, color }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-200 font-mono">{value.toFixed(1)}{unit}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full ${color}`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const AnalysisOverlay: React.FC<AnalysisOverlayProps> = ({ hotspot, onClose }) => {
  const { envData, prediction } = hotspot;
  const riskColor = getRiskColor(prediction?.riskLevel);
  const badgeStyle = getRiskBadgeColor(prediction?.riskLevel);
  const [forecast, setForecast] = useState<TimelineForecast[]>([]);

  useEffect(() => {
    const loadForecast = async () => {
        if (hotspot.fireData.lat && hotspot.fireData.lon) {
            const data = await fetchTimelinePrediction(hotspot.fireData.lat, hotspot.fireData.lon);
            setForecast(data);
        }
    };
    loadForecast();
  }, [hotspot]);

  return (
    <div className="absolute top-4 left-4 right-4 md:left-auto md:top-6 md:right-6 md:w-96 glass-panel rounded-xl shadow-2xl border border-white/10 z-50 animate-fade-in max-h-[80vh] md:max-h-[90vh] overflow-y-auto">
      <div className="p-5 border-b border-white/5 flex justify-between items-start sticky top-0 bg-[#0f172a] z-10">
        <div>
            <h2 className="text-lg font-bold text-white leading-tight mb-1">{envData.locationName}</h2>
            <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 text-xs font-bold rounded border ${badgeStyle}`}>
                    {prediction?.riskLevel || 'Analyzing'}
                </span>
                {prediction?.source === 'XGBoost' && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded border bg-blue-600/20 border-blue-500/30 text-blue-300">
                        AI Model
                    </span>
                )}
            </div>
        </div>
        <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Prediction Explanation */}
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <p className="text-sm text-gray-300 leading-relaxed">
                {prediction?.explanation}
            </p>
        </div>

        {/* Environmental Data Visuals */}
        <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Environmental Factors</h3>
            
            <ProgressBar 
                label="Temperature" 
                value={envData.temperature} 
                max={50} 
                unit="°C" 
                color="bg-orange-500" 
            />
            <ProgressBar 
                label="Humidity" 
                value={envData.humidity} 
                max={100} 
                unit="%" 
                color="bg-blue-400" 
            />
            <ProgressBar 
                label="Wind Speed" 
                value={envData.windSpeed} 
                max={50} 
                unit=" km/h" 
                color="bg-cyan-400" 
            />
            <ProgressBar 
                label="Rainfall (24h)" 
                value={envData.rainfall} 
                max={20} 
                unit=" mm" 
                color="bg-blue-600" 
            />
            <ProgressBar 
                label="Vegetation (NDVI)" 
                value={envData.ndvi} 
                max={1} 
                unit="" 
                color="bg-green-500" 
            />
             <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-gray-800/50 p-2 rounded border border-gray-700 text-center">
                    <div className="text-xs text-gray-500">Elevation</div>
                    <div className="text-sm font-mono text-gray-300">{envData.elevation.toFixed(0)}m</div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded border border-gray-700 text-center">
                    <div className="text-xs text-gray-500">Slope</div>
                    <div className="text-sm font-mono text-gray-300">{envData.slope.toFixed(1)}°</div>
                </div>
            </div>
        </div>

        {/* Timeline Chart */}
        {forecast.length > 0 && (
            <RiskForecastChart forecast={forecast} />
        )}
      </div>
    </div>
  );
};

export default AnalysisOverlay;
