import { TestBed } from '@angular/core/testing';
import { describe, it, beforeEach } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { of } from 'rxjs';
import '../../../../../testing/vitest-axe-setup';
import { runAxe, assertNoSeriousViolations } from '../../../../../testing/run-axe';
import { AlertBuilder } from './alert-builder';
import { AlertValidatorService } from '../../services/alert-validator.service';
import { AlertEngineService } from '../../services/alert-engine.service';
import { PriceFeedService } from '../../../price-feed/services/price-feed.service';
import type { PriceMap } from '../../../price-feed/models/price.model';

describe('AlertBuilder — accessibility', () => {
  beforeEach(async () => {
    const emptyPrices = signal<PriceMap>({});

    await TestBed.configureTestingModule({
      imports: [AlertBuilder],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: PriceFeedService,
          useValue: {
            prices: emptyPrices,
            seedHistory: () => undefined,
          },
        },
        {
          provide: AlertValidatorService,
          useValue: {
            validateSymbol: () => of({ valid: false, message: 'Invalid symbol' }),
          },
        },
        {
          provide: AlertEngineService,
          useValue: {
            evaluateNewAlert: () => undefined,
          },
        },
      ],
    }).compileComponents();
  });

  it('has no serious or critical axe violations', async () => {
    const fixture = TestBed.createComponent(AlertBuilder);
    fixture.detectChanges();
    const results = await runAxe(fixture.nativeElement);
    assertNoSeriousViolations(results);
  });
});
