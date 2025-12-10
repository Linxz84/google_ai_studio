import React, { useState, useEffect } from 'react';
import { SearchParams, Flight, SavedSearch, RankingItem, ChartDataPoint } from './types';
import { searchFlightsWithGemini } from './services/flightService';
import FlightCard from './components/FlightCard';
import AlertModal from './components/AlertModal';
import PriceChart from './components/PriceChart';

function App() {
  // Search State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  
  // Filter State
  const [budget, setBudget] = useState<number>(0);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedChartFilter, setSelectedChartFilter] = useState<string | null>(null);
  
  // Data State
  const [flights, setFlights] = useState<Flight[]>([]);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [rawSummary, setRawSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  // Persistence State
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => {
    try {
      const saved = localStorage.getItem('vuelosFlash_saved');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertContext, setAlertContext] = useState<{origin: string, destination: string} | null>(null);

  useEffect(() => {
    localStorage.setItem('vuelosFlash_saved', JSON.stringify(savedSearches));
  }, [savedSearches]);

  useEffect(() => {
    // Reset secondary filters when flights change
    setSelectedAirlines([]);
    setSelectedChartFilter(null);
  }, [flights]);

  const allAirlines = Array.from(new Set(flights.map(f => f.airline))).sort();

  // Client-side filtering (secondary check)
  const filteredFlights = flights.filter(flight => {
    // 1. Budget Filter
    if (budget > 0 && flight.price > budget) return false;
    
    // 2. Airline Filter (Checkbox)
    if (selectedAirlines.length > 0 && !selectedAirlines.includes(flight.airline)) return false;
    
    // 3. Chart Interaction Filter
    if (selectedChartFilter) {
      // Loose matching because AI output format varies (e.g. "Nov 10" vs "2024-11-10")
      const filterLower = selectedChartFilter.toLowerCase();
      const flightDateLower = flight.date.toLowerCase();
      const flightAirlineLower = flight.airline.toLowerCase();
      const flightDestLower = flight.destination.toLowerCase();

      // Check if the chart label matches Airline, Date, or Destination
      const matches = 
        flightAirlineLower.includes(filterLower) || 
        flightDateLower.includes(filterLower) ||
        // Handle inverted date logic (filter: Nov 10, flight: 2024-11-10 -> hard to match perfectly without logic library)
        // Simple heuristic: check if parts of the filter string exist in flight date
        (filterLower.split(' ').some(part => part.length > 2 && flightDateLower.includes(part)));

      if (!matches) return false;
    }

    return true;
  });

  const handleChartClick = (label: string) => {
    if (selectedChartFilter === label) {
      setSelectedChartFilter(null); // Deselect
    } else {
      setSelectedChartFilter(label); // Select
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!origin) {
      setError("Por favor ingresa al menos un origen.");
      return;
    }

    setIsLoading(true);
    setError('');
    setHasSearched(true);
    setFlights([]);
    setRankings([]);
    setChartData([]);
    setRawSummary('');
    setSelectedChartFilter(null);

    try {
      // Pass budget as maxPrice to the AI search
      const { flights: foundFlights, rankings: foundRankings, chartData: foundChartData, rawText } = await searchFlightsWithGemini({
        origin,
        destination,
        date,
        returnDate,
        maxPrice: budget > 0 ? budget : undefined
      });
      setFlights(foundFlights);
      setRankings(foundRankings);
      setChartData(foundChartData);
      
      const summaryEndIndex = rawText.indexOf('FLIGHT_DATA:');
      const summaryText = summaryEndIndex > -1 ? rawText.substring(0, summaryEndIndex) : rawText;
      setRawSummary(summaryText);
      
    } catch (err: any) {
      setError('Hubo un error al buscar los vuelos o no se encontraron resultados. Por favor intenta de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSearch = () => {
    if (!origin) return;
    const exists = savedSearches.some(
      s => s.origin.toLowerCase() === origin.toLowerCase() && 
           s.destination.toLowerCase() === destination.toLowerCase() && 
           s.date === date &&
           s.returnDate === returnDate
    );
    if (exists) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      origin,
      destination: destination || "Cualquier destino",
      date: date || "Fecha flexible",
      returnDate: returnDate || undefined,
      timestamp: Date.now()
    };
    setSavedSearches([newSearch, ...savedSearches]);
  };

  const deleteSearch = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedSearches(savedSearches.filter(s => s.id !== id));
  };

  const loadSearch = (search: SavedSearch) => {
    setOrigin(search.origin);
    setDestination(search.destination === "Cualquier destino" ? "" : search.destination);
    setDate(search.date === "Fecha flexible" ? "" : search.date);
    setReturnDate(search.returnDate || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAlertForSearch = (e: React.MouseEvent, search: SavedSearch) => {
    e.stopPropagation();
    setAlertContext({ origin: search.origin, destination: search.destination });
    setIsAlertModalOpen(true);
  };

  const openGeneralAlert = () => {
    setAlertContext({ origin, destination: destination || "Cualquier lugar" });
    setIsAlertModalOpen(true);
  };

  const toggleAirline = (airline: string) => {
    setSelectedAirlines(prev => 
      prev.includes(airline) 
        ? prev.filter(a => a !== airline)
        : [...prev, airline]
    );
  };

  const cleanSummary = (text: any) => {
    if (!text) return null;
    const str = String(text);
    return str.split('\n').filter(line => line.trim() !== '').map((line, i) => (
      <p key={i} className="mb-2 text-slate-700 leading-relaxed">
        {line.replace(/\*\*/g, '').replace(/\*/g, '')}
      </p>
    ));
  };

  // Ranking filtering
  const dateRankings = rankings.filter(r => r.type === 'DATE');
  const airlineRankings = rankings.filter(r => r.type === 'AIRLINE');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Hero / Header Section */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white pt-10 pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
              VuelosFlash
            </h1>
            <button 
              onClick={openGeneralAlert}
              className="text-white/90 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              Crear Alerta General
            </button>
          </div>
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Encuentra tu próxima aventura</h2>
            <p className="text-xl text-blue-100">Búsqueda flexible entre fechas.</p>
          </div>
        </div>
      </header>

      {/* Search Box */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-20">
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Origen</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buenos Aires"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-800"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  required
                />
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 absolute left-3 top-3 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                <span>Destino</span>
                <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Opcional</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cualquier lugar"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 absolute left-3 top-3 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                 <span>Desde (Fecha)</span>
                 <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Opcional</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full pl-3 pr-2 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 text-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

             <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                 <span>Hasta (Fecha)</span>
                 <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Opcional</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full pl-3 pr-2 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 text-sm"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            </div>

             <div className="md:col-span-2 flex items-end">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-4 rounded-lg transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-4">
             <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="text-xs text-slate-400">
                   <span className="bg-slate-100 px-2 py-1 rounded inline-block">📅 Selecciona un rango para ver precios entre fechas.</span>
                </div>
                
                <div className="w-full sm:w-auto flex flex-col gap-1">
                   <label className="text-xs font-semibold text-slate-500 uppercase">Presupuesto Máximo (USD)</label>
                   <input 
                      type="range" 
                      min="0" 
                      max="5000" 
                      step="50"
                      value={budget} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBudget(Number(e.target.value))}
                      className="w-full sm:w-48 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-xs text-right text-slate-600 font-medium">
                      {budget > 0 ? `$${budget} USD` : 'Sin límite'}
                    </span>
                </div>
             </div>
          </div>
        </form>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <aside className="lg:col-span-1 order-2 lg:order-1 space-y-6">
          
          {/* Saved Searches */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-pink-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              Mis Búsquedas
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {savedSearches.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No tienes búsquedas guardadas.</p>
              ) : (
                savedSearches.map(search => (
                  <div key={search.id} onClick={() => loadSearch(search)} className="group p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">{search.origin} → {search.destination}</div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => deleteSearch(e, search.id)} className="p-1 hover:bg-red-100 rounded text-red-500">
                           <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* New Rankings Section */}
          {rankings.length > 0 && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in-up">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                Ranking de Precios
              </h3>

              {dateRankings.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mejores Fechas</h4>
                  <ul className="space-y-2">
                    {dateRankings.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 pb-1 last:border-0">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-semibold text-emerald-600">{item.currency} ${item.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {airlineRankings.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Aerolíneas Baratas</h4>
                  <ul className="space-y-2">
                    {airlineRankings.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 pb-1 last:border-0">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-semibold text-emerald-600">{item.currency} ${item.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
             </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
             <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Filtros
            </h3>
            
             {/* Note: Main budget input is now in the search form, but we keep this here for post-search refinement */}
             <div className="mb-6 opacity-70">
              <label className="block text-sm font-semibold text-slate-700 mb-4">Refinar Presupuesto</label>
              <input 
                type="range" 
                min="0" 
                max="5000" 
                step="50"
                value={budget} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBudget(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
               <div className="flex justify-between mt-2 text-sm text-slate-500">
                <span>{budget > 0 ? `$${budget}` : 'Todos'}</span>
              </div>
            </div>

             {allAirlines.length > 0 && (
              <div className="mb-6">
                <h4 className="block text-sm font-semibold text-slate-700 mb-3">Aerolíneas</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {allAirlines.map(airline => (
                    <label key={airline} className="flex items-center gap-2 text-slate-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedAirlines.length === 0 || selectedAirlines.includes(airline)}
                        onChange={() => toggleAirline(airline)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="text-sm truncate">{airline}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-6 border-t border-slate-100">
              <button onClick={openGeneralAlert} className="w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                Crear Alerta de Precios
              </button>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          {hasSearched && !isLoading && (
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-slate-800">Resultados desde {origin}</h2>
                <button onClick={saveSearch} className="text-sm bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 px-4 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2">
                   Guardar esta Búsqueda
                </button>
              </div>
              
              {rawSummary && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-8">
                  <div className="flex gap-3">
                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg h-fit">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                      </svg>
                    </div>
                    <div className="text-sm">
                      <h4 className="font-semibold text-indigo-900 mb-1">Resumen Inteligente</h4>
                      <div className="text-slate-700">{cleanSummary(String(rawSummary))}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart Section */}
              {chartData.length > 0 && (
                <PriceChart 
                  data={chartData} 
                  onBarClick={handleChartClick}
                  selectedLabel={selectedChartFilter}
                />
              )}

              <div className="space-y-4">
                {filteredFlights.length > 0 ? (
                  filteredFlights.map((flight: Flight) => (
                    <FlightCard key={flight.id} flight={flight} />
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500 mb-2">
                      {flights.length > 0 
                        ? 'No hay vuelos que coincidan con tus filtros actuales.' 
                        : 'No encontramos vuelos exactos listados. Intenta ampliar el rango de fechas o el presupuesto.'}
                    </p>
                    {selectedChartFilter && (
                       <button 
                         onClick={() => setSelectedChartFilter(null)}
                         className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                       >
                         Limpiar filtro de gráfico ({selectedChartFilter})
                       </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasSearched && (
            <div className="text-center py-20 opacity-50">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 mx-auto mb-4 text-slate-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <p className="text-xl font-medium text-slate-400">Ingresa tu origen para explorar el mundo</p>
              <p className="text-sm text-slate-400 mt-2">Puedes dejar el destino o la fecha vacíos.</p>
            </div>
          )}
          
          {error && (
             <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">{error}</div>
          )}
        </div>
      </div>

      <AlertModal isOpen={isAlertModalOpen} onClose={() => setIsAlertModalOpen(false)} origin={alertContext?.origin || origin} destination={alertContext?.destination || destination} />
    </div>
  );
}

export default App;