export interface HoldingRow {
    id: string;
    symbol: string;
    companyName: string;
    sector: string;
    shares: number;
    avgCost: number;
    currentPrice: number;
    dayChange: number;
    dayChangePct: number;
    totalValue: number;
    totalGain: number;
    totalGainPct: number;
  }
  
  export type SortColumn =
    | 'symbol' | 'companyName' | 'sector'
    | 'shares' | 'avgCost' | 'currentPrice'
    | 'dayChangePct' | 'totalValue' | 'totalGain';
  
  export type SortDir = 'asc' | 'desc' | 'none';