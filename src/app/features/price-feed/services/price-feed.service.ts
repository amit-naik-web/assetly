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
    TRACKED_SYMBOLS,
  } from '../models/price.model';
  
  // ── Mock base prices ──────────────────────────────────
  const BASE_PRICES: Record<string, number> = {
    AAPL:  213.48, MSFT:  421.05, NVDA:  134.72,
    TSLA:  247.61, GOOGL: 178.30, META:  583.20,
    AMZN:  224.71, JPM:   282.54,
  };
  
  const COMPANY_NAMES: Record<string, string> = {
    AAPL:  'Apple Inc.',       MSFT:  'Microsoft Corp.',
    NVDA:  'NVIDIA Corp.',     TSLA:  'Tesla Inc.',
    GOOGL: 'Alphabet Inc.',    META:  'Meta Platforms',
    AMZN:  'Amazon.com Inc.',  JPM:   'JPMorgan Chase',
  };
  
  @Injectable({ providedIn: 'root' })
  export class PriceFeedService {
    private destroyRef = inject(DestroyRef);
  
    // Connection status signal
    readonly connected = signal(false);
  
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
  
    private buildStream(): Observable<PriceTick> {
      if (environment.useMockData) {
        return this.buildMockStream();
      }
      return this.buildWebSocketStream();
    }
  
    // ── Mock stream — ticks every 1.5s ─────────────────
    private buildMockStream(): Observable<PriceTick> {
      return interval(1500).pipe(
        map(() => {
          // Pick a random symbol each tick
          const symbol = TRACKED_SYMBOLS[
            Math.floor(Math.random() * TRACKED_SYMBOLS.length)
          ];
          const base    = BASE_PRICES[symbol];
          // Random walk: ±0.5% price movement
          const changePct = (Math.random() - 0.5) * 1.0;
          const change    = parseFloat((base * changePct / 100).toFixed(2));
          const price     = parseFloat((base + change).toFixed(2));
  
          const tick: PriceTick = {
            symbol,
            price,
            change,
            changePct: parseFloat(changePct.toFixed(2)),
            volume:    Math.floor(Math.random() * 1_000_000) + 100_000,
            timestamp: Date.now(),
          };
  
          // Update base price so changes compound
          BASE_PRICES[symbol] = price;
          this.latestTick$.next(tick);
          return tick;
        }),
        tap(() => this.connected.set(true)),
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
  }