export interface Flight {
  id: string;
  airline: string;
  price: number;
  currency: string;
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  duration: string;
  link: string;
  stops: string;
}

export interface RankingItem {
  type: 'DATE' | 'AIRLINE';
  label: string;
  price: number;
  currency: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface SearchParams {
  origin: string;
  destination?: string;
  date?: string;
  returnDate?: string;
  maxPrice?: number;
}

export interface SavedSearch {
  id: string;
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  timestamp: number;
}

export enum SortOption {
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  DURATION = 'DURATION',
}