import { Pipe, PipeTransform } from '@angular/core';
import { HoldingRow, SortColumn, SortDir } from '../models/holdings.model';

@Pipe({
  name: 'sortHoldings',
  standalone: true,
  pure: true,  // only recalculates when inputs change
})
export class SortPipe implements PipeTransform {
  transform(
    rows: HoldingRow[],
    column: SortColumn | null,
    dir: SortDir
  ): HoldingRow[] {
    if (!rows.length || !column || dir === 'none') return rows;

    return [...rows].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      const comparison =
        typeof aVal === 'string' && typeof bVal === 'string'
          ? aVal.localeCompare(bVal)
          : (aVal as number) - (bVal as number);
      return dir === 'asc' ? comparison : -comparison;
    });
  }
}