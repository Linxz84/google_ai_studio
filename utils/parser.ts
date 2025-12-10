import { Flight, RankingItem, ChartDataPoint } from '../types';

export const parseFlightResponse = (text: string): { flights: Flight[], rankings: RankingItem[], chartData: ChartDataPoint[] } => {
  const flights: Flight[] = [];
  const rankings: RankingItem[] = [];
  const chartData: ChartDataPoint[] = [];
  const lines = text.split('\n');
  
  // Helper to clean price strings (remove $, USD, commas, etc)
  const parsePrice = (str: string): number => {
    if (!str) return 0;
    // Remove everything that isn't a digit or a dot
    const cleanStr = str.replace(/[^0-9.]/g, '');
    return parseFloat(cleanStr) || 0;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    
    // Check if line contains the tag, allowing for bullet points or spaces before
    if (trimmed.includes('FLIGHT_DATA:')) {
      // Split by the tag to handle prefix text
      const contentAfterTag = trimmed.split('FLIGHT_DATA:')[1];
      if (!contentAfterTag) return;

      const parts = contentAfterTag.split('|').map(p => p.trim());
      
      // FLIGHT_DATA: Destino | Aerolínea | Precio | Moneda | Salida | Vuelta | Duración | Escalas | Link
      if (parts.length >= 8) { // Relaxed length check slightly
        const price = parsePrice(parts[2]);
        const returnDateVal = parts[5] === 'N/A' || parts[5] === '' ? undefined : parts[5];

        // Ensure we have minimal valid data
        if (parts[0] && price > 0) {
            flights.push({
            id: Math.random().toString(36).substr(2, 9),
            destination: parts[0] || 'Desconocido',
            airline: parts[1] || 'Aerolínea',
            price: price,
            currency: 'USD', // Force USD as per prompt requirement
            date: parts[4] || 'Fecha por confirmar',
            returnDate: returnDateVal,
            duration: parts[6] || 'N/A',
            stops: parts[7] || 'N/A',
            link: parts[8] || '#',
            origin: '', 
            });
        }
      }
    } else if (trimmed.includes('RANKING_DATA:')) {
      const contentAfterTag = trimmed.split('RANKING_DATA:')[1];
      if (!contentAfterTag) return;

      const parts = contentAfterTag.split('|').map(p => p.trim());
      if (parts.length >= 3) {
        const price = parsePrice(parts[2]);
        const typeStr = parts[0].toUpperCase();
        
        if ((typeStr === 'DATE' || typeStr === 'AIRLINE') && price > 0) {
          rankings.push({
            type: typeStr,
            label: parts[1],
            price: price,
            currency: 'USD'
          });
        }
      }
    } else if (trimmed.includes('CHART_DATA:')) {
      const contentAfterTag = trimmed.split('CHART_DATA:')[1];
      if (!contentAfterTag) return;

      const parts = contentAfterTag.split('|').map(p => p.trim());
      // Expecting: Label | Value
      if (parts.length >= 2) {
         const price = parsePrice(parts[1]);
         if (price > 0) {
            chartData.push({
            label: parts[0],
            value: price
            });
         }
      }
    }
  });

  return { flights, rankings, chartData };
};