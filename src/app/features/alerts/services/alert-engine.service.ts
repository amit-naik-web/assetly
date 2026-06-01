import { Injectable, inject, effect } from '@angular/core';
import { PriceFeedService } from '../../price-feed/services/price-feed.service';
import { Alert } from '../models/alert.model';
import { AlertsStore } from '../store/alerts.store';
import {
  calcAlertProgress,
  isAlertTriggered,
  formatTriggerMessage,
} from '../utils/alert-evaluation.util';

/**
 * Watches live prices and triggers alerts when targets are met.
 * Inject from the Alerts route so evaluation runs while the page is active.
 */
@Injectable({ providedIn: 'root' })
export class AlertEngineService {
  private readonly priceFeed = inject(PriceFeedService);
  private readonly store = inject(AlertsStore);

  constructor() {
    effect(() => {
      this.priceFeed.prices();
      const watching = this.store.watching();
      for (const alert of watching) {
        this.evaluateOne(alert);
      }
    });
  }

  /** Run as soon as an alert is created (do not wait for the next random tick). */
  evaluateNewAlert(alert: Alert): void {
    if (alert.status !== 'WATCHING') {
      return;
    }
    this.evaluateOne(alert);
  }

  private evaluateOne(alert: Alert): void {
    if (alert.status !== 'WATCHING') {
      return;
    }

    const tick = this.priceFeed.prices()[alert.symbol];
    const currentPrice = tick?.price ?? alert.currentPrice;
    if (currentPrice <= 0) {
      return;
    }

    const progressPct = calcAlertProgress(
      currentPrice,
      alert.targetValue,
      alert.condition,
    );

    if (
      alert.currentPrice !== currentPrice ||
      alert.progressPct !== progressPct
    ) {
      this.store.updateWatchingAlert(alert.id, { currentPrice, progressPct });
    }

    if (isAlertTriggered(alert, currentPrice)) {
      this.store.triggerAlert(
        alert.id,
        currentPrice,
        formatTriggerMessage(alert, currentPrice),
      );
    }
  }
}
