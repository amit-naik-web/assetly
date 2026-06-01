export type AlertCondition = 'PRICE_ABOVE' | 'PRICE_BELOW';

export type AlertStatus = 'WATCHING' | 'TRIGGERED';
export type NotifyMethod = 'TOAST' | 'EMAIL' | 'BOTH';

export interface Alert {
  id: string;
  symbol: string;
  condition: AlertCondition;
  targetValue: number;
  notifyVia: NotifyMethod;
  status: AlertStatus;
  currentPrice: number;
  progressPct: number;
  createdAt: Date;
  triggeredAt?: Date;
}

export interface WatchlistItem {
  symbol: string;
  companyName: string;
  price: number;
  changePct: number;
}

export const CONDITION_LABELS: Record<AlertCondition, string> = {
  PRICE_ABOVE: 'Price above',
  PRICE_BELOW: 'Price below',
};

export const VALID_SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL',
  'META', 'AMZN', 'JPM', 'BRK.B', 'JNJ',
  'V', 'PG', 'XOM', 'UNH', 'MA',
];

export const MOCK_PRICES: Record<string, number> = {
  AAPL: 213.48, MSFT: 421.05, NVDA: 134.72, TSLA: 247.61,
  GOOGL: 178.30, META: 583.20, AMZN: 224.71, JPM: 282.54,
  'BRK.B': 541.88, JNJ: 148.90, V: 310.45, PG: 162.30,
  XOM: 118.45, UNH: 522.30, MA: 480.22,
};

export const SYMBOL_COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  MSFT: 'Microsoft Corp.',
  NVDA: 'NVIDIA Corp.',
  TSLA: 'Tesla Inc.',
  GOOGL: 'Alphabet Inc.',
  META: 'Meta Platforms',
  AMZN: 'Amazon.com Inc.',
  JPM: 'JPMorgan Chase',
  'BRK.B': 'Berkshire Hathaway',
  JNJ: 'Johnson & Johnson',
  V: 'Visa Inc.',
  PG: 'Procter & Gamble',
  XOM: 'Exxon Mobil',
  UNH: 'UnitedHealth Group',
  MA: 'Mastercard Inc.',
};

export const SYMBOL_SECTORS: Record<string, string> = {
  AAPL: 'Technology',
  MSFT: 'Technology',
  NVDA: 'Technology',
  TSLA: 'Automotive',
  GOOGL: 'Technology',
  META: 'Technology',
  AMZN: 'Technology',
  JPM: 'Financials',
  'BRK.B': 'Financials',
  JNJ: 'Healthcare',
  V: 'Financials',
  PG: 'Consumer',
  XOM: 'Energy',
  UNH: 'Healthcare',
  MA: 'Financials',
};