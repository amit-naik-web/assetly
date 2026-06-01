import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  AlertToastPayload,
  AlertToastService,
} from '../../../core/services/alert-toast.service';
import { formatNotificationCopy } from '../../../core/utils/notification-message.util';
import { NotificationCopy } from '../../../core/models/notification.model';

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

  copy(payload: AlertToastPayload): NotificationCopy {
    return formatNotificationCopy(payload.message, payload.symbol);
  }
}
