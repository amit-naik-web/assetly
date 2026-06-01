import { OhlcvCandle } from '../models/chart.model';
import { PriceHistoryPoint, PriceTick } from '../../price-feed/models/price.model';

/** True when the range is driven by live tick history (1 minute / 1 hour). */
export function isLiveTimeRange(range: string): range is '1m' | '1h' {
  return range === '1m' || range === '1h';
}

export function liveRangeToSparkline(range: '1m' | '1h'): '1m' | '1h' {
  return range;
}

/** Convert rolling tick history into OHLCV points for line/candle charts. */
export function historyPointsToCandles(points: PriceHistoryPoint[]): OhlcvCandle[] {
  if (!points.length) {
    return [];
  }

  return points.map((point, index) => {
    const open = index > 0 ? points[index - 1].price : point.price;
    const close = point.price;
    const high = Math.max(open, close);
    const low = Math.min(open, close);

    return {
      date: new Date(point.timestamp),
      open,
      high,
      low,
      close,
      volume: 0,
    };
  });
}

/** Patch the last daily bar (or append today) from a live tick. */
export function patchLastCandle(
  candles: OhlcvCandle[],
  tick: PriceTick | undefined,
): OhlcvCandle[] {
  if (!candles.length || !tick) {
    return candles;
  }

  const last = candles[candles.length - 1];
  const todayKey = new Date().toDateString();
  const lastKey = last.date.toDateString();

  if (todayKey === lastKey) {
    const close = tick.price;
    return [
      ...candles.slice(0, -1),
      {
        ...last,
        close,
        high: Math.max(last.high, close),
        low: Math.min(last.low, close),
        volume: tick.volume > 0 ? tick.volume : last.volume,
      },
    ];
  }

  const price = tick.price;
  return [
    ...candles,
    {
      date: new Date(),
      open: price,
      high: price,
      low: price,
      close: price,
      volume: tick.volume,
    },
  ];
}

export function buildDisplayCandles(
  range: string,
  baseCandles: OhlcvCandle[],
  tick: PriceTick | undefined,
  liveHistory: PriceHistoryPoint[],
): OhlcvCandle[] {
  if (isLiveTimeRange(range)) {
    const live = historyPointsToCandles(liveHistory);
    if (live.length >= 2) {
      return live;
    }
    return patchLastCandle(baseCandles, tick);
  }

  return patchLastCandle(baseCandles, tick);
}
