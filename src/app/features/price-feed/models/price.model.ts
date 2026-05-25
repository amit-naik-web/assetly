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
    color: string;
    textColor: string;
  }
  
  export const TRACKED_SYMBOLS = [
    'AAPL', 'MSFT', 'NVDA', 'TSLA',
    'GOOGL', 'META', 'AMZN', 'JPM',
  ];
  
  export const SECTOR_DATA: SectorData[] = [
    { name: 'Technology', changePct: 1.42,  color: '#E1F5EE', textColor: '#085041' },
    { name: 'Healthcare', changePct: 0.87,  color: '#E1F5EE', textColor: '#085041' },
    { name: 'Financials', changePct: 0.31,  color: '#FEF3DC', textColor: '#633806' },
    { name: 'Energy',     changePct: -0.54, color: '#FCEBEB', textColor: '#791F1F' },
    { name: 'Utilities',  changePct: 0.19,  color: '#E1F5EE', textColor: '#085041' },
    { name: 'Materials',  changePct: -0.22, color: '#FCEBEB', textColor: '#791F1F' },
    { name: 'Real Estate',changePct: 0.08,  color: '#FEF3DC', textColor: '#633806' },
    { name: 'Consumer',   changePct: 0.63,  color: '#E1F5EE', textColor: '#085041' },
  ];