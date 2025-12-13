import { NASA_API_KEY } from '../config';
import { ActiveFire } from '../types';

// Fetches active fire data from NASA FIRMS for the last 24 hours for the whole world.
// In a production app, you might want to scope this to the current map view bounds.
export const fetchActiveFires = async (): Promise<ActiveFire[]> => {
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = String(today.getUTCMonth() + 1).padStart(2, '0');
  const day = String(today.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  // Using the VIIRS S-NPP source for high-resolution 375m data
  const source = 'VIIRS_SNPP_NRT';
  const area = 'world';
  const dayRange = '1'; // Last 24 hours

  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${NASA_API_KEY}/${source}/${area}/${dayRange}/${dateStr}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NASA FIRMS API responded with status: ${response.status}`);
    }
    const csvText = await response.text();
    const lines = csvText.split('\n');
    
    if (lines.length < 2) {
      return []; // No data
    }

    const headers = lines[0].split(',');
    const latIndex = headers.indexOf('latitude');
    const lonIndex = headers.indexOf('longitude');
    const brightnessIndex = headers.indexOf('bright_ti4'); // VIIRS I-Band 4 brightness temp (Kelvin)
    const acqDateIndex = headers.indexOf('acq_date');

    if (latIndex === -1 || lonIndex === -1) {
        throw new Error('Could not find latitude/longitude columns in FIRMS response.');
    }

    // Slice to remove header, filter to remove empty lines
    const fireData = lines.slice(1).filter(line => line.trim() !== '').map(line => {
      const data = line.split(',');
      return {
        lat: parseFloat(data[latIndex]),
        lon: parseFloat(data[lonIndex]),
        brightness: parseFloat(data[brightnessIndex]),
        acq_date: data[acqDateIndex],
      };
    });

    return fireData;

  } catch (error) {
    console.error("Error fetching or parsing NASA FIRMS data:", error);
    // Mock data fallback if API key is missing or request fails
    console.warn("Falling back to mock data due to error: " + error);
    return [
      { lat: 34.0522, lon: -118.2437, brightness: 350, acq_date: dateStr }, // Los Angeles
      { lat: 40.7128, lon: -74.0060, brightness: 320, acq_date: dateStr },  // New York
      { lat: -33.8688, lon: 151.2093, brightness: 380, acq_date: dateStr }, // Sydney
      { lat: 51.5074, lon: -0.1278, brightness: 310, acq_date: dateStr },   // London
      { lat: 35.6762, lon: 139.6503, brightness: 340, acq_date: dateStr },  // Tokyo
      { lat: -22.9068, lon: -43.1729, brightness: 360, acq_date: dateStr }, // Rio
    ];
  }
};
