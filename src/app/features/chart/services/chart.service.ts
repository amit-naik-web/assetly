import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { OhlcvCandle, TimeRange, BASE_PRICES } from '../models/chart.model';

@Injectable({ providedIn: 'root' })
export class ChartService {

  getCandles(symbol: string, range: TimeRange): Observable<OhlcvCandle[]> {
    return of(this.generateCandles(symbol, range)).pipe(delay(400));
  }

  private generateCandles(symbol: string, range: TimeRange): OhlcvCandle[] {
    const days = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[range];
    const candles: OhlcvCandle[] = [];
    let price = BASE_PRICES[symbol] ?? 100;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const open  = price;
      const move  = (Math.random() - 0.48) * price * 0.025;
      const close = parseFloat((price + move).toFixed(2));
      const high  = parseFloat((Math.max(open, close) + Math.random() * price * 0.01).toFixed(2));
      const low   = parseFloat((Math.min(open, close) - Math.random() * price * 0.01).toFixed(2));
      const volume = Math.floor(Math.random() * 50_000_000) + 10_000_000;

      candles.push({ date, open, high, low, close, volume });
      price = close;
    }

    return candles;
  }

  // Technical indicator calculations
  calculateIndicators(candles: OhlcvCandle[]) {
    const closes = candles.map(c => c.close);
    return {
      rsi:     this.rsi(closes, 14),
      sma50:   this.sma(closes, 50),
      sma200:  this.sma(closes, 200),
      macd:    this.macd(closes),
    };
  }

  private sma(data: number[], period: number): number | null {
    if (data.length < period) return null;
    const slice = data.slice(-period);
    return parseFloat((slice.reduce((a, b) => a + b, 0) / period).toFixed(2));
  }

  private rsi(data: number[], period = 14): number | null {
    if (data.length < period + 1) return null;
    const changes = data.slice(-period - 1).map((v, i, a) =>
      i === 0 ? 0 : v - a[i - 1]
    ).slice(1);
    const gains = changes.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
    const losses = Math.abs(changes.filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;
    if (losses === 0) return 100;
    const rs = gains / losses;
    return parseFloat((100 - 100 / (1 + rs)).toFixed(1));
  }

  private macd(data: number[]): number | null {
    const ema12 = this.ema(data, 12);
    const ema26 = this.ema(data, 26);
    if (ema12 === null || ema26 === null) return null;
    return parseFloat((ema12 - ema26).toFixed(2));
  }

  private ema(data: number[], period: number): number | null {
    if (data.length < period) return null;
    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b) / period;
    for (let i = period; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return parseFloat(ema.toFixed(2));
  }
}