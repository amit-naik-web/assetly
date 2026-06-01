import { describe, expect, it } from 'vitest';
import {
  calcAlertProgress,
  isAlertTriggered,
} from './alert-evaluation.util';
import { Alert } from '../models/alert.model';

const watchingAbove = (target: number): Alert => ({
  id: '1',
  symbol: 'AAPL',
  condition: 'PRICE_ABOVE',
  targetValue: target,
  notifyVia: 'TOAST',
  status: 'WATCHING',
  currentPrice: 100,
  progressPct: 0,
  createdAt: new Date(),
});

describe('alert-evaluation.util', () => {
  it('triggers PRICE_ABOVE when price meets target', () => {
    const alert = watchingAbove(200);
    expect(isAlertTriggered(alert, 200)).toBe(true);
    expect(isAlertTriggered(alert, 199.99)).toBe(false);
  });

  it('triggers PRICE_BELOW when price meets target', () => {
    const alert: Alert = { ...watchingAbove(100), condition: 'PRICE_BELOW' };
    expect(isAlertTriggered(alert, 100)).toBe(true);
    expect(isAlertTriggered(alert, 100.01)).toBe(false);
  });

  it('calculates progress toward target', () => {
    expect(calcAlertProgress(50, 100, 'PRICE_ABOVE')).toBe(50);
    expect(calcAlertProgress(100, 100, 'PRICE_ABOVE')).toBe(100);
  });
});
