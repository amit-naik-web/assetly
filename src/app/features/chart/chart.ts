import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  effect,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { switchMap } from 'rxjs';
import { ChartService } from './services/chart.service';
import { Candlestick } from './components/candlestick/candlestick';
import { IndicatorPanel } from './components/indicator-panel/indicator-panel';
import {
  OhlcvCandle,
  TimeRange,
  TIME_RANGES,
  CHART_SYMBOLS,
} from './models/chart.model';

@Component({
  selector: 'app-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Candlestick, IndicatorPanel],
  templateUrl: './chart.html',
  styleUrl: './chart.scss',
})
export class Chart {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private service = inject(ChartService);

  readonly timeRanges  = TIME_RANGES;
  readonly chartSymbols = CHART_SYMBOLS;

  // Read symbol from route params as signal
  readonly symbol = toSignal(
    this.route.paramMap.pipe(map(p => p.get('symbol') ?? 'AAPL')),
    { initialValue: 'AAPL' }
  );

  // Selected time range
  readonly selectedRange = signal<TimeRange>('1M');

  // Candles loaded state
  readonly candles  = signal<OhlcvCandle[]>([]);
  readonly loading  = signal(false);

  // Pre-loaded data from resolver
  readonly resolvedData = toSignal(
    this.route.data.pipe(map(d => d['ohlcv'] as OhlcvCandle[])),
    { initialValue: [] }
  );

  constructor() {
    // Use resolver data initially
    effect(() => {
      const resolved = this.resolvedData();
      if (resolved?.length) {
        this.candles.set(resolved);
      }
    });

    // Reload when symbol or range changes
    effect(() => {
      const sym   = this.symbol();
      const range = this.selectedRange();
      this.loadCandles(sym, range);
    });
  }

  private loadCandles(symbol: string, range: TimeRange) {
    this.loading.set(true);
    this.service.getCandles(symbol, range).subscribe(data => {
      this.candles.set(data);
      this.loading.set(false);
    });
  }

  changeSymbol(symbol: string) {
    this.router.navigate(['/chart', symbol]);
  }

  changeRange(range: TimeRange) {
    this.selectedRange.set(range);
  }
}