import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
} from '@angular/core';
import { AlertsStore } from './store/alerts.store';
import { AlertBuilder } from './components/alert-builder/alert-builder';
import { AlertList } from './components/alert-list/alert-list';
import {
  Alert,
} from './models/alert.model';

@Component({
  selector: 'app-alerts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AlertBuilder, AlertList],
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss',
})
export class Alerts implements OnInit {
  readonly store = inject(AlertsStore);

  ngOnInit() {
    // Seed with mock alerts
    this.store.loadAlerts([
      {
        id: 'AAPL-1',
        symbol: 'AAPL',
        condition: 'PRICE_ABOVE',
        targetValue: 210.00,
        notifyVia: 'TOAST',
        status: 'TRIGGERED',
        currentPrice: 213.48,
        progressPct: 100,
        createdAt: new Date(),
        triggeredAt: new Date(),
      },
      {
        id: 'TSLA-1',
        symbol: 'TSLA',
        condition: 'PCT_CHANGE_DOWN',
        targetValue: 2,
        notifyVia: 'BOTH',
        status: 'TRIGGERED',
        currentPrice: 247.61,
        progressPct: 100,
        createdAt: new Date(),
        triggeredAt: new Date(),
      },
      {
        id: 'NVDA-1',
        symbol: 'NVDA',
        condition: 'PRICE_BELOW',
        targetValue: 120.00,
        notifyVia: 'TOAST',
        status: 'WATCHING',
        currentPrice: 134.72,
        progressPct: 89,
        createdAt: new Date(),
      },
      {
        id: 'AAPL-2',
        symbol: 'AAPL',
        condition: 'PRICE_ABOVE',
        targetValue: 220.00,
        notifyVia: 'TOAST',
        status: 'WATCHING',
        currentPrice: 213.48,
        progressPct: 55,
        createdAt: new Date(),
      },
    ]);
  }

  onAlertCreated(alert: Alert) {
    void alert;
  }
}