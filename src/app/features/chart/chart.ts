import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  effect,
  computed,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { ChartService } from './services/chart.service';
import { HoldingsService } from '../holdings/services/holdings.service';
import { PriceFeedService } from '../price-feed/services/price-feed.service';
import { Candlestick } from './components/candlestick/candlestick';
import {
  OhlcvCandle,
  ChartViewMode,
  TimeRange,
  TIME_RANGES,
  TIME_RANGE_LABELS,
} from './models/chart.model';
import {
  buildDisplayCandles,
  isLiveTimeRange,
  liveRangeToSparkline,
} from './utils/live-candle.util';

@Component({
  selector: 'app-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, Candlestick],
  templateUrl: './chart.html',
  styleUrl: './chart.scss',
})
export class Chart {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private service = inject(ChartService);
  private holdingsService = inject(HoldingsService);
  private priceFeed = inject(PriceFeedService);
  private destroyRef = inject(DestroyRef);

  readonly timeRanges = TIME_RANGES;
  readonly timeRangeLabels = TIME_RANGE_LABELS;
  readonly prices = this.priceFeed.prices;

  readonly chartSymbols = computed(() =>
    (this.holdingsRows() ?? []).map(row => row.symbol),
  );

  readonly symbolRibbonItems = computed(() =>
    (this.holdingsRows() ?? []).map(row => ({
      symbol: row.symbol,
      dayChangePct: this.formatSignedPercent(row.dayChangePct),
      isGain: row.dayChangePct >= 0,
    })),
  );

  readonly symbolNames = computed(() => {
    const names: Record<string, string> = {};
    for (const row of this.holdingsRows() ?? []) {
      names[row.symbol] = row.companyName;
    }
    return names;
  });

  readonly selectedSymbolName = computed(() => {
    const sym = this.symbol();
    return this.symbolNames()[sym] || sym;
  });

  readonly selectedSector = computed(() => {
    const holding = this.selectedHolding();
    if (holding?.sector) {
      return holding.sector;
    }
    const row = this.holdingsRows().find(r => r.symbol === this.symbol());
    return row?.sector ?? '--';
  });
  readonly chartViews: { id: ChartViewMode; label: string }[] = [
    { id: 'candlestick', label: 'Candlestick' },
    { id: 'line', label: 'Line' },
  ];

  // Read symbol from route params as signal
  readonly symbol = toSignal(
    this.route.paramMap.pipe(map(p => p.get('symbol') ?? 'AAPL')),
    { initialValue: 'AAPL' }
  );

  // Selected time range
  readonly selectedRange = signal<TimeRange>('1M');
  readonly selectedView = signal<ChartViewMode>('candlestick');

  // Candles loaded state
  readonly candles  = signal<OhlcvCandle[]>([]);
  readonly yearCandles = signal<OhlcvCandle[]>([]);
  readonly loading  = signal(false);

  readonly displayCandles = computed(() => {
    const sym = this.symbol();
    const range = this.selectedRange();
    const base = this.candles();
    const tick = this.prices()[sym];
    this.priceFeed.priceHistory();
    const liveHistory = isLiveTimeRange(range)
      ? this.priceFeed.historyForRange(sym, liveRangeToSparkline(range))
      : [];
    return buildDisplayCandles(range, base, tick, liveHistory);
  });

  readonly details = computed(() => {
    const candles = this.displayCandles();
    const current = candles.length ? candles[candles.length - 1] : null;
    const previous = candles.length > 1 ? candles[candles.length - 2] : null;
    const first = candles.length ? candles[0] : null;

    const dayChange = current && previous ? current.close - previous.close : 0;
    const dayChangePct = current && previous && previous.close > 0
      ? (dayChange / previous.close) * 100
      : 0;
    const rangeChange = current && first ? current.close - first.open : 0;
    const rangeChangePct = current && first && first.open > 0
      ? (rangeChange / first.open) * 100
      : 0;
    const avgVolume = candles.length
      ? candles.reduce((sum, candle) => sum + candle.volume, 0) / candles.length
      : 0;

    return {
      lastPrice: current ? this.formatCurrency(current.close) : '--',
      dayValue: this.formatSignedCurrency(dayChange),
      dayPct: this.formatSignedPercent(dayChangePct),
      dayTrend: dayChange >= 0 ? 'up' as const : 'down' as const,
      rangeLabel: `${this.selectedRange()} return`,
      rangeValue: this.formatSignedCurrency(rangeChange),
      rangePct: this.formatSignedPercent(rangeChangePct),
      rangeTrend: rangeChange >= 0 ? 'up' as const : 'down' as const,
      avgVolume: this.formatVolume(avgVolume),
      candleCount: `${candles.length} candles`,
    };
  });

  readonly rangeStats = computed(() => {
    const display = this.displayCandles();
    const current = display.length ? display[display.length - 1].close : 0;
    const dayCandles = display;
    const yearCandles = this.yearCandles();
    const dayLow = dayCandles.length ? Math.min(...dayCandles.map(c => c.low)) : 0;
    const dayHigh = dayCandles.length ? Math.max(...dayCandles.map(c => c.high)) : 0;
    const yearLow = yearCandles.length ? Math.min(...yearCandles.map(c => c.low)) : 0;
    const yearHigh = yearCandles.length ? Math.max(...yearCandles.map(c => c.high)) : 0;

    return {
      current,
      dayLow,
      dayHigh,
      yearLow,
      yearHigh,
      dayPosition: this.positionPct(current, dayLow, dayHigh),
      yearPosition: this.positionPct(current, yearLow, yearHigh),
    };
  });

