import React, { useState } from 'react';

interface CoordinateInputProps {
  onAnalyze: (lat: number, lon: number, name?: string) => void;
  isAnalyzing: boolean;
}

const CoordinateInput: React.FC<CoordinateInputProps> = ({ onAnalyze, isAnalyzing }) => {
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim()) return;

    setIsSearching(true);
    setValidationError('');

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setLatitude(lat);
        setLongitude(lon);
        // Optional: Update location name to the full matched name
        // setLocationName(display_name); 
        onAnalyze(parseFloat(lat), parseFloat(lon), display_name);
      } else {
        setValidationError('Location not found');
      }
    } catch (err) {
      setValidationError('Error searching for location');
    } finally {
      setIsSearching(false);
    }
  };

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

    onAnalyze(lat, lon, locationName);
  };

  return (
    <div className="p-4 border-b border-gray-700 bg-gray-800/50">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Custom Location Analysis</h3>
      
      {/* Location Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <label className="block text-xs text-gray-400 mb-1">Search Location</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g., California, Delhi"
            className="flex-1 px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            disabled={isAnalyzing || isSearching}
          />
          <button
            type="submit"
            disabled={isAnalyzing || isSearching || !locationName}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </div>
      </form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-gray-700"></div>
        <span className="flex-shrink-0 mx-2 text-xs text-gray-500">OR ENTER COORDINATES</span>
        <div className="flex-grow border-t border-gray-700"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 mt-2">
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
