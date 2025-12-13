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
    <div className="p-5">
      <h3 className="text-sm font-semibold text-gray-200 mb-4 tracking-tight">Custom Location Analysis</h3>
      
      {/* Location Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Search Location</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g., California, Delhi"
            className="flex-1 px-3 py-2 text-sm bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            disabled={isAnalyzing || isSearching}
          />
          <button
            type="submit"
            disabled={isAnalyzing || isSearching || !locationName}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-slate-600"
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </div>
      </form>

      <div className="relative flex py-2 items-center mb-6">
        <div className="flex-grow border-t border-slate-800"></div>
        <span className="flex-shrink-0 mx-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">or enter coordinates</span>
        <div className="flex-grow border-t border-slate-800"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Latitude</label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g., 37.77"
              className="w-full px-3 py-2 text-sm bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              disabled={isAnalyzing}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Longitude</label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g., -122.41"
              className="w-full px-3 py-2 text-sm bg-slate-900/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all custom-number-input"
              disabled={isAnalyzing}
            />
          </div>
        </div>
        
        {validationError && (
          <p className="text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-900/30">{validationError}</p>
        )}

        <button
          type="submit"
          disabled={isAnalyzing || !latitude || !longitude}
          className="w-full px-4 py-3 text-sm font-semibold text-white bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/20"
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running Analysis...
            </span>
          ) : (
            'Analyze Location'
          )}
        </button>
      </form>
      <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
        <span className="text-yellow-500">💡</span>
        <span>Tip: Click anywhere on the map to analyze that location</span>
      </div>
    </div>
  );
};

export default CoordinateInput;
