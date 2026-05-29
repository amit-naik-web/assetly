import {
    Component,
    ChangeDetectionStrategy,
    inject,
  } from '@angular/core';
  import { DatePipe } from '@angular/common';
  import { AlertsStore } from '../../store/alerts.store';
  import {
    Alert,
    AlertCondition,
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
  
    getProgressLabel(alert: Alert): string {
      return `${alert.progressPct}% of the way to target`;
    }
  
    getCompanyName(symbol: string): string {
      return SYMBOL_COMPANY_NAMES[symbol] ?? symbol;
    }

    getSector(symbol: string): string {
      return SYMBOL_SECTORS[symbol] ?? 'Unknown';
    }

    formatTargetValue(alert: Alert): string {
      return this.isPriceCondition(alert.condition)
        ? `$${alert.targetValue.toFixed(2)}`
        : `${alert.targetValue}%`;
    }

    getAlertAriaLabel(alert: Alert): string {
      const name = this.getCompanyName(alert.symbol);
      const sector = this.getSector(alert.symbol);
      const target = this.formatTargetValue(alert);
      const status = alert.status === 'TRIGGERED'
        ? 'triggered'
        : `watching, ${alert.progressPct}% progress`;
      return `${name} (${alert.symbol}, ${sector}) alert target ${target}. Status: ${status}.`;
    }

    private isPriceCondition(condition: AlertCondition): boolean {
      return condition === 'PRICE_ABOVE' || condition === 'PRICE_BELOW';
    }
  }