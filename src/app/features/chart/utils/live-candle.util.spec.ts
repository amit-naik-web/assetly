import { describe, expect, it } from 'vitest';
import {
  historyPointsToCandles,
  patchLastCandle,
  buildDisplayCandles,
} from './live-candle.util';
import { OhlcvCandle } from '../models/chart.model';
import { PriceTick } from '../../price-feed/models/price.model';

describe('live-candle.util', () => {
  const baseCandle = (close: number, dayOffset = 0): OhlcvCandle => {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    return {
      date,
      open: close,
      high: close + 1,
      low: close - 1,
      close,
      volume: 1_000,
    };
  };

  it('patches the last candle close when the tick is on the same day', () => {
    const candles = [baseCandle(100)];
    const tick: PriceTick = {
      symbol: 'AAPL',
      price: 105,
      change: 5,
      changePct: 5,
      volume: 2_000,
      timestamp: Date.now(),
    };

    const result = patchLastCandle(candles, tick);
    expect(result).toHaveLength(1);
    expect(result[0].close).toBe(105);
    expect(result[0].high).toBeGreaterThanOrEqual(105);
  });

  it('builds intraday series from tick history for 1m range', () => {
    const now = Date.now();
    const history = [
      { price: 100, timestamp: now - 3000 },
      { price: 101, timestamp: now - 1500 },
      { price: 102, timestamp: now },
    ];

    const live = buildDisplayCandles('1m', [], undefined, history);
    expect(live).toHaveLength(3);
    expect(live[2].close).toBe(102);
  });

  it('converts history points to candles', () => {
    const candles = historyPointsToCandles([
      { price: 50, timestamp: 1 },
      { price: 52, timestamp: 2 },
    ]);
    expect(candles[1].close).toBe(52);
    expect(candles[1].high).toBe(52);
  });
});
