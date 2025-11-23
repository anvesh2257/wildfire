
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActiveFire, AnalyzedHotspot, RiskLevel } from './types';
import { fetchActiveFires } from './services/nasaFirmsService';
import { fetchEnvironmentalDataForCoords, fetchWildfirePrediction } from './services/geminiService';
import GlobeComponent from './components/GlobeComponent';
import RiskResultDisplay from './components/RiskResultDisplay';
import CoordinateInput from './components/CoordinateInput';
import ModelAccuracyDisplay from './components/ModelAccuracyDisplay';
import { evaluateModel, EvaluationMetrics } from './services/geminiService';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_HOTSPOTS_TO_ANALYZE = 10;

function App() {
  const [allActiveFires, setAllActiveFires] = useState<ActiveFire[]>([]);
  const [analyzedHotspots, setAnalyzedHotspots] = useState<AnalyzedHotspot[]>([]);
  const [focusedHotspot, setFocusedHotspot] = useState<AnalyzedHotspot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [customPrediction, setCustomPrediction] = useState<AnalyzedHotspot | null>(null);
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState<boolean>(false);
  const [accuracyMetrics, setAccuracyMetrics] = useState<EvaluationMetrics | null>(null);
  
  const analysisInProgress = useRef(false);

  const runAnalysis = useCallback(async () => {
    if (analysisInProgress.current) return;
    analysisInProgress.current = true;

    setIsLoading(true);
    setError(null);
    try {
      const fires = await fetchActiveFires();
      setAllActiveFires(fires);

      const sortedFires = [...fires].sort((a, b) => b.brightness - a.brightness);
      const topFires = sortedFires.slice(0, MAX_HOTSPOTS_TO_ANALYZE);

      // Analyze fires in parallel
      const analysisPromises = topFires.map(async (fire): Promise<AnalyzedHotspot | null> => {
        try {
          const id = `${fire.lat.toFixed(4)}_${fire.lon.toFixed(4)}`;
          const envData = await fetchEnvironmentalDataForCoords(fire.lat, fire.lon);
          const prediction = await fetchWildfirePrediction(envData, fire.lat, fire.lon);
          return { id, fireData: fire, envData, prediction };
        } catch (e) {
          console.error(`Failed to analyze hotspot at ${fire.lat}, ${fire.lon}:`, e);
          return null; // Ignore hotspots that fail analysis
        }
      });
      
      const results = (await Promise.all(analysisPromises)).filter(Boolean) as AnalyzedHotspot[];
      
      const sortedResults = results.sort((a, b) => {
        const riskOrder = [RiskLevel.Extreme, RiskLevel.High, RiskLevel.Medium, RiskLevel.Low];
        return riskOrder.indexOf(a.prediction!.riskLevel) - riskOrder.indexOf(b.prediction!.riskLevel);
      });

      setAnalyzedHotspots(sortedResults);
      setLastUpdated(new Date());

      // Evaluate model accuracy
      const metrics = await evaluateModel(fires);
      setAccuracyMetrics(metrics);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      analysisInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    runAnalysis(); // Initial run
    const intervalId = setInterval(runAnalysis, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [runAnalysis]);

  const analyzeCustomLocation = useCallback(async (lat: number, lon: number) => {
    setIsAnalyzingCustom(true);
    setError(null);
    try {
      const id = `custom_${lat.toFixed(4)}_${lon.toFixed(4)}`;
      const envData = await fetchEnvironmentalDataForCoords(lat, lon);
      const prediction = await fetchWildfirePrediction(envData, lat, lon);
      
      const customHotspot: AnalyzedHotspot = {
        id,
        fireData: { lat, lon, brightness: 0, acq_date: new Date().toISOString() },
        envData,
        prediction
      };
      
      setCustomPrediction(customHotspot);
      setFocusedHotspot(customHotspot);

      // Refresh accuracy metrics immediately
      const metrics = await evaluateModel(allActiveFires);
      setAccuracyMetrics(metrics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze location.';
      setError(errorMessage);
    } finally {
      setIsAnalyzingCustom(false);
    }
  }, []);

  return (
    <div className="h-screen w-screen flex font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[450px] flex-shrink-0 glass-panel flex flex-col z-10 shadow-2xl relative">
        <header className="p-6 border-b border-white/5 bg-gradient-to-r from-slate-900/50 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg border border-orange-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Wildfire<span className="text-orange-500">Intel</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 font-medium ml-1">
            Predictive Risk Assessment Agent
          </p>
        </header>
        
        <div className="px-6 py-3 flex justify-between items-center border-b border-white/5 bg-slate-900/30">
            <div className='text-xs font-medium text-slate-400 flex items-center gap-2'>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                {isLoading ? "Syncing with NASA..." : `Updated: ${lastUpdated?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || 'N/A'}`}
            </div>
            <button onClick={runAnalysis} disabled={isLoading} className="text-xs font-semibold text-blue-400 hover:text-blue-300 disabled:text-slate-600 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh Data
            </button>
        </div>
        
        <CoordinateInput 
          onAnalyze={analyzeCustomLocation}
          isAnalyzing={isAnalyzingCustom}
        />

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && analyzedHotspots.length === 0 && (
            <div className="text-center text-gray-400 py-10">
                <svg className="animate-spin h-8 w-8 text-white mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8-0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing global fire data...
            </div>
          )}
          {!isLoading && error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg" role="alert">
                <strong className="font-bold">Analysis Failed: </strong>
                <span>{error}</span>
            </div>
          )}
          {customPrediction && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Custom Analysis</h3>
              <RiskResultDisplay 
                key={customPrediction.id}
                hotspot={customPrediction}
                onSelect={() => setFocusedHotspot(customPrediction)}
                isSelected={focusedHotspot?.id === customPrediction.id}
              />
            </div>
          )}
          {analyzedHotspots.length > 0 && (
            <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide pt-2 border-t border-gray-700">Active Hotspots</h3>
          )}
          {analyzedHotspots.map(hotspot => (
            <RiskResultDisplay 
              key={hotspot.id}
              hotspot={hotspot}
              onSelect={() => setFocusedHotspot(hotspot)}
              isSelected={focusedHotspot?.id === hotspot.id}
            />
          ))}
        </div>
        
        <ModelAccuracyDisplay metrics={accuracyMetrics} />
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 relative bg-gray-900">
        <GlobeComponent 
          allActiveFires={allActiveFires}
          analyzedHotspots={analyzedHotspots}
          focusedHotspot={focusedHotspot}
          customPrediction={customPrediction}
          onMapClick={analyzeCustomLocation}
        />
      </main>
    </div>
  );
}

export default App;
