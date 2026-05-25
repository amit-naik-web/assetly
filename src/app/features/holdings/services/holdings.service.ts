import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { HoldingRow } from '../models/holdings.model';

const MOCK_DATA: Omit<HoldingRow, 'totalValue' | 'totalGain' | 'totalGainPct'>[] = [
  { id: 'AAPL',  symbol: 'AAPL',  companyName: 'Apple Inc.',        sector: 'Technology', shares: 142,  avgCost: 178.20, currentPrice: 213.48, dayChange: 4.48,   dayChangePct: 2.14  },
  { id: 'MSFT',  symbol: 'MSFT',  companyName: 'Microsoft Corp.',   sector: 'Technology', shares: 87,   avgCost: 310.50, currentPrice: 421.05, dayChange: 4.49,   dayChangePct: 1.08  },
  { id: 'NVDA',  symbol: 'NVDA',  companyName: 'NVIDIA Corp.',      sector: 'Technology', shares: 210,  avgCost: 88.40,  currentPrice: 134.72, dayChange: -1.13,  dayChangePct: -0.83 },
  { id: 'TSLA',  symbol: 'TSLA',  companyName: 'Tesla Inc.',        sector: 'Automotive', shares: 120,  avgCost: 221.40, currentPrice: 247.61, dayChange: -5.86,  dayChangePct: -2.31 },
  { id: 'GOOGL', symbol: 'GOOGL', companyName: 'Alphabet Inc.',     sector: 'Technology', shares: 55,   avgCost: 142.10, currentPrice: 178.30, dayChange: 1.01,   dayChangePct: 0.57  },
  { id: 'META',  symbol: 'META',  companyName: 'Meta Platforms',    sector: 'Technology', shares: 30,   avgCost: 310.00, currentPrice: 583.20, dayChange: 8.48,   dayChangePct: 1.47  },
  { id: 'JPM',   symbol: 'JPM',   companyName: 'JPMorgan Chase',    sector: 'Financials', shares: 65,   avgCost: 198.30, currentPrice: 282.54, dayChange: 1.07,   dayChangePct: 0.38  },
  { id: 'AMZN',  symbol: 'AMZN',  companyName: 'Amazon.com Inc.',   sector: 'Technology', shares: 45,   avgCost: 145.00, currentPrice: 224.71, dayChange: 2.07,   dayChangePct: 0.93  },
  { id: 'BRK',   symbol: 'BRK.B', companyName: 'Berkshire Hathaway',sector: 'Financials', shares: 80,   avgCost: 320.00, currentPrice: 541.88, dayChange: -1.19,  dayChangePct: -0.22 },
  { id: 'JNJ',   symbol: 'JNJ',   companyName: 'Johnson & Johnson', sector: 'Healthcare', shares: 50,   avgCost: 155.00, currentPrice: 148.90, dayChange: 0.88,   dayChangePct: 0.59  },
  { id: 'V',     symbol: 'V',     companyName: 'Visa Inc.',         sector: 'Financials', shares: 60,   avgCost: 220.00, currentPrice: 310.45, dayChange: 1.24,   dayChangePct: 0.40  },
  { id: 'PG',    symbol: 'PG',    companyName: 'Procter & Gamble',  sector: 'Consumer',   shares: 70,   avgCost: 145.00, currentPrice: 162.30, dayChange: 0.65,   dayChangePct: 0.40  },
  { id: 'XOM',   symbol: 'XOM',   companyName: 'Exxon Mobil',       sector: 'Energy',     shares: 90,   avgCost: 90.00,  currentPrice: 118.45, dayChange: -0.93,  dayChangePct: -0.78 },
  { id: 'UNH',   symbol: 'UNH',   companyName: 'UnitedHealth Group',sector: 'Healthcare', shares: 20,   avgCost: 480.00, currentPrice: 522.30, dayChange: 3.12,   dayChangePct: 0.60  },
  { id: 'MA',    symbol: 'MA',    companyName: 'Mastercard Inc.',   sector: 'Financials', shares: 35,   avgCost: 380.00, currentPrice: 480.22, dayChange: 1.92,   dayChangePct: 0.40  },
];

@Injectable({ providedIn: 'root' })
export class HoldingsService {
  getHoldings(): Observable<HoldingRow[]> {
    const rows = MOCK_DATA.map(h => ({
      ...h,
      totalValue:   h.shares * h.currentPrice,
      totalGain:    h.shares * (h.currentPrice - h.avgCost),
      totalGainPct: ((h.currentPrice - h.avgCost) / h.avgCost) * 100,
    }));
    return of(rows).pipe(delay(300));
  }
}