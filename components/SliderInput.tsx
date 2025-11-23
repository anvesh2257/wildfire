
import React from 'react';
import InfoIcon from './icons/InfoIcon';

interface SliderInputProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  tooltip: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SliderInput: React.FC<SliderInputProps> = ({ id, label, value, min, max, step, unit, tooltip, onChange }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-300 flex items-center">
          {label}
          <div className="group relative ml-2">
            <InfoIcon className="text-gray-500 hover:text-blue-400 cursor-pointer"/>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-700 text-white text-xs rounded py-1 px-2 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {tooltip}
            </div>
          </div>
        </label>
        <span className="text-sm font-semibold text-blue-400">{value}{unit}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          id={id}
          name={id}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
         <style>{`
          .slider-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: #60a5fa; /* blue-400 */
            border-radius: 50%;
            cursor: pointer;
            margin-top: -5px;
          }

          .slider-thumb::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #60a5fa; /* blue-400 */
            border-radius: 50%;
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
};

export default SliderInput;
