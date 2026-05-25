import {
    Component,
    ChangeDetectionStrategy,
    input,
    signal,
    computed,
  } from '@angular/core';
  import { NgClass, DecimalPipe  } from '@angular/common';
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
    rows = input.required<HoldingRow[]>();
  
    // Search state
    readonly searchQuery = signal('');
  
    // Sort state
    readonly sortColumn = signal<SortColumn | null>(null);
    readonly sortDir    = signal<SortDir>('none');
  
    // Filtered + sorted rows via pipes in template
    readonly filteredRows = computed(() =>
      this.rows().filter(r => {
        const q = this.searchQuery().toLowerCase().trim();
        if (!q) return true;
        return (
          r.symbol.toLowerCase().includes(q) ||
          r.companyName.toLowerCase().includes(q) ||
          r.sector.toLowerCase().includes(q)
        );
      })
    );
  
    readonly sortedRows = computed(() => {
      const rows = this.filteredRows();
      const col  = this.sortColumn();
      const dir  = this.sortDir();
  
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
  
    // Stats
    readonly stats = computed(() => ({
      total:   this.rows().length,
      showing: this.filteredRows().length,
      gainers: this.rows().filter(r => r.dayChangePct > 0).length,
      losers:  this.rows().filter(r => r.dayChangePct < 0).length,
    }));
  
    sort(column: SortColumn) {
      if (this.sortColumn() === column) {
        // Cycle: asc → desc → none
        const next: SortDir =
          this.sortDir() === 'asc'  ? 'desc' :
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
      if (dir === 'asc')  return `${label}, sorted ascending. Click to sort descending.`;
      if (dir === 'desc') return `${label}, sorted descending. Click to clear sort.`;
      return `Sort by ${label}`;
    }
  
    getAriaSortValue(column: SortColumn): 'ascending' | 'descending' | 'none' {
      if (this.sortColumn() !== column) return 'none';
      return this.sortDir() === 'asc' ? 'ascending' : 'descending';
    }
  
    readonly Math = Math;
  }