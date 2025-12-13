
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';
import { TimelineForecast } from '../types';

interface RiskForecastChartProps {
    forecast: TimelineForecast[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
                <p className="font-bold text-slate-200 mb-1">{`${data.month} ${data.year}`}</p>
                <div className="space-y-1">
                    <p className={`font-semibold ${data.risk === 'Extreme' ? 'text-red-500' : data.risk === 'High' ? 'text-orange-500' : 'text-blue-400'}`}>
                        Risk: {data.risk}
                    </p>
                    <p className="text-slate-400">Temp: {data.temp}°C</p>
                    <p className="text-slate-400">Humidity: {data.humidity}%</p>
                    <p className="text-slate-400">Wind: {data.wind} km/h</p>
                    <p className="text-slate-400">Rain: {data.rain} mm</p>
                    <p className="text-green-400 font-mono mt-1">Confidence: 100%</p>
                </div>
            </div>
        );
    }
    return null;
};

const RiskForecastChart: React.FC<RiskForecastChartProps> = ({ forecast }) => {
    return (
        <div className="w-full h-48 bg-slate-900/50 rounded-lg p-2 border border-slate-700/50">
            <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 pl-2">1-Year Risk Forecast</h4>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecast}>
                    <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                        dataKey="month" 
                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                        axisLine={false}
                        tickLine={false}
                        interval={2}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                        type="monotone" 
                        dataKey="prob" 
                        stroke="none" 
                        fillOpacity={1} 
                        fill="url(#colorRisk)" 
                    />
                    <Line 
                        type="monotone" 
                        dataKey="prob" 
                        stroke="#f97316" 
                        strokeWidth={2} 
                        dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
                        activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RiskForecastChart;
