import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  PLATFORM_ID,
  Injector,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser, NgClass } from '@angular/common';
import { PortfolioStore } from './store/portfolio.store';
import { PortfolioService } from './services/portfolio.service';
import { DonutChart } from './components/donut-chart/donut-chart';
import { Treemap } from '../../shared/components/treemap/treemap';
import { KpiData } from './models/portfolio.model';
import { TreemapNode } from '../../shared/components/treemap/treemap.model';

interface SectorChange {
  name: string;
  avg: number;
}

interface MarketIndex {
  label: string;
  value: string;
  changePct: number;
}

const SECTORS = [
  'All', 'Technology', 'Financials', 'Healthcare',
  'Consumer', 'Energy', 'Industrials',
];

const MARKET_INDICES: MarketIndex[] = [
  { label: 'SPX', value: '5,847.23', changePct:  0.42 },
  { label: 'NDX', value: '18,429.10', changePct:  0.61 },
  { label: 'DJI', value: '43,112.81', changePct: -0.08 },
  { label: 'VIX', value: '14.32',     changePct: -2.10 },
];

@Component({
  selector: 'app-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, DonutChart, Treemap],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class Overview implements OnInit, OnDestroy {
  readonly store   = inject(PortfolioStore);
  private service = inject(PortfolioService);
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);

  @ViewChild('treemapHero') private treemapHero?: ElementRef<HTMLElement>;

  private resizeOb?: ResizeObserver;

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId) || typeof ResizeObserver === 'undefined') {
        return;
      }
      if (this.loading()) {
        return;
      }

      afterNextRender(() => this.attachTreemapResizeObserver(), { injector: this.injector });
    });
  }

  readonly sectors = SECTORS;
  readonly marketIndices = MARKET_INDICES;
  readonly treemapHeight = signal(240);

  readonly loading      = this.store.loading;
  readonly activeSector = signal('All');

  readonly kpis = computed<KpiData[]>(() => {
    if (this.loading() || this.store.positions().length === 0) {
      return [];
    }

    const totalReturn = this.store.totalReturn();
    const totalReturnPct = this.store.totalReturnPct();
    const netDay = this.store.netDayChange();
    const dayPct = this.store.dayReturnPct();
    const current = this.store.totalValue();

    return [
      {
        id: 'total-returns',
        label: 'Total Returns',
        value: totalReturn,
        change: totalReturnPct,
        changeLabel: `${totalReturnPct >= 0 ? '+' : ''}${totalReturnPct.toFixed(1)}% all time`,
        trend: totalReturn >= 0 ? 'up' : 'down',
        valueFormat: 'signed-currency',
      },
      {
        id: 'current-value',
        label: 'Current Value',
        value: current,
        change: this.store.totalCost(),
        changeLabel: `${this.formatCurrency(this.store.totalCost())} invested`,
        trend: 'neutral',
        valueFormat: 'currency',
      },
      {
        id: 'day-returns',
        label: '1 Day Returns',
        value: netDay,
        change: dayPct,
        changeLabel: `${dayPct >= 0 ? '+' : ''}${dayPct.toFixed(2)}% today`,
        trend: netDay >= 0 ? 'up' : 'down',
        valueFormat: 'signed-currency',
      },
      {
        id: 'holdings',
        label: 'Holdings',
        value: this.store.holdingsCount(),
        change: this.store.gainers(),
        changeLabel: `${this.store.gainers()} up · ${this.store.losers()} down`,
        trend: 'neutral',
        valueFormat: 'count',
      },
    ];
  });

  readonly treemapNodes = computed<TreemapNode[]>(() => {
    const sector = this.activeSector();
    return this.store.positions()
      .filter(p => sector === 'All' || p.sector === sector)
      .map(p => ({
        id:           p.id,
        symbol:       p.symbol,
        companyName:  p.companyName,
        sector:       p.sector,
        totalValue:   p.shares * p.currentPrice,
        dayChangePct: p.dayChangePct,
        currentPrice: p.currentPrice,
      }));
  });

  readonly sectorPerf = computed<SectorChange[]>(() => {
    const positions = this.store.positions();
    const map: Record<string, { gain: number; count: number }> = {};

    positions.forEach(p => {
      if (!map[p.sector]) {
        map[p.sector] = { gain: 0, count: 0 };
      }
      map[p.sector].gain  += p.dayChangePct;
      map[p.sector].count += 1;
    });

    return Object.entries(map).map(([name, v]) => ({
      name,
      avg: parseFloat((v.gain / v.count).toFixed(2)),
    }));
  });

  ngOnInit() {
    this.store.setLoading(true);
    this.service.getPositions().subscribe(positions => {
      this.store.setPositions(positions);
      this.store.setLoading(false);
    });
  }

  ngOnDestroy() {
    this.resizeOb?.disconnect();
  }

  private attachTreemapResizeObserver(): void {
    const el = this.treemapHero?.nativeElement;
    if (!el) {
      return;
    }

    this.resizeOb?.disconnect();
    this.resizeOb = new ResizeObserver(entries => {
      const height = entries[0]?.contentRect.height ?? 0;
      if (height > 0) {
        this.treemapHeight.set(Math.max(160, Math.floor(height)));
      }
    });
    this.resizeOb.observe(el);

    const { height } = el.getBoundingClientRect();
    if (height > 0) {
      this.treemapHeight.set(Math.max(160, Math.floor(height)));
    }
  }

  setSector(s: string) { this.activeSector.set(s); }

  sectorChangeFor(sector: string): number | null {
    if (sector === 'All') {
      return null;
    }

    return this.sectorPerf().find(item => item.name === sector)?.avg ?? null;
  }

  sectorChipLabel(sector: string): string {
    if (sector === 'All') {
      return 'Show all sectors';
    }

    const change = this.sectorChangeFor(sector);
    if (change === null) {
      return sector;
    }

    return `${sector}, day change ${this.formatSectorPct(change)}`;
  }

  formatSectorPct(value: number): string {
    return `${value >= 0 ? '+' : ''}${value}%`;
  }

  indexAriaLabel(index: MarketIndex): string {
    const direction = index.changePct >= 0 ? 'up' : 'down';
    return `${index.label} ${index.value}, ${direction} ${Math.abs(index.changePct)} percent`;
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0,
    }).format(Math.abs(v));
  }

  formatSignedCurrency(v: number): string {
    const formatted = this.formatCurrency(v);
    return v >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  formatKpiValue(kpi: KpiData): string {
    switch (kpi.valueFormat ?? 'currency') {
      case 'signed-currency':
        return this.formatSignedCurrency(kpi.value);
      case 'count':
        return String(kpi.value);
      case 'currency':
      default:
        return this.formatCurrency(kpi.value);
    }
  }

}
