import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { HoldingsService } from './services/holdings.service';
import { HoldingsTable } from './components/holdings-table/holdings-table';
import { HoldingRow } from './models/holdings.model';

interface HoldingsKpi {
  id: string;
  label: string;
  value: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
  valueFormat: 'currency' | 'signed-currency' | 'count';
}

@Component({
  selector: 'app-holdings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, HoldingsTable],
  templateUrl: './holdings.html',
  styleUrl: './holdings.scss',
})
export class Holdings implements OnInit {
  private readonly service = inject(HoldingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly rows = signal<HoldingRow[]>([]);
  readonly loading = signal(true);

  readonly kpis = computed<HoldingsKpi[]>(() => {
    const rows = this.rows();
    if (!rows.length) {
      return [];
    }

    const totalValue = rows.reduce((s, r) => s + r.totalValue, 0);
    const totalCost = rows.reduce((s, r) => s + r.shares * r.avgCost, 0);
    const totalGain = rows.reduce((s, r) => s + r.totalGain, 0);
    const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    const dayReturn = rows.reduce((s, r) => s + r.shares * r.dayChange, 0);
    const dayPct = totalValue > 0
      ? rows.reduce((s, r) => s + r.dayChangePct * r.totalValue, 0) / totalValue
      : 0;
    const gainers = rows.filter(r => r.dayChangePct > 0).length;
    const losers = rows.filter(r => r.dayChangePct < 0).length;

    return [
      {
        id: 'portfolio-value',
        label: 'Portfolio Value',
        value: totalValue,
        changeLabel: `${this.formatCurrency(totalCost)} invested`,
        trend: 'neutral',
        valueFormat: 'currency',
      },
      {
        id: 'day-returns',
        label: '1 Day Returns',
        value: dayReturn,
        changeLabel: `${dayPct >= 0 ? '+' : ''}${dayPct.toFixed(2)}% today`,
        trend: dayReturn >= 0 ? 'up' : 'down',
        valueFormat: 'signed-currency',
      },
      {
        id: 'total-gain',
        label: 'Total Gain',
        value: totalGain,
        changeLabel: `${totalGainPct >= 0 ? '+' : ''}${totalGainPct.toFixed(1)}% all time`,
        trend: totalGain >= 0 ? 'up' : 'down',
        valueFormat: 'signed-currency',
      },
      {
        id: 'positions',
        label: 'Positions',
        value: rows.length,
        changeLabel: `${gainers} up · ${losers} down`,
        trend: 'neutral',
        valueFormat: 'count',
      },
    ];
  });

  ngOnInit() {
    this.service.getHoldings().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(rows => {
      this.rows.set(rows);
      this.loading.set(false);
    });
  }

  formatKpiValue(kpi: HoldingsKpi): string {
    switch (kpi.valueFormat) {
      case 'signed-currency':
        return this.formatSignedCurrency(kpi.value);
      case 'count':
        return String(kpi.value);
      case 'currency':
      default:
        return this.formatCurrency(kpi.value);
    }
  }

  private formatCurrency(v: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Math.abs(v));
  }

  private formatSignedCurrency(v: number): string {
    const formatted = this.formatCurrency(v);
    return v >= 0 ? `+${formatted}` : `-${formatted}`;
  }
}
