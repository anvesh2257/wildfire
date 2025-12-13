
import React, { useEffect, useRef } from 'react';
import { ActiveFire, AnalyzedHotspot, RiskLevel } from '../types';

declare const L: any; // Use Leaflet global object

interface MapComponentProps {
  allActiveFires: ActiveFire[];
  analyzedHotspots: AnalyzedHotspot[];
  focusedHotspot: AnalyzedHotspot | null;
  customPrediction: AnalyzedHotspot | null;
  onMapClick: (lat: number, lon: number) => void;
}

const getRiskColor = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
        case RiskLevel.High: return '#f97316'; // orange-500
        case RiskLevel.Extreme: return '#ef4444'; // red-500
        case RiskLevel.Medium: return '#eab308'; // yellow-500
        default: return '#84cc16'; // lime-500
    }
}

const MapComponent: React.FC<MapComponentProps> = ({ allActiveFires, analyzedHotspots, focusedHotspot, customPrediction, onMapClick }) => {
  const mapRef = useRef<any>(null);
  const generalFiresLayerRef = useRef<any>(null);
  const analyzedHotspotsLayerRef = useRef<any>(null);
  const customPredictionLayerRef = useRef<any>(null);
  
  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map', { 
        zoomControl: false,
        minZoom: 3, // Prevent zooming out too far
        maxBounds: [[-90, -180], [90, 180]], // Restrict panning to the world
        maxBoundsViscosity: 1.0 // Sticky bounds
      }).setView([20, 0], 3);

      // 1. Satellite Base Layer (Esri World Imagery)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
        noWrap: true
      }).addTo(mapRef.current);

      // 2. Labels Overlay (Esri World Boundaries and Places)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        noWrap: true
      }).addTo(mapRef.current);
      
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      
      // Add click handler for custom location analysis
      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        onMapClick(lat, lng);
      });
    }
  }, [onMapClick]);
  
  // Fly to focused hotspot
  useEffect(() => {
      if (mapRef.current && focusedHotspot) {
          mapRef.current.flyTo([focusedHotspot.fireData.lat, focusedHotspot.fireData.lon], 8, {
              animate: true,
              duration: 1.5
          });
      }
  }, [focusedHotspot]);

  // Update map layers
  useEffect(() => {
    if (!mapRef.current) return;
    
    // 1. General fires layer (all fires)
    if (generalFiresLayerRef.current) {
        mapRef.current.removeLayer(generalFiresLayerRef.current);
    }
    const fireIcon = L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2Y5NzMxNiIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCI+PHBhdGggZD0iTTEyLjM3MywzLjQzNmMwLjE0My0wLjMzNiwwLjQ5My0wLjUzOSwwLjg2Ni0wLjUzOWMwLjM3MywwLDAuNzIzLDAuMjAzLDAuODY2LDAuNTM5bDAuMTA3LDAuMjQ4YzAuMzA2LDAuNzExLDAuOTgyLDEuNDIzLDEuODcxLDEuNzM1bDAsMGwwLDBsMC4xOTIsMC4wNTZjMC4zNDUsMC4xLDAuNTc5LDAuNDI3LDAuNTc5LDAuNzkxYzAsMC40NjYtMC4zNzgsMC44NDQtMC44NDMsMC44NDRoLTAuMTIxbC0wLjIwNi0wLjA2Yy0wLjg1Ny0wLjI1MS0xLjczMywwLjA2My0yLjI3OCwwLjY2NGMtMC41NDUsMC42MDEtMC43NjIsMS40MjQtMC42NDEsMi4yNDFsMC4wNDQsMC4zMDFjMC4wNzUsMC41MTYtMC4zMDgsMC45NzgtMC44MjYsMC45NzhoLTIuNTE2Yy0wLjUxOCwwLTAuOTAxLTAuNDYyLTAuODI2LTAuOTc4bDAuMDQ0LTAuMzAxYzAuMTIxLTAuODE4LTAuMDk2LTEuNjQtMC42NDEtMi4yNDFjLTAuNTQ1LTAuNjAxLTEuNDIxLTAuOTE1LTIuMjc4LTAuNjY0bC0wLjIwNiwwLjA2SCw1LjY3M2MtMC40NjUsMC0wLjg0My0wLjM3OC0wLjg0My0wLjg0NGMwLTAuMzY0LDAuMjM0LTAuNjkxLDAuNTc5LTAuNzkxbDAuMTkyLTAuMDU2YzAuODg5LTAuMzEyLDEuNTY1LTEuMDI0LDEuODcxLTEuNzM1bDAuMTA3LTAuMjQ4Wm0tMS41NDQsOS4yNTNjMC40ODIsMS4xODgsMS42NTgsMS45OTUsMi45NTIsMS45OTVzMi40NjktMC44MDcsMi45NTItMS45OTVsMS41NjQtMy44NTJjMC4zMDUtMC43NTItMC4yNTYtMS42MTItMS4wOTMtMS43NzhMNy45NzcsOC4wNDdjLTAuODM3LDAuMTY1LTAuODk5LDEuMDI3LTEuMDkzLDEuNzc4bDEuNTY0LDMuODUxWm0xLjA3NiwyLjA0MmMtMC4wNDIsMC41MTcsMC4zNTEsMC45NjEsMC44NTgsMC45NjFsMi40MjUsMGMwLjUwOCwwLDAuOTAxLTAuNDQ0LDAuODU4LTAuOTYxbC0wLjI2NC0zLjI1NWMtMC4wNTItMC42NDItMC41OTMtMS4xNDgtMS4yMzYtMS4xNDhzLTEuMTg0LDAuNTA2LTEuMjM2LDEuMTQ4bC0wLjI2NCwzLjI1NFoiLz48L3N2Zz4=',
        iconSize: [16, 16],
    });
    const fireMarkers = allActiveFires.map(fire => L.marker([fire.lat, fire.lon], { icon: fireIcon, opacity: 0.7 }));
    generalFiresLayerRef.current = L.layerGroup(fireMarkers).addTo(mapRef.current);
    
    // 2. Analyzed hotspots layer
    if (analyzedHotspotsLayerRef.current) {
        mapRef.current.removeLayer(analyzedHotspotsLayerRef.current);
    }
    const hotspotMarkers = analyzedHotspots.map(hotspot => {
        const riskColor = getRiskColor(hotspot.prediction!.riskLevel);
        const dangerMarker = L.circleMarker([hotspot.fireData.lat, hotspot.fireData.lon], {
            radius: 12,
            color: riskColor,
            fillColor: riskColor,
            fillOpacity: 0.4,
            weight: 2,
            className: 'pulsating-marker'
        });
        
        const sourceBadge = hotspot.prediction?.source === 'XGBoost' 
            ? `<span style="background-color: #2563eb; color: white; padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: bold; margin-right: 5px; display: inline-flex; align-items: center;">⚡ XGBoost</span>` 
            : '';

        const popupContent = `
            <div class="p-1">
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    ${sourceBadge}
                    <h3 class="font-bold text-md" style="color:${riskColor}; margin: 0;">${hotspot.prediction?.riskLevel} Risk Zone</h3>
                </div>
                <p class="text-sm text-gray-300 mt-1">
                    ${hotspot.envData.locationName}
                </p>
            </div>
        `;
        dangerMarker.bindPopup(popupContent, { className: 'custom-popup', closeButton: false });
        
        return dangerMarker;
    });
    analyzedHotspotsLayerRef.current = L.layerGroup(hotspotMarkers).addTo(mapRef.current);
    
    // 3. Custom prediction marker
    if (customPredictionLayerRef.current) {
        mapRef.current.removeLayer(customPredictionLayerRef.current);
    }
    if (customPrediction) {
        const riskColor = getRiskColor(customPrediction.prediction!.riskLevel);
        const customMarker = L.circleMarker([customPrediction.fireData.lat, customPrediction.fireData.lon], {
            radius: 15,
            color: '#3b82f6', // blue-500
            fillColor: riskColor,
            fillOpacity: 0.6,
            weight: 3,
            className: 'custom-location-marker'
        });
        
        const sourceBadge = customPrediction.prediction?.source === 'XGBoost' 
            ? `<span style="background-color: #2563eb; color: white; padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: bold; margin-right: 5px; display: inline-flex; align-items: center;">⚡ XGBoost</span>` 
            : '';

        const popupContent = `
            <div class="p-1">
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    ${sourceBadge}
                    <h3 class="font-bold text-md" style="color:${riskColor}; margin: 0;">📍 Custom Analysis</h3>
                </div>
                <p class="text-sm font-semibold" style="color:${riskColor}">${customPrediction.prediction?.riskLevel} Risk</p>
                <p class="text-sm text-gray-300 mt-1">
                    ${customPrediction.envData.locationName}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                    ${customPrediction.fireData.lat.toFixed(4)}, ${customPrediction.fireData.lon.toFixed(4)}
                </p>
            </div>
        `;
        customMarker.bindPopup(popupContent, { className: 'custom-popup', closeButton: false });
        customMarker.openPopup();
        
        customPredictionLayerRef.current = L.layerGroup([customMarker]).addTo(mapRef.current);
    }
    
    // Inject CSS for popups and animations
    const style = document.createElement('style');
    style.innerHTML = `
        .custom-popup .leaflet-popup-content-wrapper {
            background: rgba(31, 41, 55, 0.85); backdrop-filter: blur(5px);
            color: #D1D5DB; border-radius: 8px; border: 1px solid #4B5563;
        }
        .custom-popup .leaflet-popup-content { margin: 10px; }
        .custom-popup .leaflet-popup-tip { background: rgba(31, 41, 55, 0.85); }
        
        @keyframes pulse {
            0% { transform: scale(0.9); opacity: 0.8; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.8; }
        }
        .pulsating-marker {
            animation: pulse 2s infinite;
        }
        .custom-location-marker {
            animation: pulse 2s infinite;
            filter: drop-shadow(0 0 8px #3b82f6);
        }
    `;
    document.head.appendChild(style);

  }, [allActiveFires, analyzedHotspots, customPrediction]);

  return <div id="map" className="h-full w-full bg-gray-900" />;
};

export default MapComponent;
