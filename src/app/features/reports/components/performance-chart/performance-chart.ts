import {
    Component,
    ChangeDetectionStrategy,
    input,
    computed,
  } from '@angular/core';
  import { NgClass } from '@angular/common';
  import { PerformanceRow } from '../../models/report.model';
  
  @Component({
    selector: 'app-performance-chart',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass],
    templateUrl: './performance-chart.html',
    styleUrl: './performance-chart.scss',
  })
  export class PerformanceChart {
    rows = input.required<PerformanceRow[]>();
  
    readonly maxAbs = computed(() =>
      Math.max(...this.rows().map(r => Math.abs(r.returnPct)), 1)
    );
  
    barWidth(row: PerformanceRow): number {
      return Math.round((Math.abs(row.returnPct) / this.maxAbs()) * 100);
    }
  
    readonly Math = Math;
  }