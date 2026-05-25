import { Injectable } from '@angular/core';
import { of, delay } from 'rxjs';
import { Position } from '../models/portfolio.model';

const MOCK_POSITIONS: Position[] = [
  {
    id: 'AAPL', symbol: 'AAPL', companyName: 'Apple Inc.',
    sector: 'Technology', shares: 142, avgCost: 178.20,
    currentPrice: 213.48, dayChange: 4.48, dayChangePct: 2.14,
  },
  {
    id: 'MSFT', symbol: 'MSFT', companyName: 'Microsoft Corp.',
    sector: 'Technology', shares: 87, avgCost: 310.50,
    currentPrice: 421.05, dayChange: 4.49, dayChangePct: 1.08,
  },
  {
    id: 'NVDA', symbol: 'NVDA', companyName: 'NVIDIA Corp.',
    sector: 'Technology', shares: 210, avgCost: 88.40,
    currentPrice: 134.72, dayChange: -1.13, dayChangePct: -0.83,
  },
  {
    id: 'TSLA', symbol: 'TSLA', companyName: 'Tesla Inc.',
    sector: 'Automotive', shares: 120, avgCost: 221.40,
    currentPrice: 247.61, dayChange: -5.86, dayChangePct: -2.31,
  },
  {
    id: 'GOOGL', symbol: 'GOOGL', companyName: 'Alphabet Inc.',
    sector: 'Technology', shares: 55, avgCost: 142.10,
    currentPrice: 178.30, dayChange: 1.01, dayChangePct: 0.57,
  },
  {
    id: 'JPM', symbol: 'JPM', companyName: 'JPMorgan Chase',
    sector: 'Financials', shares: 65, avgCost: 198.30,
    currentPrice: 282.54, dayChange: 1.07, dayChangePct: 0.38,
  },
];

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  getPositions() {
    return of(MOCK_POSITIONS).pipe(delay(300));
  }
}