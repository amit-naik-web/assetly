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
import { PriceTick, TRACKED_SYMBOLS } from '../../models/price.model';

type SortColumn = 'symbol' | 'price' | 'change' | 'changePct' | 'volume';
type SortDir = 'asc' | 'desc' | 'none';

interface PriceRow {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  tick: PriceTick | null;
}

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
  private readonly service = inject(PriceFeedService);

  readonly symbolCount = TRACKED_SYMBOLS.length;

  // Read the full price map from the signal
  readonly prices = this.service.prices;

  // Announcement text for ARIA live region
  readonly announcement = signal('');

  // Sorting state
  readonly sortColumn = signal<SortColumn>('symbol');
  readonly sortDir = signal<SortDir>('asc');

  // Pagination state
  readonly pageSize = 8;
  readonly pageIndex = signal(0);

  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.symbolCount / this.pageSize)),
  );

  // Base rows built from latest prices
  readonly rows = computed<PriceRow[]>(() => {
    const map = this.prices();
    return TRACKED_SYMBOLS.map(symbol => {
      const tick = map[symbol] ?? null;
      const price = tick?.price ?? 0;
      const change = tick?.change ?? 0;
      const changePct = tick?.changePct ?? 0;
      const volume = tick?.volume ?? 0;

      return {
        symbol,
        companyName: this.service.getCompanyName(symbol),
        price,
        change,
        changePct,
        volume,
        tick,
      };
    });
  });

  readonly sortedRows = computed<PriceRow[]>(() => {
    const rows = [...this.rows()];
    const col = this.sortColumn();
    const dir = this.sortDir();

    if (dir === 'none') {
      return rows;
    }

    rows.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (col) {
        case 'symbol':
          aVal = a.symbol;
          bVal = b.symbol;
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'change':
          aVal = a.change;
          bVal = b.change;
          break;
        case 'changePct':
          aVal = a.changePct;
          bVal = b.changePct;
          break;
        case 'volume':
          aVal = a.volume;
          bVal = b.volume;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return dir === 'asc' ? cmp : -cmp;
      }

      const cmp = (aVal as number) - (bVal as number);
      return dir === 'asc' ? cmp : -cmp;
    });

    return rows;
  });

  readonly pagedRows = computed<PriceRow[]>(() => {
    const start = this.pageIndex() * this.pageSize;
    return this.sortedRows().slice(start, start + this.pageSize);
  });

  // Stats for the summary chips
  readonly stats = computed(() => {
    const ticks = this.rows();
    return {
      gainers: ticks.filter(t => t.changePct > 0).length,
      losers: ticks.filter(t => t.changePct < 0).length,
      avgChange: ticks.length
        ? ticks.reduce((s, t) => s + t.changePct, 0) / ticks.length
        : 0,
    };
  });

  // effect() — runs a side effect when latestTick$ emits
  // Updates the live region so screen readers announce price changes
  constructor() {
    effect(() => {
      const map = this.prices();
      const latest = this.service.latestTick$.getValue();
      if (!latest) return;

      const dir = latest.changePct >= 0 ? 'up' : 'down';
      this.announcement.set(
        `${latest.symbol} ${dir} ${Math.abs(latest.changePct).toFixed(2)} percent, ` +
        `now $${latest.price.toFixed(2)}`,
      );
    });
  }

  sort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      const next: SortDir =
        this.sortDir() === 'asc' ? 'desc' :
        this.sortDir() === 'desc' ? 'none' : 'asc';
      this.sortDir.set(next);
      if (next === 'none') {
        this.sortColumn.set('symbol');
      }
    } else {
      this.sortColumn.set(column);
      this.sortDir.set('asc');
    }
    this.pageIndex.set(0);
  }

  getAriaSortValue(column: SortColumn): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== column || this.sortDir() === 'none') {
      return 'none';
    }
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  getSortAriaLabel(column: SortColumn, label: string): string {
    if (this.sortColumn() !== column || this.sortDir() === 'none') {
      return `Sort by ${label}`;
    }
    const dir = this.sortDir();
    if (dir === 'asc') {
      return `${label}, sorted ascending. Click to sort descending.`;
    }
    return `${label}, sorted descending. Click to clear sort.`;
  }

  nextPage(): void {
    const current = this.pageIndex();
    if (current < this.pageCount() - 1) {
      this.pageIndex.set(current + 1);
    }
  }

  prevPage(): void {
    const current = this.pageIndex();
    if (current > 0) {
      this.pageIndex.set(current - 1);
    }
  }

  formatVolume(vol: number): string {
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000)     return `${(vol / 1_000).toFixed(0)}K`;
    return vol.toString();
  }
}