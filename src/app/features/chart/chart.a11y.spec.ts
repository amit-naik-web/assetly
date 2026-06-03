import { TestBed } from '@angular/core/testing';
import { describe, it, beforeEach } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import '../../../testing/vitest-axe-setup';
import { runAxe, assertNoSeriousViolations } from '../../../testing/run-axe';
import { Chart } from './chart';
import { ChartService } from './services/chart.service';
import { HoldingsService } from '../holdings/services/holdings.service';
import { PriceFeedService } from '../price-feed/services/price-feed.service';
import type { OhlcvCandle } from './models/chart.model';
import type { HoldingRow } from '../holdings/models/holdings.model';
import type { PriceMap } from '../price-feed/models/price.model';

function buildMockCandles(): OhlcvCandle[] {
  const candles: OhlcvCandle[] = [];
  let price = 210;

  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }

    const open = price;
    const close = parseFloat((price + 0.5).toFixed(2));
    candles.push({
      date,
      open,
      high: parseFloat((close + 1).toFixed(2)),
      low: parseFloat((open - 1).toFixed(2)),
      close,
      volume: 12_000_000,
    });
    price = close;
  }

  return candles;
}

const MOCK_CANDLES = buildMockCandles();

const MOCK_HOLDING: HoldingRow = {
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
};

describe('Chart — accessibility', () => {
  beforeEach(async () => {
    const prices = signal<PriceMap>({
      AAPL: {
        symbol: 'AAPL',
        price: 213.48,
        change: 4.48,
        changePct: 2.14,
        volume: 1_000_000,
        timestamp: Date.now(),
      },
    });

    await TestBed.configureTestingModule({
      imports: [Chart],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ symbol: 'AAPL' })),
            queryParamMap: of(convertToParamMap({})),
            data: of({ ohlcv: MOCK_CANDLES }),
          },
        },
        {
          provide: ChartService,
          useValue: {
            getCandles: () => of(MOCK_CANDLES),
          },
        },
        {
          provide: HoldingsService,
          useValue: {
            getHoldings: () => of([MOCK_HOLDING]),
          },
        },
        {
          provide: PriceFeedService,
          useValue: {
            prices,
            refreshInFlight: signal<string | null>(null),
            priceHistory: signal({}),
            seedHistory: () => undefined,
            refreshSymbol: () => undefined,
            historyForRange: () => [],
          },
        },
      ],
    }).compileComponents();
  });

  it('has no serious or critical axe violations', async () => {
    const fixture = TestBed.createComponent(Chart);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const results = await runAxe(fixture.nativeElement);
    assertNoSeriousViolations(results);
  });
});
