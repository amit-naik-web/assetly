import {

  Component,

  ChangeDetectionStrategy,

  inject,

  input,

  computed,

  effect,

  signal,

} from '@angular/core';

import { NgClass } from '@angular/common';

import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { of } from 'rxjs';
import { switchMap } from 'rxjs';

import { PriceFeedService } from '../../../price-feed/services/price-feed.service';

import { ChartService } from '../../../chart/services/chart.service';

import {
  OhlcvCandle,
  TimeRange,
  TIME_RANGES,
  TIME_RANGE_LABELS,
} from '../../../chart/models/chart.model';
import {
  buildDisplayCandles,
  isLiveTimeRange,
  liveRangeToSparkline,
} from '../../../chart/utils/live-candle.util';

import { TRACKED_SYMBOLS } from '../../../price-feed/models/price.model';

import { SYMBOL_COMPANY_NAMES } from '../../models/alert.model';



const CHART_WIDTH = 280;

const CHART_HEIGHT = 100;

const CHART_PAD_X = 6;

const CHART_DRAW_W = CHART_WIDTH - CHART_PAD_X * 2;

const CHART_DOT_CX = CHART_WIDTH - CHART_PAD_X;

const CHART_PAD_Y = 10;



interface ChartPoint {

  x: number;

  y: number;

  price: number;

  high: number;

  low: number;

  dateLabel: string;

}



@Component({

  selector: 'app-alert-live-panel',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [NgClass],

  templateUrl: './alert-live-panel.html',

  styleUrl: './alert-live-panel.scss',

})

export class AlertLivePanel {

  private readonly priceFeed = inject(PriceFeedService);

  private readonly chartService = inject(ChartService);



  readonly symbol = input.required<string>();

  readonly targetValue = input.required<number>();

  readonly prices = this.priceFeed.prices;

  readonly timeRanges = TIME_RANGES;
  readonly timeRangeLabels = TIME_RANGE_LABELS;

  readonly selectedRange = signal<TimeRange>('1M');

  readonly hoveredIndex = signal<number | null>(null);



  readonly chartViewBox = `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`;

  readonly chartDotCx = CHART_DOT_CX;
  readonly chartPadX = CHART_PAD_X;
  readonly chartPadY = CHART_PAD_Y;
  readonly chartHeight = CHART_HEIGHT;

  private readonly chartParams = computed(() => ({

    symbol: this.symbol(),

    range: this.selectedRange(),

  }));



  readonly candles = toSignal(
    toObservable(this.chartParams).pipe(
      switchMap(({ symbol, range }) =>
        isLiveTimeRange(range)
          ? of([] as OhlcvCandle[])
          : this.chartService.getCandles(symbol, range),
      ),
    ),
    { initialValue: [] as OhlcvCandle[] },
  );

  readonly displayCandles = computed(() => {
    const sym = this.symbol();
    const range = this.selectedRange();
    const base = this.candles();
    const tick = this.tick() ?? undefined;
    // Subscribe to tick history updates for live ranges.
    this.priceFeed.priceHistory();
    const liveHistory = isLiveTimeRange(range)
      ? this.priceFeed.historyForRange(sym, liveRangeToSparkline(range))
      : [];
    return buildDisplayCandles(range, base, tick, liveHistory);
  });



  constructor() {

    effect(() => {

      const sym = this.symbol();

      const tick = this.prices()[sym];

      if (tick) {

        this.priceFeed.seedHistory(sym, tick.price);

      }

    });



    effect(() => {

      this.symbol();

      this.selectedRange.set('1M');

      this.hoveredIndex.set(null);

    });

  }



  readonly isLive = computed(() =>
    TRACKED_SYMBOLS.includes(this.symbol()),
  );

  readonly isRefreshing = computed(
    () => this.priceFeed.refreshInFlight() === this.symbol().toUpperCase(),
  );



  readonly tick = computed(() => this.prices()[this.symbol()] ?? null);



  readonly currentPrice = computed(() => this.tick()?.price ?? 0);



  readonly changePct = computed(() => this.tick()?.changePct ?? 0);



  readonly isUp = computed(() => this.changePct() >= 0);



  readonly companyName = computed(

    () =>

      SYMBOL_COMPANY_NAMES[this.symbol()] ??

      this.priceFeed.getCompanyName(this.symbol()),

  );



