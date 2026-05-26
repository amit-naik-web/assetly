export interface TreemapNode {
    id: string;
    symbol: string;
    companyName: string;
    sector: string;
    totalValue: number;
    dayChangePct: number;
    currentPrice: number;
  }
  
  export interface TreemapLeaf {
    id: string;
    symbol: string;
    companyName: string;
    sector: string;
    totalValue: number;
    dayChangePct: number;
    currentPrice: number;
    // D3 computed layout
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    width: number;
    height: number;
    color: string;
    textColor: string;
    portfolioPct: number;
    fontSize: number;
    fontWeight: number;
    pctFontSize: number;
    pctFontWeight: number;
    labelLayout: 'stacked' | 'compact' | 'symbol-only' | 'none';
    pctLabel: string;
  }
  
  export interface TreemapSector {
    name: string;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    headerHeight: number;
    contentY0: number;
  }