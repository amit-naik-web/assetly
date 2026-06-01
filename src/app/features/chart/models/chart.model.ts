export interface OhlcvCandle {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface Indicator {
    label: string;
    value: number | null;
    signal: 'buy' | 'sell' | 'neutral';
    formatted: string;
}

/** `1m` / `1h` = live tick windows; `1M` = one month. */
export type TimeRange = '1m' | '1h' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'All';
export type ChartViewMode = 'candlestick' | 'line';

export const TIME_RANGES: TimeRange[] = [
  '1m',
  '1h',
  '1W',
  '1M',
  '3M',
  '6M',
  '1Y',
  'All',
];

/** Accessible labels for range pills (`1M` = month, `1m` = minute). */
export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '1m': '1m',
  '1h': '1h',
  '1W': '1W',
  '1M': '1M',
  '3M': '3M',
  '6M': '6M',
  '1Y': '1Y',
  All: 'All',
};

export const BASE_PRICES: Record<string, number> = {
    AAPL: 213.48,
    MSFT: 421.05,
    NVDA: 134.72,
    TSLA: 247.61,
    GOOGL: 178.30,
    META: 583.20,
    JPM: 282.54,
    AMZN: 224.71,
    'BRK.B': 541.88,
    JNJ: 148.90,
    V: 310.45,
    PG: 162.30,
    XOM: 118.45,
    UNH: 522.30,
    MA: 480.22,
};