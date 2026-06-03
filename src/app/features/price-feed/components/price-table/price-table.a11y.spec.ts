import { TestBed } from '@angular/core/testing';
import { describe, it, beforeEach } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import '../../../../../testing/vitest-axe-setup';
import { runAxe, assertNoSeriousViolations } from '../../../../../testing/run-axe';
import { PriceTable } from './price-table';
import { PriceFeedService } from '../../services/price-feed.service';
import { HoldingsService } from '../../../holdings/services/holdings.service';
import {
  MOCK_PRICES,
  SYMBOL_COMPANY_NAMES,
} from '../../../alerts/models/alert.model';
import {
  TRACKED_SYMBOLS,
  type PriceMap,
  type PriceTick,
} from '../../models/price.model';

function buildPriceMap(): PriceMap {
  return TRACKED_SYMBOLS.reduce<PriceMap>((acc, symbol) => {
    const price = MOCK_PRICES[symbol] ?? 100;
    acc[symbol] = {
      symbol,
      price,
      change: price * 0.01,
      changePct: 1.0,
      volume: 1_000_000,
      timestamp: Date.now(),
    };
    return acc;
  }, {});
}

describe('PriceTable — accessibility', () => {
  beforeEach(async () => {
    const prices = signal<PriceMap>(buildPriceMap());
    const latestTick$ = new BehaviorSubject<PriceTick | null>(prices()['AAPL'] ?? null);

    await TestBed.configureTestingModule({
      imports: [PriceTable],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: PriceFeedService,
          useValue: {
            prices,
            latestTick$,
            getCompanyName: (symbol: string) =>
              SYMBOL_COMPANY_NAMES[symbol] ?? symbol,
          },
        },
        {
          provide: HoldingsService,
          useValue: {
            getHoldings: () => of([]),
          },
        },
      ],
    }).compileComponents();
  });

  it('has no serious or critical axe violations', async () => {
    const fixture = TestBed.createComponent(PriceTable);
    fixture.detectChanges();
    const results = await runAxe(fixture.nativeElement);
    assertNoSeriousViolations(results);
  });
});
