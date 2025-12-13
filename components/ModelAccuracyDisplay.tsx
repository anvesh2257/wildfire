import React from 'react';
import { EvaluationMetrics } from '../services/geminiService';

interface ModelAccuracyDisplayProps {
    metrics: EvaluationMetrics | null;
}

const ModelAccuracyDisplay: React.FC<ModelAccuracyDisplayProps> = ({ metrics }) => {
    if (!metrics || metrics.total_predictions === 0) {
        return (
            <div className="p-4 bg-gray-900/50 border-t border-gray-700">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Live Model Accuracy</h3>
                <p className="text-xs text-gray-500 italic">Waiting for predictions...</p>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-900/50 border-t border-gray-700">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Live Model Accuracy</h3>
                <span className="text-xs text-gray-500">({metrics.total_predictions} samples)</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                    <div className="text-lg font-bold text-blue-400">{metrics.accuracy}%</div>
                    <div className="text-[10px] text-gray-400 uppercase">Accuracy</div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                    <div className="text-lg font-bold text-green-400">{metrics.precision}%</div>
                    <div className="text-[10px] text-gray-400 uppercase">Precision</div>
                </div>
                <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                    <div className="text-lg font-bold text-purple-400">{metrics.recall}%</div>
                    <div className="text-[10px] text-gray-400 uppercase">Recall</div>
                </div>
            </div>
            
            <div className="mt-2 text-[10px] text-gray-500 text-center">
                Validated against real-time NASA FIRMS data
            </div>
        </div>
    );
};

export default ModelAccuracyDisplay;