  readonly chartLayout = computed(() => {
    const candles = this.displayCandles();

    if (candles.length < 2) {

      return {

        points: [] as ChartPoint[],

        path: '',

        areaPath: '',

        min: 0,

        max: 0,

        endY: CHART_HEIGHT / 2,

      };

    }



    const bounds = candles.flatMap(c => [c.high, c.low]);

    const target = this.targetValue();

    if (target > 0) {

      bounds.push(target);

    }



    const min = Math.min(...bounds);

    const max = Math.max(...bounds);

    const span = max - min || 1;

    const drawH = CHART_HEIGHT - CHART_PAD_Y * 2;



    const points: ChartPoint[] = candles.map((c, i) => {

      const x =

        CHART_PAD_X + (i / (candles.length - 1)) * CHART_DRAW_W;

      const y =

        CHART_PAD_Y + drawH - ((c.close - min) / span) * drawH;

      return {

        x,

        y,

        price: c.close,

        high: c.high,

        low: c.low,

        dateLabel: this.formatPointDate(c.date),

      };

    });



    const path = points

      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)

      .join(' ');



    const baseY = (CHART_HEIGHT - CHART_PAD_Y).toFixed(1);

    const areaPath = `${path} L${points[points.length - 1].x.toFixed(1)},${baseY} L${points[0].x.toFixed(1)},${baseY} Z`;



    return {

      points,

      path,

      areaPath,

      min,

      max,

      endY: points[points.length - 1].y,

    };

  });



  readonly chartPath = computed(() => this.chartLayout().path);

  readonly chartAreaPath = computed(() => this.chartLayout().areaPath);

  readonly chartEndY = computed(() => this.chartLayout().endY);



  readonly targetLineY = computed(() => {

    const layout = this.chartLayout();

    if (!layout.points.length) {

      return null;

    }

    const target = this.targetValue();

    const span = layout.max - layout.min || 1;

    const drawH = CHART_HEIGHT - CHART_PAD_Y * 2;

    return CHART_PAD_Y + drawH - ((target - layout.min) / span) * drawH;

  });



  readonly showTargetLine = computed(
    () => this.targetValue() > 0 && this.targetLineY() !== null,
  );



  readonly activePoint = computed(() => {

    const pts = this.chartLayout().points;

    if (!pts.length) {

      return null;

    }

    const idx = this.hoveredIndex();

    if (idx !== null && pts[idx]) {

      return pts[idx];

    }

    return pts[pts.length - 1];

  });



  readonly crosshairX = computed(() => this.activePoint()?.x ?? null);



  readonly tooltipLeftPct = computed(() => {
    const x = this.activePoint()?.x;
    if (x == null) {
      return 50;
    }
    const pct = (x / CHART_WIDTH) * 100;
    return Math.min(88, Math.max(12, pct));
  });



  readonly rangeChangePct = computed(() => {
    const candles = this.displayCandles();

    if (candles.length < 2 || candles[0].close === 0) {

      return 0;

    }

    const first = candles[0].close;

    const last = candles[candles.length - 1].close;

    return ((last - first) / first) * 100;

  });



  readonly periodHigh = computed(() => {
    const candles = this.displayCandles();

    return candles.length

      ? Math.max(...candles.map(c => c.high))

      : 0;

  });



  readonly periodLow = computed(() => {
    const candles = this.displayCandles();

    return candles.length

      ? Math.min(...candles.map(c => c.low))

      : 0;

  });



  readonly chartSummary = computed(() => {

    const range = this.selectedRange();

    const pct = this.rangeChangePct();

    const sign = pct >= 0 ? '+' : '';

    const label = this.timeRangeLabels[range];
    return `${label} ${sign}${pct.toFixed(2)}% · H $${this.periodHigh().toFixed(2)} · L $${this.periodLow().toFixed(2)}`;

  });



  readonly chartTrend = computed(() => {
    const candles = this.displayCandles();
    const range = this.selectedRange();

    if (candles.length < 2) {
      return `Loading ${this.timeRangeLabels[range]} price history`;

    }

    const pt = this.activePoint();

    if (!pt) {

      return this.chartSummary();

    }

    return `${pt.dateLabel}: $${pt.price.toFixed(2)} · high $${pt.high.toFixed(2)} · low $${pt.low.toFixed(2)}`;

  });



  readonly liveAnnouncement = computed(() => {

    const sym = this.symbol();

    const pt = this.activePoint();

    if (pt) {

      return `${sym} on ${pt.dateLabel}, close ${pt.price.toFixed(2)} dollars`;

    }

    const price = this.currentPrice();

    const pct = this.changePct();

    const sign = pct >= 0 ? 'up' : 'down';

    return `${sym} ${price.toFixed(2)}, ${sign} ${Math.abs(pct).toFixed(2)} percent`;

  });



  changeRange(range: TimeRange): void {
    this.selectedRange.set(range);
    this.hoveredIndex.set(null);
  }

  refreshPrice(): void {
    this.priceFeed.refreshSymbol(this.symbol());
  }



  onPointerMove(event: PointerEvent): void {

    const pts = this.chartLayout().points;

    if (pts.length < 2) {

      return;

    }

    const svg = event.currentTarget as SVGSVGElement;

    const rect = svg.getBoundingClientRect();

    if (rect.width <= 0) {

      return;

    }

    const ratio = Math.max(

      0,

      Math.min(1, (event.clientX - rect.left) / rect.width),

    );

    const index = Math.round(ratio * (pts.length - 1));

    this.hoveredIndex.set(index);

  }



  clearHover(): void {

    this.hoveredIndex.set(null);

  }



  handleChartKey(event: KeyboardEvent): void {

    const pts = this.chartLayout().points;

    if (pts.length < 2) {

      return;

    }

    const current = this.hoveredIndex() ?? pts.length - 1;

    switch (event.key) {

      case 'ArrowRight':

        this.hoveredIndex.set(Math.min(current + 1, pts.length - 1));

        event.preventDefault();

        break;

      case 'ArrowLeft':

        this.hoveredIndex.set(Math.max(current - 1, 0));

        event.preventDefault();

        break;

      case 'Escape':

        this.hoveredIndex.set(null);

        break;

    }

  }



  private formatPointDate(date: Date): string {
    if (isLiveTimeRange(this.selectedRange())) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

}


