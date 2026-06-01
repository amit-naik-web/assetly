import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  AlertToastPayload,
  AlertToastService,
} from '../../../core/services/alert-toast.service';

export interface ToastCopy {
  symbol: string;
  headline: string;
  detail: string;
}

@Component({
  selector: 'app-alert-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alert-toast.html',
  styleUrl: './alert-toast.scss',
})
export class AlertToast {
  readonly toast = inject(AlertToastService);

  dismiss(): void {
    this.toast.dismiss();
  }

  copy(payload: AlertToastPayload): ToastCopy {
    const symbol = payload.symbol || payload.message.split(' ')[0] || '';
    const prices = payload.message.match(/\$[\d,.]+/g) ?? [];
    const price = prices[0] ?? '';
    const target = prices[1] ?? '';

    if (payload.message.includes('fell to')) {
      return {
        symbol,
        headline: 'Price alert triggered',
        detail: target
          ? `${symbol} dropped to ${price} · target ${target}`
          : `${symbol} dropped to ${price}`,
      };
    }

    return {
      symbol,
      headline: 'Price alert triggered',
      detail: target
        ? `${symbol} reached ${price} · target ${target}`
        : `${symbol} reached ${price}`,
    };
  }
}
