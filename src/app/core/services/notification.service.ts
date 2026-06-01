import { Injectable, computed, signal } from '@angular/core';
import { AppNotification } from '../models/notification.model';

const MAX_NOTIFICATIONS = 50;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly items = signal<AppNotification[]>([]);
  readonly panelOpen = signal(false);

  readonly unreadCount = computed(
    () => this.items().filter((item) => !item.read).length,
  );

  readonly hasItems = computed(() => this.items().length > 0);

  push(alertId: string, symbol: string, message: string): void {
    const entry: AppNotification = {
      id: `${alertId}-${Date.now()}`,
      alertId,
      symbol,
      message,
      triggeredAt: new Date(),
      read: false,
    };

    this.items.update((current) =>
      [entry, ...current].slice(0, MAX_NOTIFICATIONS),
    );
  }

  togglePanel(): void {
    this.panelOpen.update((open) => !open);
  }

  openPanel(): void {
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  markRead(id: string): void {
    this.items.update((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    );
  }

  markAllRead(): void {
    this.items.update((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
  }

  dismiss(id: string): void {
    this.items.update((current) => current.filter((item) => item.id !== id));
  }
}
