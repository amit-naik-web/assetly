import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ChartService } from '../services/chart.service';
import { OhlcvCandle } from '../models/chart.model';

export const ohlcvResolver: ResolveFn<OhlcvCandle[]> = (route) => {
  const symbol = route.paramMap.get('symbol') ?? 'AAPL';
  return inject(ChartService).getCandles(symbol, '1M');
};