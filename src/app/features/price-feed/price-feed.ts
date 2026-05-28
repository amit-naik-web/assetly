import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { PriceFeedService } from './services/price-feed.service';
import { PriceTable } from './components/price-table/price-table';
import { SectorHeatmap } from './components/sector-heatmap/sector-heatmap';
import { TRACKED_SYMBOLS } from './models/price.model';

interface PriceFeedKpi {
  id: string;
  label: string;
  value: string;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
  live?: boolean;
}

@Component({
  selector: 'app-price-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, PriceTable, SectorHeatmap],
  templateUrl: './price-feed.html',
  styleUrl: './price-feed.scss',
})
export class PriceFeed {
  private readonly service = inject(PriceFeedService);

  readonly connected = this.service.connected;
  readonly prices = this.service.prices;
  readonly symbolCount = TRACKED_SYMBOLS.length;

  readonly kpis = computed<PriceFeedKpi[]>(() => {
    const ticks = Object.values(this.prices());
    const gainers = ticks.filter(t => t.changePct > 0).length;
    const losers = ticks.filter(t => t.changePct < 0).length;
    const avgChange = ticks.length
      ? ticks.reduce((s, t) => s + t.changePct, 0) / ticks.length
      : 0;
    const isLive = this.connected();

    return [
      {
        id: 'feed-status',
        label: 'Feed Status',
        value: isLive ? 'Live' : 'Connecting',
        changeLabel: isLive ? 'Streaming prices' : 'Establishing connection',
        trend: isLive ? 'up' : 'neutral',
        live: isLive,
      },
      {
        id: 'tracked',
        label: 'Tracked Symbols',
        value: String(TRACKED_SYMBOLS.length),
        changeLabel: 'Portfolio watchlist',
        trend: 'neutral',
      },
      {
        id: 'gainers',
        label: 'Gainers',
        value: String(gainers),
        changeLabel: `${losers} losing right now`,
        trend: gainers >= losers ? 'up' : 'down',
      },
      {
        id: 'avg-change',
        label: 'Avg Change',
        value: `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`,
        changeLabel: 'Across tracked symbols',
        trend: avgChange >= 0 ? 'up' : avgChange < 0 ? 'down' : 'neutral',
      },
    ];
  });
}
