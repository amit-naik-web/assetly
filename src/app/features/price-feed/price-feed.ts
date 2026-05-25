import {
  Component,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { PriceFeedService } from './services/price-feed.service';
import { PriceTable } from './components/price-table/price-table';
import { SectorHeatmap } from './components/sector-heatmap/sector-heatmap';

@Component({
  selector: 'app-price-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PriceTable, SectorHeatmap],
  templateUrl: './price-feed.html',
  styleUrl: './price-feed.scss',
})
export class PriceFeed {
  readonly connected = inject(PriceFeedService).connected;
}