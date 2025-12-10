import React from 'react';
import { Flight } from '../types';

interface FlightCardProps {
  flight: Flight;
}

const FlightCard: React.FC<FlightCardProps> = ({ flight }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex-1 w-full">
        {/* Route Header */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 w-full">
           <span className="font-semibold text-slate-700">{flight.origin || 'Origen'}</span>
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400">
             <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
           </svg>
           <span className="font-bold text-blue-700">{flight.destination}</span>
        </div>

        <div className="flex items-start gap-3 mb-2">
          <div className="bg-blue-50 text-blue-600 p-2 rounded-lg mt-1">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800 leading-tight">{flight.airline}</h3>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {/* Departure */}
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <span className="text-xs font-semibold uppercase text-slate-400">Ida:</span>
                <span>{flight.date}</span>
              </div>
              
              {/* Return if exists */}
              {flight.returnDate && flight.returnDate !== 'N/A' && (
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase text-slate-400">Vuelta:</span>
                  <span>{flight.returnDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-slate-600 mt-3 ml-11">
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{flight.duration}</span>
            <span className="text-xs">Duración</span>
          </div>
          <div className="flex flex-col">
             <span className={`font-medium ${flight.stops === 'Directo' ? 'text-green-600' : 'text-amber-600'}`}>
              {flight.stops}
            </span>
             <span className="text-xs">Escalas</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 pl-0 sm:pl-4 sm:border-l border-slate-100">
        <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end">
          <p className="text-xs text-slate-500 uppercase font-semibold mr-2 sm:mr-0">Precio total</p>
          <p className="text-2xl font-bold text-blue-600">
            {flight.currency} ${flight.price.toLocaleString()}
          </p>
        </div>
        <a 
          href={flight.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg w-full sm:w-auto text-center transition-colors shadow-blue-200 shadow-md"
        >
          Ver Oferta
        </a>
      </div>
    </div>
  );
};

export default FlightCard;