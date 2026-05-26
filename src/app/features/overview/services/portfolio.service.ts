import { Injectable } from '@angular/core';
import { of, delay } from 'rxjs';
import { Position } from '../models/portfolio.model';

const MOCK_POSITIONS: Position[] = [
  // ── Technology ──────────────────────────────────
  { id: 'AAPL',  symbol: 'AAPL',  companyName: 'Apple Inc.',         sector: 'Technology', shares: 142, avgCost: 178.20, currentPrice: 213.48, dayChange: 4.48,   dayChangePct: 2.14  },
  { id: 'MSFT',  symbol: 'MSFT',  companyName: 'Microsoft Corp.',    sector: 'Technology', shares: 87,  avgCost: 310.50, currentPrice: 421.05, dayChange: 4.49,   dayChangePct: 1.08  },
  { id: 'NVDA',  symbol: 'NVDA',  companyName: 'NVIDIA Corp.',       sector: 'Technology', shares: 210, avgCost: 88.40,  currentPrice: 134.72, dayChange: -1.13,  dayChangePct: -0.83 },
  { id: 'GOOGL', symbol: 'GOOGL', companyName: 'Alphabet Inc.',      sector: 'Technology', shares: 55,  avgCost: 142.10, currentPrice: 178.30, dayChange: 1.01,   dayChangePct: 0.57  },
  { id: 'META',  symbol: 'META',  companyName: 'Meta Platforms',     sector: 'Technology', shares: 30,  avgCost: 310.00, currentPrice: 583.20, dayChange: 8.48,   dayChangePct: 1.47  },
  { id: 'AMZN',  symbol: 'AMZN',  companyName: 'Amazon.com Inc.',    sector: 'Technology', shares: 45,  avgCost: 145.00, currentPrice: 224.71, dayChange: 2.07,   dayChangePct: 0.93  },
  { id: 'ADBE',  symbol: 'ADBE',  companyName: 'Adobe Inc.',         sector: 'Technology', shares: 18,  avgCost: 420.00, currentPrice: 372.50, dayChange: -3.10,  dayChangePct: -0.82 },
  { id: 'CRM',   symbol: 'CRM',   companyName: 'Salesforce Inc.',    sector: 'Technology', shares: 25,  avgCost: 195.00, currentPrice: 248.90, dayChange: 1.52,   dayChangePct: 0.61  },

  // ── Financials ───────────────────────────────────
  { id: 'JPM',   symbol: 'JPM',   companyName: 'JPMorgan Chase',     sector: 'Financials', shares: 65,  avgCost: 198.30, currentPrice: 282.54, dayChange: 1.07,   dayChangePct: 0.38  },
  { id: 'MA',    symbol: 'MA',    companyName: 'Mastercard Inc.',    sector: 'Financials', shares: 35,  avgCost: 380.00, currentPrice: 480.22, dayChange: 1.92,   dayChangePct: 0.40  },
  { id: 'BRK',   symbol: 'BRK.B', companyName: 'Berkshire B',       sector: 'Financials', shares: 80,  avgCost: 320.00, currentPrice: 541.88, dayChange: -1.19,  dayChangePct: -0.22 },
  { id: 'GS',    symbol: 'GS',    companyName: 'Goldman Sachs',      sector: 'Financials', shares: 12,  avgCost: 340.00, currentPrice: 512.60, dayChange: -2.05,  dayChangePct: -0.40 },

  // ── Healthcare ───────────────────────────────────
  { id: 'JNJ',   symbol: 'JNJ',   companyName: 'Johnson & Johnson',  sector: 'Healthcare', shares: 50,  avgCost: 155.00, currentPrice: 148.90, dayChange: 0.88,   dayChangePct: 0.59  },
  { id: 'UNH',   symbol: 'UNH',   companyName: 'UnitedHealth Group', sector: 'Healthcare', shares: 20,  avgCost: 480.00, currentPrice: 522.30, dayChange: 3.12,   dayChangePct: 0.60  },

  // ── Consumer ─────────────────────────────────────
  { id: 'PG',    symbol: 'PG',    companyName: 'Procter & Gamble',   sector: 'Consumer',   shares: 70,  avgCost: 145.00, currentPrice: 162.30, dayChange: 0.65,   dayChangePct: 0.40  },
  { id: 'KO',    symbol: 'KO',    companyName: 'Coca-Cola Co.',      sector: 'Consumer',   shares: 100, avgCost: 56.00,  currentPrice: 68.40,  dayChange: -0.40,  dayChangePct: -0.58 },
  { id: 'WMT',   symbol: 'WMT',   companyName: 'Walmart Inc.',       sector: 'Consumer',   shares: 35,  avgCost: 148.00, currentPrice: 222.10, dayChange: -0.96,  dayChangePct: -0.43 },

  // ── Energy ───────────────────────────────────────
  { id: 'XOM',   symbol: 'XOM',   companyName: 'Exxon Mobil',        sector: 'Energy',     shares: 90,  avgCost: 90.00,  currentPrice: 118.45, dayChange: -0.93,  dayChangePct: -0.78 },

  // ── Industrials ──────────────────────────────────
  { id: 'CAT',   symbol: 'CAT',   companyName: 'Caterpillar Inc.',   sector: 'Industrials',shares: 20,  avgCost: 240.00, currentPrice: 318.90, dayChange: -4.37,  dayChangePct: -1.35 },
];

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  getPositions() {
    return of(MOCK_POSITIONS).pipe(delay(300));
  }
}