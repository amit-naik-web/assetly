import {
  Component,
  ChangeDetectionStrategy,
  HostListener,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { formatNotificationCopy } from '../../../core/utils/notification-message.util';
import { AppNotification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-center.html',
  styleUrl: './notification-center.scss',
})
export class NotificationCenter {
  readonly notifications = inject(NotificationService);

  togglePanel(): void {
    this.notifications.togglePanel();
  }

  closePanel(): void {
    this.notifications.closePanel();
  }

  markAllRead(): void {
    this.notifications.markAllRead();
  }

  markRead(id: string): void {
    this.notifications.markRead(id);
  }

  dismiss(id: string, event: Event): void {
    event.stopPropagation();
    this.notifications.dismiss(id);
  }

  copy(item: AppNotification) {
    return formatNotificationCopy(item.message, item.symbol);
  }

  timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) {
      return 'Just now';
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  unreadBadge(count: number): string {
    return count > 9 ? '9+' : String(count);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.notifications.panelOpen()) {
      this.closePanel();
    }
  }
}
