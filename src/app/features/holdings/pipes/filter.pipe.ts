import { Pipe, PipeTransform } from '@angular/core';
import { HoldingRow } from '../models/holdings.model';

@Pipe({
  name: 'filterHoldings',
  standalone: true,
  pure: true,
})
export class FilterPipe implements PipeTransform {
  transform(rows: HoldingRow[], query: string): HoldingRow[] {
    if (!query.trim()) return rows;
    const q = query.toLowerCase().trim();
    return rows.filter(r =>
      r.symbol.toLowerCase().includes(q) ||
      r.companyName.toLowerCase().includes(q) ||
      r.sector.toLowerCase().includes(q)
    );
  }
}