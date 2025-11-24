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
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [countries, setCountries] = useState({ features: [] });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    // Initial size
    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    // Load country data
    fetch('//unpkg.com/world-atlas/countries-110m.json')
      .then(res => res.json())
      .then(data => setCountries(data));

    return () => observer.disconnect();
  }, []);

  // Fly to focused hotspot
  useEffect(() => {
    if (globeEl.current && focusedHotspot) {
      globeEl.current.pointOfView({
        lat: focusedHotspot.fireData.lat,
        lng: focusedHotspot.fireData.lon,
        altitude: 0.5 // Closer zoom for better detail
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
    <div ref={containerRef} className="w-full h-full cursor-move">
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        
        // Visuals
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Detailed Tiles (OpenStreetMap)
        globeTileUrl="//tile.openstreetmap.org/{z}/{x}/{y}.png"
        
        atmosphereColor="#3a228a"
        atmosphereAltitude={0.2}

        // Polygons (Countries)
        polygonsData={countries.features}
        polygonCapColor={() => 'rgba(0,0,0,0)'} // Transparent fill
        polygonSideColor={() => 'rgba(0,0,0,0)'}
        polygonStrokeColor={() => '#555555'} // Light grey borders
        polygonAltitude={0.005}
        
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
