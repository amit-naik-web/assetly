export interface Position {
  id: string;
  symbol: string;
  companyName: string;
  sector: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  dayChange: number;
  dayChangePct: number;
}

export interface KpiData {
  id: string;
  label: string;
  value: number;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
  valueFormat?: 'currency' | 'signed-currency' | 'count';
  variant?: 'default' | 'chart';
}

export interface AllocationSlice {
  label: string;
  pct: number;
  color: string;
}
