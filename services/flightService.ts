import { GoogleGenAI } from "@google/genai";
import { SearchParams, Flight, RankingItem, ChartDataPoint } from "../types";
import { parseFlightResponse } from "../utils/parser";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchFlightsWithGemini = async (params: SearchParams): Promise<{ flights: Flight[], rankings: RankingItem[], chartData: ChartDataPoint[], rawText: string }> => {
  const model = "gemini-2.5-flash";
  
  let searchIntent = `Busca vuelos económicos desde ${params.origin}`;
  
  if (params.destination) {
    searchIntent += ` hacia ${params.destination}`;
  } else {
    searchIntent += ` hacia destinos turísticos populares y económicos (revisa ofertas de TurismoCity, Skyscanner, Google Flights)`;
  }

  // Interpretación de fechas
  if (params.date) {
    if (params.returnDate) {
      searchIntent += `. FECHAS: Busca salidas ENTRE el ${params.date} y el ${params.returnDate}.`;
    } else {
      searchIntent += `. FECHAS: A partir del ${params.date}.`;
    }
  } else {
    searchIntent += ` en los próximos 3 meses.`;
  }

  // Integración del Presupuesto en la búsqueda
  if (params.maxPrice && params.maxPrice > 0) {
    searchIntent += `. IMPORTANTE: El presupuesto MÁXIMO por persona es de ${params.maxPrice} USD. No muestres opciones que superen drásticamente este monto.`;
  }

  const prompt = `
    Actúa como un agente de viajes experto y buscador de vuelos. Tu objetivo es encontrar las mejores opciones usando Google Search para obtener precios reales de sitios como TurismoCity y otros agregadores.
    
    INTENCIÓN DE BÚSQUEDA: ${searchIntent}.
    
    INSTRUCCIONES CRÍTICAS DE FORMATO:
    1. Debes generar una respuesta con 3 secciones claramente separadas.
    2. La sección de datos de vuelos DEBE seguir estrictamente el formato separado por barras (|) con la etiqueta "FLIGHT_DATA:" al inicio de cada línea.
    3. Si no encuentras vuelos exactos para una fecha específica, busca fechas cercanas o estima precios basados en tarifas actuales, pero SIEMPRE genera líneas de datos.
    4. Todos los precios en USD (Dólares). Si encuentras en otra moneda, convierte.

    OUTPUT NECESARIO (Sigue este ejemplo exactamente):

    Resumen:
    (Escribe aquí un resumen amigable de 2-3 líneas sobre lo que encontraste).

    Vuelos Encontrados:
    FLIGHT_DATA: Miami | American Airlines | 450 | USD | 2024-11-10 | 2024-11-20 | 8h 30m | Directo | https://www.turismocity.com.ar
    FLIGHT_DATA: Madrid | Iberia | 890 | USD | 2024-12-05 | 2024-12-20 | 12h | 1 Escala | https://www.google.com/flights
    (Genera al menos 5 líneas así. El link puede ser genérico a la búsqueda si no tienes uno específico).

    Rankings:
    RANKING_DATA: AIRLINE | Latam | 400 | USD
    RANKING_DATA: DATE | Noviembre | 380 | USD

    Gráfico:
    CHART_DATA: Ene 15 | 400
    CHART_DATA: Ene 16 | 350
    CHART_DATA: Ene 17 | 500
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    // Parse response
    const { flights, rankings, chartData } = parseFlightResponse(text);
    
    const enrichedFlights = flights.map(f => ({
      ...f,
      origin: params.origin,
      destination: f.destination !== 'Desconocido' ? f.destination : (params.destination || 'Destino Variado')
    }));

    return { flights: enrichedFlights, rankings, chartData, rawText: text };

  } catch (error) {
    console.error("Error searching flights:", error);
    throw error;
  }
};