import React from 'react';
import { ChartDataPoint } from '../types';

interface PriceChartProps {
  data: ChartDataPoint[];
  title?: string;
  onBarClick?: (label: string) => void;
  selectedLabel?: string | null;
}

const PriceChart: React.FC<PriceChartProps> = ({ 
  data, 
  title = "Comparativa de Precios", 
  onBarClick,
  selectedLabel 
}) => {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <h3 className="font-bold text-lg mb-6 flex items-center justify-between text-slate-800">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          {title} <span className="text-xs font-normal text-slate-500 ml-2">(USD)</span>
        </div>
        {selectedLabel && (
          <button 
            onClick={() => onBarClick?.(selectedLabel)}
            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
            Quitar Filtro
          </button>
        )}
      </h3>
      
      <div className="flex items-end justify-between h-48 gap-2 sm:gap-4 w-full">
        {data.map((point, index) => {
          const heightPercentage = (point.value / maxVal) * 100;
          const isCheapest = point.value === minVal;
          const isSelected = selectedLabel === point.label;
          const isFaded = selectedLabel && !isSelected;
          
          return (
            <div 
              key={index} 
              className={`flex flex-col items-center justify-end h-full flex-1 group relative cursor-pointer transition-opacity duration-300 ${isFaded ? 'opacity-30 hover:opacity-50' : 'opacity-100'}`}
              onClick={() => onBarClick?.(point.label)}
            >
              <div className={`mb-2 text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 ${isSelected ? 'opacity-100' : ''}`}>
                ${point.value}
              </div>
              <div 
                className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 ease-out relative 
                  ${isSelected ? 'bg-blue-600 ring-2 ring-blue-300 scale-105' : (isCheapest ? 'bg-green-500' : 'bg-indigo-300 hover:bg-indigo-400')}
                `}
                style={{ height: `${heightPercentage}%` }}
              >
                {isCheapest && !selectedLabel && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-200 whitespace-nowrap z-10">
                    Mejor
                  </div>
                )}
              </div>
              <div className={`mt-2 text-[10px] sm:text-xs font-medium text-center truncate w-full ${isSelected ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                {point.label}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-slate-400 mt-4 italic">
        Haz clic en una barra para filtrar los resultados de abajo
      </p>
    </div>
  );
};

export default PriceChart;