import { Injectable, inject } from '@angular/core';
import {
  Observable, of, forkJoin,
  combineLatest, timer, BehaviorSubject,
} from 'rxjs';
import {
  map, switchMap, scan,
  withLatestFrom, delay, shareReplay,
} from 'rxjs/operators';
import { PerformanceRow } from '../models/report.model';
import { PortfolioStore } from '../../overview/store/portfolio.store';
import { HoldingRow } from '../../holdings/models/holdings.model';

const HOLDINGS_CSV_HEADERS = [
  'Company Name',
  'Company Symbol',
  'Sector',
  'Shares',
  'Avg Cost',
  'Gain/Loss',
  'Gain/Loss %',
  'Current Price',
  'Holdings Value',
] as const;

/** Light blue header background for Excel-compatible export */
const EXPORT_HEADER_BG = '#D6E8F5';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const sharesFormatter = new Intl.NumberFormat('en-US');

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatSignedCurrency(value: number): string {
  const formatted = currencyFormatter.format(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

function formatSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

function formatShares(value: number): string {
  return sharesFormatter.format(value);
}

function gainLossStyle(value: number): string {
  return value >= 0 ? 'color:#0F6E56' : 'color:#A32D2D';
}

/** e.g. holdings_report_May_1-31_2026_29_14-30-45 */
export function buildHoldingsReportFilename(date = new Date()): string {
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
  const monthRange = `${month}_1-${lastDay}_${year}`;
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `holdings_report_${monthRange}_${day}_${h}-${m}-${s}`;
}

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

  // ── Export — Excel-compatible HTML (currency, %, styled header) ──
  exportCsv(holdings: HoldingRow[]): Observable<Blob> {
    const headerCells = HOLDINGS_CSV_HEADERS.map(
      h => `<th style="background-color:${EXPORT_HEADER_BG};font-weight:bold;padding:6px 10px;border:1px solid #D3D1C7">${escapeHtml(h)}</th>`,
    ).join('');

    const bodyRows = holdings.map(h => `
      <tr>
        <td style="padding:4px 10px;border:1px solid #D3D1C7">${escapeHtml(h.companyName)}</td>
        <td style="padding:4px 10px;border:1px solid #D3D1C7">${escapeHtml(h.symbol)}</td>
        <td style="padding:4px 10px;border:1px solid #D3D1C7">${escapeHtml(h.sector)}</td>
        <td style="padding:4px 10px;border:1px solid #D3D1C7;text-align:right">${formatShares(h.shares)}</td>
        <td style="padding:4px 10px;border:1px solid #D3D1C7;text-align:right">${formatCurrency(h.avgCost)}</td>
        <td style="padding:4px 10px;border:1px solid #D3D1C7;text-align:right;${gainLossStyle(h.totalGain)}">${formatSignedCurrency(h.totalGain)}</td>
        <td style="padding:4px 10px;border:1px solid #D3D1C7;text-align:right;${gainLossStyle(h.totalGainPct)}">${formatSignedPercent(h.totalGainPct)}</td>
        <td style="padding:4px 10px;border:1px solid #D3D1C7;text-align:right">${formatCurrency(h.currentPrice)}</td>
        <td style="padding:4px 10px;border:1px solid #D3D1C7;text-align:right">${formatCurrency(h.totalValue)}</td>
      </tr>`).join('');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
            th { background-color: ${EXPORT_HEADER_BG}; font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <thead><tr>${headerCells}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </body>
      </html>`;

    const blob = new Blob(['\uFEFF', html], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    });
    return of(blob).pipe(delay(800)); // simulate export time
  }

}