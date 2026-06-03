export interface PriceTick {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  timestamp: number;
}

export type PriceMap = Record<string, PriceTick>;

/** Rolling window point for sparklines (last 60 ticks per symbol). */
export interface PriceHistoryPoint {
  price: number;
  timestamp: number;
}

export type PriceHistoryMap = Record<string, PriceHistoryPoint[]>;

export const PRICE_HISTORY_MAX = 120;

export type SparklineRange = '1m' | '1h' | '1d' | '1w';

export interface SparklineRangeOption {
  id: SparklineRange;
  label: string;
  ms: number;
}

export const SPARKLINE_RANGE_OPTIONS: SparklineRangeOption[] = [
  { id: '1m', label: '1m', ms: 60_000 },
  { id: '1h', label: '1h', ms: 3_600_000 },
  { id: '1d', label: '1d', ms: 86_400_000 },
  { id: '1w', label: '1w', ms: 604_800_000 },
];

export const SPARKLINE_POINT_COUNT = 80;

export interface SectorData {
  name: string;
  changePct: number;
}

export const TRACKED_SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'META', 'AMZN', 'JPM',
  'BRK.B', 'JNJ', 'V', 'PG', 'XOM', 'UNH', 'MA',
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
