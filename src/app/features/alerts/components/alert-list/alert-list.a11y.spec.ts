import { TestBed } from '@angular/core/testing';
import { describe, it, beforeEach } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import '../../../../../testing/vitest-axe-setup';
import { runAxe, assertNoSeriousViolations } from '../../../../../testing/run-axe';
import { AlertList } from './alert-list';
import { AlertsStore } from '../../store/alerts.store';
import { AlertToastService } from '../../../../core/services/alert-toast.service';
import { NotificationService } from '../../../../core/services/notification.service';
import type { Alert } from '../../models/alert.model';

const SEED_ALERTS: Alert[] = [
  {
    id: 'TSLA-triggered-demo',
    symbol: 'TSLA',
    condition: 'PRICE_ABOVE',
    targetValue: 245.0,
    notifyVia: 'BOTH',
    status: 'TRIGGERED',
    currentPrice: 247.61,
    progressPct: 100,
    createdAt: new Date(Date.now() - 3_600_000),
    triggeredAt: new Date(Date.now() - 1_800_000),
  },
  {
    id: 'AAPL-watch-live',
    symbol: 'AAPL',
    condition: 'PRICE_ABOVE',
    targetValue: 214.0,
    notifyVia: 'TOAST',
    status: 'WATCHING',
    currentPrice: 213.48,
    progressPct: 99,
    createdAt: new Date(),
  },
  {
    id: 'NVDA-watch-live',
    symbol: 'NVDA',
    condition: 'PRICE_BELOW',
    targetValue: 136.0,
    notifyVia: 'TOAST',
    status: 'WATCHING',
    currentPrice: 134.72,
    progressPct: 99,
    createdAt: new Date(),
  },
];

describe('AlertList — accessibility', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertList],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: AlertToastService,
          useValue: { show: () => undefined },
        },
        {
          provide: NotificationService,
          useValue: { push: () => undefined },
        },
      ],
    }).compileComponents();

    TestBed.inject(AlertsStore).loadAlerts(SEED_ALERTS);
  });

  it('has no serious or critical axe violations', async () => {
    const fixture = TestBed.createComponent(AlertList);
    fixture.detectChanges();
    const results = await runAxe(fixture.nativeElement);
    assertNoSeriousViolations(results);
  });
});
