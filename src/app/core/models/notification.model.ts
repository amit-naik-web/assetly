export interface AppNotification {
  id: string;
  alertId: string;
  symbol: string;
  message: string;
  triggeredAt: Date;
  read: boolean;
}

export interface NotificationCopy {
  symbol: string;
  headline: string;
  detail: string;
}
