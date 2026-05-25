export type ReportTab = 'performance' | 'comparison' | 'tax' | 'dividends';

export interface PerformanceRow {
  symbol: string;
  returnPct: number;
  returnAbs: number;
  color: string;
}

export interface ExportRecord {
  id: string;
  name: string;
  date: Date;
  format: 'CSV' | 'PDF';
  sizeKb: number;
}

export const REPORT_TABS: { id: ReportTab; label: string }[] = [
  { id: 'performance', label: 'Performance' },
  { id: 'comparison',  label: 'Comparison'  },
  { id: 'tax',         label: 'Tax summary' },
  { id: 'dividends',   label: 'Dividends'   },
];