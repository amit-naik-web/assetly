import { TestBed } from '@angular/core/testing';
import { describe, it, beforeEach } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import '../../../../../testing/vitest-axe-setup';
import { runAxe, assertNoSeriousViolations } from '../../../../../testing/run-axe';
import { HoldingsTable } from './holdings-table';
import type { HoldingRow } from '../../models/holdings.model';

const MOCK_ROWS: HoldingRow[] = [
  {
    id: 'AAPL',
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    sector: 'Technology',
    shares: 142,
    avgCost: 178.2,
    currentPrice: 213.48,
    dayChange: 4.48,
    dayChangePct: 2.14,
    totalValue: 142 * 213.48,
    totalGain: 142 * (213.48 - 178.2),
    totalGainPct: ((213.48 - 178.2) / 178.2) * 100,
  },
  {
    id: 'TSLA',
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    sector: 'Automotive',
    shares: 120,
    avgCost: 221.4,
    currentPrice: 247.61,
    dayChange: -5.86,
    dayChangePct: -2.31,
    totalValue: 120 * 247.61,
    totalGain: 120 * (247.61 - 221.4),
    totalGainPct: ((247.61 - 221.4) / 221.4) * 100,
  },
  {
    id: 'NVDA',
    symbol: 'NVDA',
    companyName: 'NVIDIA Corp.',
    sector: 'Technology',
    shares: 210,
    avgCost: 88.4,
    currentPrice: 134.72,
    dayChange: 0,
    dayChangePct: 0,
    totalValue: 210 * 134.72,
    totalGain: 210 * (134.72 - 88.4),
    totalGainPct: ((134.72 - 88.4) / 88.4) * 100,
  },
];

describe('HoldingsTable — accessibility', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoldingsTable],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  it('has no serious or critical axe violations', async () => {
    const fixture = TestBed.createComponent(HoldingsTable);
    fixture.componentRef.setInput('rows', MOCK_ROWS);
    fixture.detectChanges();
    const results = await runAxe(fixture.nativeElement);
    assertNoSeriousViolations(results);
  });
});
