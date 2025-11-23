import React, { useState } from 'react';

interface CoordinateInputProps {
  onAnalyze: (lat: number, lon: number) => void;
  isAnalyzing: boolean;
}

const CoordinateInput: React.FC<CoordinateInputProps> = ({ onAnalyze, isAnalyzing }) => {
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lon)) {
      setValidationError('Please enter valid numbers');
      return;
    }

    if (lat < -90 || lat > 90) {
      setValidationError('Latitude must be between -90 and 90');
      return;
    }

    if (lon < -180 || lon > 180) {
      setValidationError('Longitude must be between -180 and 180');
      return;
    }

    onAnalyze(lat, lon);
  };

  return (
    <div className="p-4 border-b border-gray-700 bg-gray-800/50">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Custom Location Analysis</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Latitude</label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g., 37.7749"
              className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              disabled={isAnalyzing}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Longitude</label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g., -122.4194"
              className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              disabled={isAnalyzing}
            />
          </div>
        </div>
        
        {validationError && (
          <p className="text-xs text-red-400">{validationError}</p>
        )}

        <button
          type="submit"
          disabled={isAnalyzing || !latitude || !longitude}
          className="w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 rounded hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            'Analyze Location'
          )}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-2">
        💡 Tip: Click anywhere on the map to analyze that location
      </p>
    </div>
  );
};

export default CoordinateInput;
