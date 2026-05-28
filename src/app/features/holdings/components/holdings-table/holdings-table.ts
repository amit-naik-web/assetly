import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  signal,
  computed,
} from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { getSectorColor } from '../../../../shared/sector-colors';
import { HoldingRow, SortColumn, SortDir } from '../../models/holdings.model';

@Component({
  selector: 'app-holdings-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, DecimalPipe],
  templateUrl: './holdings-table.html',
  styleUrl: './holdings-table.scss',
})
export class HoldingsTable {
  private readonly router = inject(Router);

  rows = input.required<HoldingRow[]>();

  readonly searchQuery = signal('');

  readonly sortColumn = signal<SortColumn | null>(null);
  readonly sortDir = signal<SortDir>('none');

  readonly hasSearch = computed(() => this.searchQuery().trim().length > 0);

  readonly filteredRows = computed(() =>
    this.rows().filter(r => {
      const q = this.searchQuery().toLowerCase().trim();
      if (!q) return true;
      return (
        r.symbol.toLowerCase().includes(q) ||
        r.companyName.toLowerCase().includes(q) ||
        r.sector.toLowerCase().includes(q)
      );
    }),
  );

  readonly sortedRows = computed(() => {
    const rows = this.filteredRows();
    const col = this.sortColumn();
    const dir = this.sortDir();

    if (!col || dir === 'none') return rows;

    return [...rows].sort((a, b) => {
      const aVal = a[col];
      const bVal = b[col];
      let cmp = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        cmp = aVal.localeCompare(bVal);
      } else {
        cmp = (aVal as number) - (bVal as number);
      }
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  readonly stats = computed(() => ({
    total: this.rows().length,
    showing: this.filteredRows().length,
    gainers: this.rows().filter(r => r.dayChangePct > 0).length,
    losers: this.rows().filter(r => r.dayChangePct < 0).length,
  }));

  clearSearch(): void {
    this.searchQuery.set('');
  }

  sort(column: SortColumn) {
    if (this.sortColumn() === column) {
      const next: SortDir =
        this.sortDir() === 'asc' ? 'desc' :
        this.sortDir() === 'desc' ? 'none' : 'asc';
      this.sortDir.set(next);
      if (next === 'none') this.sortColumn.set(null);
    } else {
      this.sortColumn.set(column);
      this.sortDir.set('asc');
    }
  }

  getSortAriaLabel(column: SortColumn, label: string): string {
    if (this.sortColumn() !== column) return `Sort by ${label}`;
    const dir = this.sortDir();
    if (dir === 'asc') return `${label}, sorted ascending. Click to sort descending.`;
    if (dir === 'desc') return `${label}, sorted descending. Click to clear sort.`;
    return `Sort by ${label}`;
  }

  getAriaSortValue(column: SortColumn): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== column) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  getMiniChartPoints(row: HoldingRow): string {
    const hash = Array.from(row.symbol).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const amplitude = Math.min(5.5, Math.max(1.5, Math.abs(row.dayChangePct) * 2.2));
    const direction = row.dayChangePct >= 0 ? -1 : 1;
    const offsets = [
      ((hash % 5) - 2) * 0.6,
      (((hash >> 1) % 7) - 3) * 0.55,
      (((hash >> 2) % 5) - 2) * 0.5,
      (((hash >> 3) % 7) - 3) * 0.45,
      (((hash >> 4) % 5) - 2) * 0.4,
    ];
    const xStep = 14;
    const baselineY = 12;
    const points = offsets.map((offset, index) => {
      const x = 3 + index * xStep;
      const y = baselineY + direction * amplitude + offset;
      return `${x},${Math.max(3, Math.min(21, y)).toFixed(2)}`;
    });
    return points.join(' ');
  }

  readonly Math = Math;
  readonly sectorColor = getSectorColor;

  openHoldingChart(row: HoldingRow): void {
    void this.router.navigate(['/chart', row.symbol], {
      queryParams: {
        from: 'holdings',
        symbol: row.symbol,
        companyName: row.companyName,
        sector: row.sector,
        shares: row.shares,
        avgCost: row.avgCost,
        currentPrice: row.currentPrice,
        dayChangePct: row.dayChangePct,
        totalValue: row.totalValue,
        totalGain: row.totalGain,
        totalGainPct: row.totalGainPct,
      },
    });
  }

  onRowKeydown(event: KeyboardEvent, row: HoldingRow): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openHoldingChart(row);
    }
  }
}
