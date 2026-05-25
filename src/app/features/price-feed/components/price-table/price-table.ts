import {
    Component,
    ChangeDetectionStrategy,
    inject,
    computed,
    signal,
    effect,
  } from '@angular/core';
  import { NgClass } from '@angular/common';
  import { PriceFeedService } from '../../services/price-feed.service';
  import { TRACKED_SYMBOLS } from '../../models/price.model';
  
  @Component({
    selector: 'app-price-table',
    standalone: true,
    imports: [NgClass],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './price-table.html',
    styleUrl: './price-table.scss',
  })
  export class PriceTable {
    readonly Math = Math;
    private service = inject(PriceFeedService);
  
    readonly symbols = TRACKED_SYMBOLS;
  
    // Read the full price map from the signal
    readonly prices = this.service.prices;
  
    // Announcement text for ARIA live region
    readonly announcement = signal('');
  
    // effect() — runs a side effect when latestTick$ emits
    // Updates the live region so screen readers announce price changes
    constructor() {
      effect(() => {
        // Read prices signal to create dependency
        const map = this.prices();
        const latest = this.service.latestTick$.getValue();
        if (!latest) return;
  
        const dir = latest.changePct >= 0 ? 'up' : 'down';
        this.announcement.set(
          `${latest.symbol} ${dir} ${Math.abs(latest.changePct).toFixed(2)} percent, ` +
          `now $${latest.price.toFixed(2)}`
        );
      });
    }
  
    // Stats for the summary row
    readonly stats = computed(() => {
      const map = this.prices();
      const ticks = Object.values(map);
      return {
        gainers: ticks.filter(t => t.changePct > 0).length,
        losers:  ticks.filter(t => t.changePct < 0).length,
        avgChange: ticks.length
          ? ticks.reduce((s, t) => s + t.changePct, 0) / ticks.length
          : 0,
      };
    });
  
    getCompanyName(symbol: string): string {
      return this.service.getCompanyName(symbol);
    }
  
    formatVolume(vol: number): string {
      if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
      if (vol >= 1_000)     return `${(vol / 1_000).toFixed(0)}K`;
      return vol.toString();
    }
  }