  // Pre-loaded data from resolver
  readonly resolvedData = toSignal(
    this.route.data.pipe(map(d => d['ohlcv'] as OhlcvCandle[])),
    { initialValue: [] }
  );

  private readonly holdingsRows = toSignal(this.holdingsService.getHoldings(), {
    initialValue: [],
  });

  private readonly holdingParams = toSignal(
    this.route.queryParamMap.pipe(
      map(params => ({
        source: params.get('from'),
        symbol: params.get('symbol'),
        companyName: params.get('companyName'),
        sector: params.get('sector'),
        shares: this.parseQueryNumber(params.get('shares')),
        avgCost: this.parseQueryNumber(params.get('avgCost')),
        currentPrice: this.parseQueryNumber(params.get('currentPrice')),
        totalValue: this.parseQueryNumber(params.get('totalValue')),
        totalGain: this.parseQueryNumber(params.get('totalGain')),
        totalGainPct: this.parseQueryNumber(params.get('totalGainPct')),
      })),
    ),
    {
      initialValue: {
        source: null,
        symbol: null,
        companyName: null,
        sector: null,
        shares: 0,
        avgCost: 0,
        currentPrice: 0,
        totalValue: 0,
        totalGain: 0,
        totalGainPct: 0,
      },
    },
  );

  readonly selectedHolding = computed(() => {
    const params = this.holdingParams();
    const selectedSymbol = this.symbol();
    const hasSupportedSource =
      params.source === 'holdings' || params.source === 'prices';

    if (hasSupportedSource && params.symbol === selectedSymbol) {
      return {
        companyName: params.companyName ?? this.symbolNames()[selectedSymbol] ?? selectedSymbol,
        sector: params.sector ?? '--',
        shares: params.shares,
        avgCost: params.avgCost,
        currentPrice: params.currentPrice,
        totalValue: params.totalValue,
        totalGain: params.totalGain,
        totalGainPct: params.totalGainPct,
      };
    }

    const row = this.holdingsRows().find(holding => holding.symbol === selectedSymbol);
    if (!row) {
      return null;
    }

    return {
      companyName: row.companyName,
      sector: row.sector,
      shares: row.shares,
      avgCost: row.avgCost,
      currentPrice: row.currentPrice,
      totalValue: row.totalValue,
      totalGain: row.totalGain,
      totalGainPct: row.totalGainPct,
    };
  });

  readonly selectedHoldingCard = computed(() => {
    const holding = this.selectedHolding();
    if (!holding) {
      return null;
    }
    return {
      shares: this.formatShares(holding.shares),
      avgCost: this.formatCurrency(holding.avgCost),
      currentPrice: this.formatCurrency(holding.currentPrice),
      costBasis: this.formatCurrency(holding.shares * holding.avgCost),
      totalValue: this.formatCurrency(holding.totalValue),
      totalGain: this.formatSignedCurrency(holding.totalGain),
      totalGainPct: this.formatSignedPercent(holding.totalGainPct),
      isGain: holding.totalGain >= 0,
    };
  });

  constructor() {
    effect(() => {
      const sym = this.symbol();
      const tick = this.prices()[sym];
      if (tick) {
        this.priceFeed.seedHistory(sym, tick.price);
      }
    });

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

    effect(() => {
      this.loadYearCandles(this.symbol());
    });
  }

  private loadCandles(symbol: string, range: TimeRange) {
    if (isLiveTimeRange(range)) {
      this.candles.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.service.getCandles(symbol, range).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(data => {
      this.candles.set(data);
      this.loading.set(false);
    });
  }

  private loadYearCandles(symbol: string) {
    this.service.getCandles(symbol, '1Y').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(data => this.yearCandles.set(data));
  }

  changeSymbol(symbol: string) {
    this.router.navigate(['/chart', symbol]);
  }

  changeRange(range: TimeRange) {
    this.selectedRange.set(range);
  }

  changeView(view: ChartViewMode) {
    this.selectedView.set(view);
  }

  readonly isRefreshing = computed(
    () => this.priceFeed.refreshInFlight() === this.symbol().toUpperCase(),
  );

  refreshPrice(): void {
    this.priceFeed.refreshSymbol(this.symbol());
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  }

  private formatSignedCurrency(value: number): string {
    const amount = this.formatCurrency(Math.abs(value));
    return value >= 0 ? `+${amount}` : `-${amount}`;
  }

  private formatSignedPercent(value: number): string {
    const abs = Math.abs(value).toFixed(2);
    return value >= 0 ? `+${abs}%` : `-${abs}%`;
  }

  private formatShares(value: number): string {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(value);
  }

  private formatVolume(value: number): string {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return Math.round(value).toString();
  }

  private positionPct(value: number, min: number, max: number): number {
    if (!max || max <= min) {
      return 0;
    }
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  }

  private parseQueryNumber(value: string | null): number {
    if (!value) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}