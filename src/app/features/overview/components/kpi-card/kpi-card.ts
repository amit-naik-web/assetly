import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { KpiData } from '../../models/portfolio.model';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.scss',
})
export class KpiCard {
  data = input.required<KpiData>();

  get formattedValue(): string {
    const v = this.data().value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Math.abs(v));
  }

  get formattedChange(): string {
    const d = this.data();
    const sign = d.trend === 'up' ? '+' : d.trend === 'down' ? '' : '';
    return `${sign}${d.changeLabel}`;
  }
}