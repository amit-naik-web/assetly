import { Alert, AlertCondition } from '../models/alert.model';

export function deriveAlertCondition(
  target: number,
  current: number,
): AlertCondition {
  return target < current ? 'PRICE_BELOW' : 'PRICE_ABOVE';
}

export function calcAlertProgress(
  current: number,
  target: number,
  condition: AlertCondition,
): number {
  if (target <= 0 || current <= 0) {
    return 0;
  }

  if (condition === 'PRICE_ABOVE') {
    return Math.min(Math.round((current / target) * 100), 100);
  }

  return Math.min(Math.round((target / current) * 100), 100);
}

export function isAlertTriggered(alert: Alert, currentPrice: number): boolean {
  if (alert.status !== 'WATCHING') {
    return false;
  }

  if (alert.condition === 'PRICE_ABOVE') {
    return currentPrice >= alert.targetValue;
  }

  return currentPrice <= alert.targetValue;
}

export function formatTriggerMessage(alert: Alert, currentPrice: number): string {
  const direction = alert.condition === 'PRICE_ABOVE' ? 'rose to' : 'fell to';
  return `${alert.symbol} ${direction} $${currentPrice.toFixed(2)} (target $${alert.targetValue.toFixed(2)})`;
}
