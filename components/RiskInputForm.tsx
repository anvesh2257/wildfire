import React from 'react';
import { WildfireInputData } from '../types';
import SliderInput from './SliderInput';

interface RiskInputFormProps {
  data: WildfireInputData;
  onDataChange: (field: keyof WildfireInputData, value: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-900/50 p-4 rounded-lg">
    <h3 className="text-md font-semibold text-gray-300 mb-3">{title}</h3>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const RiskInputForm: React.FC<RiskInputFormProps> = ({ data, onDataChange, onSubmit, isLoading }) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onDataChange(name as keyof WildfireInputData, parseFloat(value));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <FormSection title="Weather & Vegetation">
          <SliderInput 
            id="temperature" 
            label="Temp." 
            value={data.temperature} 
            min={-20} max={50} step={1} unit="°C"
            tooltip="Ambient air temperature."
            onChange={handleSliderChange} />
          <SliderInput 
            id="humidity" 
            label="Humidity" 
            value={data.humidity} 
            min={0} max={100} step={1} unit="%"
            tooltip="Relative humidity. Lower values increase fire risk."
            onChange={handleSliderChange} />
          <SliderInput 
            id="windSpeed" 
            label="Wind" 
            value={data.windSpeed} 
            min={0} max={100} step={1} unit=" km/h"
            tooltip="Sustained wind speed. Higher speeds increase spread."
            onChange={handleSliderChange} />
          <SliderInput 
            id="rainfall" 
            label="Rain (24h)" 
            value={data.rainfall} 
            min={0} max={50} step={1} unit=" mm"
            tooltip="Recent rainfall. Reduces immediate fire risk."
            onChange={handleSliderChange} />
           <SliderInput 
            id="ndvi" 
            label="NDVI" 
            value={data.ndvi} 
            min={-0.2} max={1} step={0.01} unit=""
            tooltip="Normalized Difference Vegetation Index. Higher values indicate denser, greener vegetation (more fuel)."
            onChange={handleSliderChange} />
        </FormSection>
        
        <FormSection title="Topography">
          <SliderInput 
            id="elevation" 
            label="Elevation" 
            value={data.elevation} 
            min={0} max={4000} step={50} unit=" m"
            tooltip="Elevation above sea level."
            onChange={handleSliderChange} />
          <SliderInput 
            id="slope" 
            label="Slope" 
            value={data.slope} 
            min={0} max={45} step={1} unit="°"
            tooltip="Steepness of the terrain. Fire spreads faster uphill."
            onChange={handleSliderChange} />
        </FormSection>
      </div>

      <div className="pt-2">
        <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8-0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Risk...
            </>
          ) : 'Analyze Risk'}
        </button>
      </div>
    </form>
  );
};

export default RiskInputForm;