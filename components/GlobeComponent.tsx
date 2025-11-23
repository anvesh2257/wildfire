import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { ActiveFire, AnalyzedHotspot, RiskLevel } from '../types';

interface GlobeComponentProps {
  allActiveFires: ActiveFire[];
  analyzedHotspots: AnalyzedHotspot[];
  focusedHotspot: AnalyzedHotspot | null;
  customPrediction: AnalyzedHotspot | null;
  onMapClick: (lat: number, lon: number) => void;
}

const getRiskColor = (riskLevel: RiskLevel | undefined) => {
    switch (riskLevel) {
        case RiskLevel.High: return '#f97316'; // orange-500
        case RiskLevel.Extreme: return '#ef4444'; // red-500
        case RiskLevel.Medium: return '#eab308'; // yellow-500
        case RiskLevel.Low: return '#84cc16'; // lime-500
        default: return '#3b82f6'; // blue-500
    }
}

const GlobeComponent: React.FC<GlobeComponentProps> = ({ 
    allActiveFires, 
    analyzedHotspots, 
    focusedHotspot, 
    customPrediction, 
    onMapClick 
}) => {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [globeWidth, setGlobeWidth] = useState(window.innerWidth);
  const [globeHeight, setGlobeHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setGlobeWidth(window.innerWidth);
      setGlobeHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fly to focused hotspot
  useEffect(() => {
    if (globeEl.current && focusedHotspot) {
      globeEl.current.pointOfView({
        lat: focusedHotspot.fireData.lat,
        lng: focusedHotspot.fireData.lon,
        altitude: 1.5 // Zoom level
      }, 2000);
    }
  }, [focusedHotspot]);

  // Combine analyzed hotspots and custom prediction for rings
  const ringsData = useMemo(() => {
    const rings = [...analyzedHotspots];
    if (customPrediction) {
        rings.push(customPrediction);
    }
    return rings;
  }, [analyzedHotspots, customPrediction]);

  return (
    <div className="cursor-move">
      <Globe
        ref={globeEl}
        width={globeWidth}
        height={globeHeight}
        
        // Visuals
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#3a228a"
        atmosphereAltitude={0.2}
        
        // Active Fires (Points)
        pointsData={allActiveFires}
        pointLat="lat"
        pointLng="lon"
        pointColor={() => '#ef4444'} // Red for fires
        pointAltitude={0.01}
        pointRadius={0.2}
        pointResolution={2} // Detail level
        
        // Analyzed Risks (Rings)
        ringsData={ringsData}
        ringLat={(d: any) => d.fireData.lat}
        ringLng={(d: any) => d.fireData.lon}
        ringColor={(d: any) => getRiskColor(d.prediction?.riskLevel)}
        ringMaxRadius={2}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1000}
        
        // Labels (for analyzed spots)
        labelsData={ringsData}
        labelLat={(d: any) => d.fireData.lat}
        labelLng={(d: any) => d.fireData.lon}
        labelText={(d: any) => d.prediction?.riskLevel ? `${d.prediction.riskLevel} Risk` : ''}
        labelSize={1.5}
        labelDotRadius={0.5}
        labelColor={(d: any) => getRiskColor(d.prediction?.riskLevel)}
        labelResolution={2}
        
        // Interaction
        onGlobeClick={({ lat, lng }) => onMapClick(lat, lng)}
        onPointClick={(point: any) => onMapClick(point.lat, point.lon)}
      />
    </div>
  );
};

export default GlobeComponent;
