import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
} from '@angular/core';
import { AlertsStore } from './store/alerts.store';
import { AlertBuilder } from './components/alert-builder/alert-builder';
import { AlertList } from './components/alert-list/alert-list';
import { Alert } from './models/alert.model';

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
    this.store.loadAlerts([
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
    ]);
  }

  onAlertCreated(alert: Alert) {
    void alert;
  }
}