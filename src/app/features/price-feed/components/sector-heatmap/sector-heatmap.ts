import {
    Component,
    ChangeDetectionStrategy,
  } from '@angular/core';
  import { SECTOR_DATA } from '../../models/price.model';
  
  @Component({
    selector: 'app-sector-heatmap',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './sector-heatmap.html',
    styleUrl: './sector-heatmap.scss',
  })
  export class SectorHeatmap {
    readonly Math = Math;
    readonly sectors = SECTOR_DATA;
  }