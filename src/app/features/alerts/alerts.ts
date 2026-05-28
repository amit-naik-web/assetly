import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  computed,
} from '@angular/core';
import { AlertsStore } from './store/alerts.store';
import { AlertBuilder } from './components/alert-builder/alert-builder';
import { AlertList } from './components/alert-list/alert-list';
import { Watchlist } from './components/watchlist/watchlist';
import {
  Alert,
} from './models/alert.model';

@Component({
  selector: 'app-alerts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AlertBuilder, AlertList, Watchlist],
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss',
})
export class Alerts implements OnInit {
  readonly store = inject(AlertsStore);

  readonly kpis = computed(() => {
    type KpiTrend = 'up' | 'down' | 'neutral';
    const entities = this.store.entities();
    const watching = this.store.watching().length;
    const triggered = this.store.triggeredCount();
    const emailEnabled = entities.filter(a => a.notifyVia === 'EMAIL' || a.notifyVia === 'BOTH').length;
    const avgProgress = watching > 0
      ? Math.round(
        this.store.watching().reduce((sum, alert) => sum + alert.progressPct, 0) / watching,
      )
      : 0;

    return [
      { id: 'active-alerts', label: 'Active alerts', value: String(entities.length), sub: `${watching} watching`, trend: 'neutral' as KpiTrend },
      { id: 'triggered-today', label: 'Triggered', value: String(triggered), sub: triggered > 0 ? 'Needs review' : 'All clear', trend: (triggered > 0 ? 'up' : 'neutral') as KpiTrend },
      { id: 'avg-progress', label: 'Avg progress', value: `${avgProgress}%`, sub: 'Towards targets', trend: 'neutral' as KpiTrend },
      { id: 'email-enabled', label: 'Email alerts', value: String(emailEnabled), sub: 'Delivery enabled', trend: 'neutral' as KpiTrend },
    ];
  });

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