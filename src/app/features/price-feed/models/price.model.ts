export interface PriceTick {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  timestamp: number;
}

export interface PriceMap {
  [symbol: string]: PriceTick;
}

export interface SectorData {
  name: string;
  changePct: number;
}

export const TRACKED_SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'TSLA',
  'GOOGL', 'META', 'AMZN', 'JPM',
];

export const SECTOR_DATA: SectorData[] = [
  { name: 'Technology', changePct: 1.42 },
  { name: 'Healthcare', changePct: 0.87 },
  { name: 'Financials', changePct: 0.31 },
  { name: 'Energy', changePct: -0.54 },
  { name: 'Utilities', changePct: 0.19 },
  { name: 'Materials', changePct: -0.22 },
  { name: 'Real Estate', changePct: 0.08 },
  { name: 'Consumer', changePct: 0.63 },
];
