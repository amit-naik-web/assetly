import { Injectable, inject } from '@angular/core';
import {
  Observable, of, forkJoin,
  combineLatest, timer, BehaviorSubject,
} from 'rxjs';
import {
  map, switchMap, scan,
  withLatestFrom, delay, shareReplay,
} from 'rxjs/operators';
import { PerformanceRow, ExportRecord } from '../models/report.model';
import { PortfolioStore } from '../../overview/store/portfolio.store';

const COLOURS: Record<string, string> = {
  AAPL: '#378ADD', MSFT: '#1D9E75', NVDA: '#7F77DD',
  TSLA: '#E24B4A', GOOGL: '#EF9F27', META: '#185FA5',
  JPM:  '#BA7517', AMZN: '#5DCAA5',
};

@Injectable({ providedIn: 'root' })
export class ReportService {
  private portfolioStore = inject(PortfolioStore);

  // ── Performance data using forkJoin + combineLatest ──
  getPerformanceData(): Observable<PerformanceRow[]> {
    const symbols = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'META', 'JPM'];

    // forkJoin — fetch all in parallel, emit when ALL complete
    const requests$ = forkJoin(
      symbols.map(sym =>
        of({ symbol: sym, returnPct: this.mockReturn(sym) }).pipe(delay(200))
      )
    );

    // withLatestFrom — join with current store positions
    return requests$.pipe(
      withLatestFrom(of(this.portfolioStore.totalValue())),
      map(([results]) =>
        results.map(r => ({
          symbol:    r.symbol,
          returnPct: r.returnPct,
          returnAbs: r.returnPct * 1000,
          color:     COLOURS[r.symbol] ?? '#D3D1C7',
        }))
      ),
      // scan — accumulate running max for bar width normalisation
      scan((_, rows) => {
        const max = Math.max(...rows.map(r => Math.abs(r.returnPct)));
        return rows.map(r => ({
          ...r,
          barWidth: Math.round((Math.abs(r.returnPct) / max) * 100),
        })) as PerformanceRow[];
      }, [] as PerformanceRow[]),
      shareReplay(1),
    );
  }

  private mockReturn(symbol: string): number {
    const returns: Record<string, number> = {
      AAPL: 8.2, MSFT: 11.2, NVDA: 6.4,
      TSLA: -4.8, GOOGL: 5.1, META: 9.3, JPM: 3.8,
    };
    return returns[symbol] ?? 0;
  }

  // ── Export — Blob download ───────────────────────────
  exportCsv(positions: { symbol: string; totalValue: number }[]): Observable<Blob> {
    const header = 'Symbol,Total Value\n';
    const rows   = positions.map(p => `${p.symbol},${p.totalValue.toFixed(2)}`).join('\n');
    const csv    = header + rows;
    const blob   = new Blob([csv], { type: 'text/csv' });
    return of(blob).pipe(delay(800)); // simulate export time
  }

  getExportHistory(): Observable<ExportRecord[]> {
    return of([
      { id: '1', name: 'Monthly performance', date: new Date('2026-05-01'), format: 'CSV', sizeKb: 12 },
      { id: '2', name: 'Tax summary Q1',       date: new Date('2026-04-03'), format: 'PDF', sizeKb: 48 },
      { id: '3', name: 'Holdings snapshot',    date: new Date('2026-03-31'), format: 'CSV', sizeKb: 8  },
    ] as ExportRecord[]).pipe(delay(200));
  }
}