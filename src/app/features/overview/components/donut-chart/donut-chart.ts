import {
    Component,
    ChangeDetectionStrategy,
    input,
    computed,
  } from '@angular/core';
  import { AllocationSlice } from '../../models/portfolio.model';
  
  interface DonutSegment {
    label: string;
    pct: number;
    color: string;
    offset: number;
    dash: number;
    gap: number;
  }
  
  @Component({
    selector: 'app-donut-chart',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './donut-chart.html',
    styleUrl: './donut-chart.scss',
  })
  export class DonutChart {
    data = input.required<AllocationSlice[]>();
    layout = input<'inline' | 'stacked'>('inline');
  
    readonly CIRCUMFERENCE = 2 * Math.PI * 38;

    readonly segments = computed<DonutSegment[]>(() => {
      let offset = 0;
      return this.data().map(slice => {
        const dash = (slice.pct / 100) * this.CIRCUMFERENCE;
        const gap  = this.CIRCUMFERENCE - dash;
        const seg: DonutSegment = {
          label: slice.label,
          pct:   slice.pct,
          color: slice.color,
          offset,
          dash,
          gap,
        };
        offset += dash;
        return seg;
      });
    });
  
    readonly ariaLabel = computed(() =>
      'Sector-wise allocation: ' +
      this.data().map(s => `${s.label} ${s.pct}%`).join(', ')
    );
  }