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
  const [states, setStates] = useState({ features: [] });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) observer.observe(containerRef.current);
    
    // Load Global Data
    Promise.all([
        fetch('https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/110m/cultural/ne_110m_admin_0_countries.json').then(r => r.json()),
        fetch('https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/110m/cultural/ne_110m_admin_1_states_provinces.json').then(r => r.json())
    ]).then(([countryData, stateData]) => {
        setCountries(countryData);
        setStates(stateData);
    }).catch(err => console.error("Failed to load map data:", err));

    return () => observer.disconnect();
  }, []);

  // Helper to calculate centroid and approximate area for filtering
  const getFeatureInfo = (feature: any) => {
      if (!feature.geometry) return null;
      
      let coords = feature.geometry.coordinates;
      // Handle MultiPolygon vs Polygon
      if (feature.geometry.type === 'MultiPolygon') {
          coords = coords.sort((a: any, b: any) => b[0].length - a[0].length)[0]; // Use largest polygon
      }
      
      const ring = feature.geometry.type === 'Polygon' ? coords[0] : coords[0];
      if (!ring) return null;

      let sumLat = 0, sumLng = 0, count = 0;
      for (const point of ring) {
          sumLng += point[0];
          sumLat += point[1];
          count++;
      }
      
      return { 
          lat: sumLat / count, 
          lng: sumLng / count,
          points: count // Rough proxy for visual size importance
      };
  };

  // Prepare Labels (Memoized for performance)
  const mapLabels = useMemo(() => {
      const labels: any[] = [];
      
      // Add Country Labels (Filtered by size to prevent clutter)
      countries.features.forEach((d: any) => {
          const info = getFeatureInfo(d);
          if (info && info.points > 20) { // Filter out tiny islands/microstates
             labels.push({
                lat: info.lat, 
                lng: info.lng, 
                text: d.properties.NAME_LONG || d.properties.NAME || d.properties.ADMIN,
                type: 'country',
                size: Math.min(1.2, Math.max(0.4, info.points / 200)) // Scale label by size
            });
          }
      });

      // Add State Labels (SELECTIVE: Only for India to avoid global clutter)
      states.features.forEach((d: any) => {
          // Check for target countries (admin name usually maps to country)
          const admin = d.properties.adm0_name || d.properties.admin;
          const isTargetCountry = admin === 'India'; // Only show for India as requested

          if (isTargetCountry) {
              const info = getFeatureInfo(d);
              if (info) {
                 labels.push({
                    lat: info.lat,
                    lng: info.lng,
                    text: d.properties.name,
                    type: 'state',
                    size: 0.5, // Smaller than country
                    color: 'rgba(148, 163, 184, 0.9)' // Slate-400
                 });
              }
          }
      });
      
      return labels;
  }, [countries, states]);

  // Fly to focused hotspot
  useEffect(() => {
    if (globeEl.current && focusedHotspot) {
      globeEl.current.pointOfView({
        lat: focusedHotspot.fireData.lat,
        lng: focusedHotspot.fireData.lon,
        altitude: 0.5 
      }, 2000);
    }
  }, [focusedHotspot]);

  const ringsData = useMemo(() => {
    const rings = [...analyzedHotspots];
    if (customPrediction) {
        rings.push(customPrediction);
    }
    return rings;
  }, [analyzedHotspots, customPrediction]);

  // Combine hotspot labels with map labels
  const allLabels = useMemo(() => {
     const hotspots = ringsData.map(d => ({
         lat: d.fireData.lat,
         lng: d.fireData.lon,
         text: d.prediction?.riskLevel ? `${d.prediction.riskLevel} Risk` : 'Analyzed',
         type: 'hotspot',
         color: getRiskColor(d.prediction?.riskLevel),
         size: 1.0,
         dotRadius: 0.3
     }));
     return [...mapLabels, ...hotspots];
  }, [ringsData, mapLabels]);
  
  return (
    <div ref={containerRef} className="w-full h-full cursor-move bg-[#020617]"> {/* Very dark slate background */}
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        
        // High Quality Textures
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        
        // Atmosphere
        atmosphereColor="#6366f1" // Indigo-500
        atmosphereAltitude={0.15}

        // Polygons (States/Provinces)
        polygonsData={[...states.features, ...countries.features]}
        polygonCapColor={() => 'rgba(0,0,0,0)'} 
        polygonSideColor={() => 'rgba(0,0,0,0.02)'}
        polygonStrokeColor={(d: any) => {
            // Countries: Brighter, States: Very subtle
            return d.properties.ADMIN ? 'rgba(203, 213, 225, 0.4)' : 'rgba(148, 163, 184, 0.15)'; 
        }}
        polygonAltitude={(d: any) => d.properties.ADMIN ? 0.006 : 0.005} // Countries slightly higher to overlay
        polygonsMerge={true}
        polygonsTransitionDuration={0}
        
        // Active Fires (Points)
        pointsData={allActiveFires}
        pointLat="lat"
        pointLng="lon"
        pointColor={() => '#ef4444'}
        pointAltitude={0.01}
        pointRadius={0.12}
        pointResolution={3}
        pointsMerge={true} // Performance optimization
        
        // Analyzed Risks (Rings)
        ringsData={ringsData}
        ringLat={(d: any) => d.fireData.lat}
        ringLng={(d: any) => d.fireData.lon}
        ringColor={(d: any) => getRiskColor(d.prediction?.riskLevel)}
        ringMaxRadius={2}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1000}
        
        // Labels
        labelsData={allLabels}
        labelLat={(d: any) => d.lat}
        labelLng={(d: any) => d.lng}
        labelText={(d: any) => d.text}
        labelSize={(d: any) => d.type === 'country' ? 0.6 : 0.9} // Smaller country labels
        labelDotRadius={(d: any) => d.dotRadius || 0} 
        labelColor={(d: any) => d.color || 'rgba(255,255,255,0.75)'} // Slightly transparent white
        labelResolution={3}
        labelAltitude={(d: any) => d.type === 'hotspot' ? 0.02 : 0.01}
        labelIncludeDot={false}
        
        // Interaction
        onGlobeClick={({ lat, lng }) => onMapClick(lat, lng)}
        onPointClick={(point: any) => onMapClick(point.lat, point.lon)}
      />
    </div>
  );
};

export default GlobeComponent;
