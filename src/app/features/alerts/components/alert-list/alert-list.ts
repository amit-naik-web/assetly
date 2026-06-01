import {
  Component,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { AlertsStore } from '../../store/alerts.store';
import {
  Alert,
  CONDITION_LABELS,
  SYMBOL_COMPANY_NAMES,
  SYMBOL_SECTORS,
} from '../../models/alert.model';

@Component({
  selector: 'app-alert-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './alert-list.html',
  styleUrl: './alert-list.scss',
})
export class AlertList {
  readonly store = inject(AlertsStore);

  dismiss(id: string) {
    this.store.dismissAlert(id);
  }

  getConditionLabel(alert: Alert): string {
    return CONDITION_LABELS[alert.condition];
  }

  formatCurrentPrice(alert: Alert): string {
    return `$${alert.currentPrice.toFixed(2)}`;
  }

  getCompanyName(symbol: string): string {
    return SYMBOL_COMPANY_NAMES[symbol] ?? symbol;
  }

  getSector(symbol: string): string {
    return SYMBOL_SECTORS[symbol] ?? 'Unknown';
  }

  formatTargetValue(alert: Alert): string {
    return `$${alert.targetValue.toFixed(2)}`;
  }

  getAlertAriaLabel(alert: Alert): string {
    const name = this.getCompanyName(alert.symbol);
    const sector = this.getSector(alert.symbol);
    const target = this.formatTargetValue(alert);
    const status = alert.status === 'TRIGGERED'
      ? 'triggered'
      : `watching, now ${this.formatCurrentPrice(alert)}`;
    return `${name} (${alert.symbol}, ${sector}) alert target ${target}. Status: ${status}.`;
  }
}
