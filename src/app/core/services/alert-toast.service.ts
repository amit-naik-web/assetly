import { Injectable, signal } from '@angular/core';

export interface AlertToastPayload {
  message: string;
  symbol: string;
}

@Injectable({ providedIn: 'root' })
export class AlertToastService {
  readonly active = signal<AlertToastPayload | null>(null);

  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  show(message: string, symbol = ''): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
    }

    this.active.set({ message, symbol });

    this.dismissTimer = setTimeout(() => this.dismiss(), 7000);
  }

  dismiss(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    this.active.set(null);
  }
}
