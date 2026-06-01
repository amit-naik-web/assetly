import {
    Injectable,
    inject,
    DestroyRef,
    signal,
  } from '@angular/core';
  import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
  import { toSignal } from '@angular/core/rxjs-interop';
  import {
    Observable,
    interval,
    Subject,
    BehaviorSubject,
    merge,
  } from 'rxjs';
  import {
    map,
    scan,
    shareReplay,
    tap,
  } from 'rxjs/operators';
  import { environment } from '../../../../environments/environment';
  import {
    PriceTick,
    PriceMap,
    PriceHistoryMap,
    PriceHistoryPoint,
    SparklineRange,
    SPARKLINE_RANGE_OPTIONS,
    SPARKLINE_POINT_COUNT,
    TRACKED_SYMBOLS,
    PRICE_HISTORY_MAX,
  } from '../models/price.model';
  
  // ── Mock base prices ──────────────────────────────────
  const BASE_PRICES: Record<string, number> = {
    AAPL:  213.48, MSFT:  421.05, NVDA:  134.72,
    TSLA:  247.61, GOOGL: 178.30, META:  583.20,
    AMZN:  224.71, JPM:   282.54, 'BRK.B': 541.88,
    JNJ:   148.90, V:     310.45, PG:    162.30,
    XOM:   118.45, UNH:   522.30, MA:    480.22,
  };
  
  const COMPANY_NAMES: Record<string, string> = {
    AAPL:  'Apple Inc.',       MSFT:  'Microsoft Corp.',
    NVDA:  'NVIDIA Corp.',     TSLA:  'Tesla Inc.',
    GOOGL: 'Alphabet Inc.',    META:  'Meta Platforms',
    AMZN:  'Amazon.com Inc.',  JPM:   'JPMorgan Chase',
    'BRK.B': 'Berkshire Hathaway', JNJ: 'Johnson & Johnson',
    V: 'Visa Inc.', PG: 'Procter & Gamble', XOM: 'Exxon Mobil',
    UNH: 'UnitedHealth Group', MA: 'Mastercard Inc.',
  };
  
  @Injectable({ providedIn: 'root' })
  export class PriceFeedService {
    private destroyRef = inject(DestroyRef);
  
    // Connection status signal
    readonly connected = signal(false);

    private readonly refreshRequest$ = new Subject<string>();

    /** Symbol currently awaiting a manual refresh tick. */
    readonly refreshInFlight = signal<string | null>(null);
  
    // ── Build the price stream ──────────────────────────
    readonly prices$: Observable<PriceMap> = this.buildStream().pipe(
      // scan() accumulates individual ticks into a full price map
      // each new tick updates just that symbol, keeping others intact
      scan((acc: PriceMap, tick: PriceTick) => ({
        ...acc,
        [tick.symbol]: tick,
      }), {} as PriceMap),
      shareReplay(1),
      takeUntilDestroyed(this.destroyRef),
    );
  
    // Bridge Observable → Signal for zoneless components
    // initialValue prevents undefined before first emission
    readonly prices = toSignal(this.prices$, {
      initialValue: this.buildInitialPriceMap(),
    });
  
    // Latest single tick — for ARIA live announcements
    readonly latestTick$ = new BehaviorSubject<PriceTick | null>(null);

    /** Last 60 ticks per symbol — for sparklines and pace estimates. */
    readonly priceHistory = signal<PriceHistoryMap>({});

    /** Request an immediate live price update for one symbol. */
    refreshSymbol(symbol: string): void {
      const sym = symbol.trim().toUpperCase();
      if (!sym) {
        return;
      }
      this.refreshInFlight.set(sym);
      this.refreshRequest$.next(sym);
    }

    private buildStream(): Observable<PriceTick> {
      const auto = environment.useMockData
        ? this.buildMockStream()
        : this.buildWebSocketStream();

      const manual = this.refreshRequest$.pipe(
        map(sym => this.createTickForSymbol(sym)),
        tap(tick => this.publishTick(tick)),
      );

      return merge(auto, manual);
    }

    private publishTick(tick: PriceTick): void {
      this.latestTick$.next(tick);
      this.appendPriceHistory(tick.symbol, tick.price, tick.timestamp);
      this.connected.set(true);
      if (this.refreshInFlight() === tick.symbol) {
        this.refreshInFlight.set(null);
      }
    }

    private createTickForSymbol(symbol: string): PriceTick {
      const sym = symbol.toUpperCase();
      const prior = this.prices()[sym];
      const base = BASE_PRICES[sym] ?? prior?.price ?? 100;
      const changePct = (Math.random() - 0.5) * 1.0;
      const change = parseFloat((base * changePct / 100).toFixed(2));
      const price = parseFloat((base + change).toFixed(2));

      if (BASE_PRICES[sym] !== undefined) {
        BASE_PRICES[sym] = price;
      }

      return {
        symbol: sym,
        price,
        change,
        changePct: parseFloat(changePct.toFixed(2)),
        volume: Math.floor(Math.random() * 1_000_000) + 100_000,
        timestamp: Date.now(),
      };
    }

    // ── Mock stream — ticks every 1.5s ─────────────────
    private buildMockStream(): Observable<PriceTick> {
      return interval(1500).pipe(
        map(() => {
          const symbol = TRACKED_SYMBOLS[
            Math.floor(Math.random() * TRACKED_SYMBOLS.length)
          ];
          const tick = this.createTickForSymbol(symbol);
          this.publishTick(tick);
          return tick;
        }),
      );
    }
  
    // ── Real WebSocket stream ───────────────────────────
    private buildWebSocketStream(): Observable<PriceTick> {
      // Full WebSocketSubject implementation added in
      // environment.useMockData = false mode
      // Connects to Finnhub: wss://ws.finnhub.io
      return this.buildMockStream(); // fallback for now
    }
  
    // ── Helpers ─────────────────────────────────────────
    private buildInitialPriceMap(): PriceMap {
      return TRACKED_SYMBOLS.reduce((acc, symbol) => ({
        ...acc,
        [symbol]: {
          symbol,
          price:     BASE_PRICES[symbol],
          change:    0,
          changePct: 0,
          volume:    0,
          timestamp: Date.now(),
        } as PriceTick,
      }), {} as PriceMap);
    }
  
    getCompanyName(symbol: string): string {
      return COMPANY_NAMES[symbol] ?? symbol;
    }

    historyFor(symbol: string): PriceHistoryPoint[] {
      return this.priceHistory()[symbol] ?? [];
    }

    /** Filtered/downsampled series for sparkline range pills (1m · 1h · 1d · 1w). */
    historyForRange(symbol: string, range: SparklineRange): PriceHistoryPoint[] {
      const option = SPARKLINE_RANGE_OPTIONS.find(r => r.id === range)!;
      const now = Date.now();
      const cutoff = now - option.ms;
      const live = (this.priceHistory()[symbol] ?? []).filter(
        p => p.timestamp >= cutoff,
      );
      const current =
        this.prices()[symbol]?.price ?? BASE_PRICES[symbol] ?? 100;

      if (range === '1m' && live.length >= 2) {
        return live.length > SPARKLINE_POINT_COUNT
          ? this.downsample(live, SPARKLINE_POINT_COUNT)
          : live;
      }

      const synthetic = this.synthesizeHistory(
        symbol,
        option.ms,
        SPARKLINE_POINT_COUNT,
        current,
        now,
      );

      if (live.length >= 2) {
        const firstLive = live[0].timestamp;
        const head = synthetic.filter(p => p.timestamp < firstLive);
        const tail =
          live.length > 30
            ? this.downsample(live, 30)
            : live;
        const merged = [...head, ...tail];
        return merged.length > SPARKLINE_POINT_COUNT
          ? this.downsample(merged, SPARKLINE_POINT_COUNT)
          : merged;
      }

      return synthetic;
    }

    rangeLabel(range: SparklineRange): string {
      return SPARKLINE_RANGE_OPTIONS.find(r => r.id === range)?.label ?? range;
    }

    private appendPriceHistory(
      symbol: string,
      price: number,
      timestamp: number,
    ): void {
      this.priceHistory.update(map => {
        const prev = map[symbol] ?? [];
        const point: PriceHistoryPoint = { price, timestamp };
        const next = [...prev, point].slice(-PRICE_HISTORY_MAX);
        return { ...map, [symbol]: next };
      });
    }

    /** Seed flat history so sparklines render before ticks accumulate. */
    seedHistory(symbol: string, price: number): void {
      const existing = this.priceHistory()[symbol];
      if (existing && existing.length >= 2) {
        return;
      }
      const now = Date.now();
      const points: PriceHistoryPoint[] = Array.from(
        { length: PRICE_HISTORY_MAX },
        (_, i) => ({
          price,
          timestamp: now - (PRICE_HISTORY_MAX - i) * 1500,
        }),
      );
      this.priceHistory.update(map => ({ ...map, [symbol]: points }));
    }

    private downsample(
      points: PriceHistoryPoint[],
      targetCount: number,
    ): PriceHistoryPoint[] {
      if (points.length <= targetCount) {
        return points;
      }
      const step = (points.length - 1) / (targetCount - 1);
      return Array.from({ length: targetCount }, (_, i) => {
        const idx = Math.min(Math.round(i * step), points.length - 1);
        return points[idx];
      });
    }

    private synthesizeHistory(
      symbol: string,
      rangeMs: number,
      pointCount: number,
      endPrice: number,
      endTime: number,
    ): PriceHistoryPoint[] {
      const seed = this.hashSeed(symbol);
      const startTime = endTime - rangeMs;
      const step = rangeMs / Math.max(pointCount - 1, 1);
      const volatility = this.volatilityForRange(rangeMs);
      const points: PriceHistoryPoint[] = [];
      let price = endPrice;

      for (let i = pointCount - 1; i >= 0; i--) {
        const timestamp = startTime + i * step;
        points.unshift({ price, timestamp });
        if (i > 0) {
          const rnd = this.pseudoRandom(seed, i);
          const changePct = (rnd - 0.5) * volatility;
          price = parseFloat((price / (1 + changePct / 100)).toFixed(2));
        }
      }

      points[points.length - 1] = { price: endPrice, timestamp: endTime };
      return points;
    }

    private volatilityForRange(rangeMs: number): number {
      if (rangeMs <= 60_000) {
        return 0.35;
      }
      if (rangeMs <= 3_600_000) {
        return 0.55;
      }
      if (rangeMs <= 86_400_000) {
        return 1.8;
      }
      return 4.5;
    }

    private hashSeed(value: string): number {
      let hash = 0;
      for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    }

    private pseudoRandom(seed: number, index: number): number {
      const x = Math.sin(seed + index * 12.9898) * 43_758.5453;
      return x - Math.floor(x);
    }
  }