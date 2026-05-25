import {
    Component,
    ChangeDetectionStrategy,
    inject,
    computed,
  } from '@angular/core';
  import { DatePipe } from '@angular/common';
  import { AlertsStore } from '../../store/alerts.store';
  import { Alert, CONDITION_LABELS } from '../../models/alert.model';
  
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
    readonly conditionLabels = CONDITION_LABELS;
  
    dismiss(id: string) {
      this.store.dismissAlert(id);
    }
  
    getProgressLabel(alert: Alert): string {
      return `${alert.progressPct}% of the way to target`;
    }
  
    getAlertAriaLabel(alert: Alert): string {
      const cond = this.conditionLabels[alert.condition];
      const status = alert.status === 'TRIGGERED'
        ? 'triggered'
        : `watching, ${alert.progressPct}% progress`;
      return `${alert.symbol} alert: ${cond} $${alert.targetValue}. Status: ${status}.`;
    }
  }