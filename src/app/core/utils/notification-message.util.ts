import { NotificationCopy } from '../models/notification.model';

export function formatNotificationCopy(
  message: string,
  symbol = '',
): NotificationCopy {
  const resolvedSymbol = symbol || message.split(' ')[0] || '';
  const prices = message.match(/\$[\d,.]+/g) ?? [];
  const price = prices[0] ?? '';
  const target = prices[1] ?? '';

  if (message.includes('fell to')) {
    return {
      symbol: resolvedSymbol,
      headline: 'Price alert triggered',
      detail: target
        ? `${resolvedSymbol} dropped to ${price} · target ${target}`
        : `${resolvedSymbol} dropped to ${price}`,
    };
  }

  return {
    symbol: resolvedSymbol,
    headline: 'Price alert triggered',
    detail: target
      ? `${resolvedSymbol} reached ${price} · target ${target}`
      : `${resolvedSymbol} reached ${price}`,
  };
}
