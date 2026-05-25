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
    sparkPoints: number[];
  }
  
  export interface AllocationSlice {
    label: string;
    pct: number;
    color: string;
  }