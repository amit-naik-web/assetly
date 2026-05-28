import {
  Component,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { SECTOR_DATA, SectorData } from '../../models/price.model';
import { getSectorColor } from '../../../../shared/sector-colors';

@Component({
  selector: 'app-sector-heatmap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  templateUrl: './sector-heatmap.html',
  styleUrl: './sector-heatmap.scss',
})
export class SectorHeatmap {
  readonly sectors = SECTOR_DATA;
  readonly sectorColor = getSectorColor;

  formatPct(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }

  sectorAriaLabel(sector: SectorData): string {
    const direction = sector.changePct >= 0 ? 'up' : 'down';
    return `${sector.name} sector, ${direction} ${Math.abs(sector.changePct).toFixed(2)} percent today`;
  }
}
