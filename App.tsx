
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActiveFire, AnalyzedHotspot, RiskLevel } from './types';
import { fetchActiveFires } from './services/nasaFirmsService';
import { fetchEnvironmentalDataForCoords, fetchWildfirePrediction } from './services/geminiService';
import GlobeComponent from './components/GlobeComponent';
import RiskResultDisplay from './components/RiskResultDisplay';
import CoordinateInput from './components/CoordinateInput';
import ModelAccuracyDisplay from './components/ModelAccuracyDisplay';
import AnalysisOverlay from './components/AnalysisOverlay';
import { evaluateModel, EvaluationMetrics } from './services/geminiService';

import AuthPage from './components/AuthPage';
import AIAnalystChat from './components/AIAnalystChat';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_HOTSPOTS_TO_ANALYZE = 10;

function App() {
  const [user, setUser] = useState<string | null>(null);
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

  const analyzeCustomLocation = useCallback(async (lat: number, lon: number, name?: string) => {
    setIsAnalyzingCustom(true);
    setError(null);
    try {
      const id = `custom_${lat.toFixed(4)}_${lon.toFixed(4)}`;
      const envData = await fetchEnvironmentalDataForCoords(lat, lon, name);
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
  }, [allActiveFires]);

  // Initial Data Load (Only if Logged In)
  useEffect(() => {
    if (user) {
        runAnalysis(); 
        const intervalId = setInterval(runAnalysis, REFRESH_INTERVAL_MS);
        return () => clearInterval(intervalId);
    }
  }, [runAnalysis, user]);

  const handleLogin = (username: string) => {
      setUser(username);
      // Automatically detect location
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  analyzeCustomLocation(position.coords.latitude, position.coords.longitude, "Your Location");
              },
              (err) => {
                  console.warn("Geolocation denied or failed", err);
                  // Optional: Notify user
              }
          );
      }
  };

  if (!user) {
      return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-[450px] h-[40vh] md:h-full flex-shrink-0 glass-panel flex flex-col z-10 shadow-2xl relative order-2 md:order-1 backdrop-blur-xl bg-slate-900/80 border-r border-white/5">
        <header className="p-6 border-b border-white/5 bg-gradient-to-r from-slate-900/50 to-transparent flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-orange-500/20 rounded-lg border border-orange-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                Wildfire<span className="text-orange-500">Intel</span>
                </h1>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">
                Risk Assessment Agent
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
             <div className="text-right hidden sm:block">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Logged in as</p>
                 <div className="flex items-center justify-end gap-2">
                    <p className="text-sm text-white font-bold">{user}</p>
                 </div>
             </div>
             <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/20">
                {user?.charAt(0).toUpperCase()}
             </div>
             <button 
                onClick={() => setUser(null)} 
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
             </button>
          </div>
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
        
        <div className="flex-1 overflow-y-auto custom-scrollbar"> 
          <CoordinateInput 
            onAnalyze={analyzeCustomLocation}
            isAnalyzing={isAnalyzingCustom}
          />

          <div className="p-4 space-y-3">
            {!isLoading && error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg text-sm" role="alert">
                  <strong className="font-bold block mb-1">Analysis Failed</strong>
                  <span>{error}</span>
              </div>
            )}
            
            {customPrediction && (
              <div className="animate-fade-in">
                <h3 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider px-1">Custom Analysis</h3>
                <RiskResultDisplay 
                  key={customPrediction.id}
                  hotspot={customPrediction}
                  onSelect={() => setFocusedHotspot(customPrediction)}
                  isSelected={focusedHotspot?.id === customPrediction.id}
                />
              </div>
            )}
            
            {analyzedHotspots.length > 0 && (
              <div>
                 <h3 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider px-1 border-t border-white/5 pt-4 mt-2">Active Hotspots</h3>
                <div className="space-y-2">
                    {analyzedHotspots.map(hotspot => (
                        <RiskResultDisplay 
                        key={hotspot.id}
                        hotspot={hotspot}
                        onSelect={() => setFocusedHotspot(hotspot)}
                        isSelected={focusedHotspot?.id === hotspot.id}
                        />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
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
        
        {/* Detailed Analysis Overlay */}
        {focusedHotspot && (
            <AnalysisOverlay 
                hotspot={focusedHotspot} 
                onClose={() => setFocusedHotspot(null)} 
            />
        )}
        
        <AIAnalystChat focusedHotspot={focusedHotspot} />

      </main>
    </div>
  );
}

export default App;
