import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  DestroyRef,
  Renderer2,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReportService } from './services/report.service';
import { PerformanceChart } from './components/performance-chart/performance-chart';
import { ExportHistory } from './components/export-history/export-history';
import {
  PerformanceRow, ExportRecord,
  ReportTab, REPORT_TABS,
} from './models/report.model';
import { PortfolioStore } from '../overview/store/portfolio.store';
import { Position } from '../overview/models/portfolio.model';

interface ReportKpi {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
}

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PerformanceChart, ExportHistory],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
  private readonly service = inject(ReportService);
  private readonly portfolioStore = inject(PortfolioStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  readonly tabs = REPORT_TABS;
  readonly activeTab = signal<ReportTab>('performance');
  readonly exporting = signal(false);
  readonly exportDone = signal(false);

  readonly perfRows = signal<PerformanceRow[]>([]);
  readonly exportHistory = signal<ExportRecord[]>([]);
  readonly loading = signal(true);

  readonly kpis = signal<ReportKpi[]>([
    { id: 'period-return', label: 'Period return', value: '+$12,841', trend: 'up' },
    { id: 'best-position', label: 'Best position', value: 'MSFT +11.2%', trend: 'up' },
    { id: 'worst-position', label: 'Worst position', value: 'TSLA -4.8%', trend: 'down' },
  ]);

  ngOnInit() {
    this.service.getPerformanceData().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(rows => {
      this.perfRows.set(rows);
      this.loading.set(false);
    });
    this.service.getExportHistory().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(records => {
      this.exportHistory.set(records);
    });
  }

  selectTab(tab: ReportTab) {
    this.activeTab.set(tab);
  }

  exportCsv() {
    this.exporting.set(true);
    this.exportDone.set(false);

    const positions = this.portfolioStore.positions().map((p: Position) => ({
      symbol: p.symbol,
      totalValue: p.shares * p.currentPrice,
    }));

    this.service.exportCsv(positions).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const link = this.renderer.createElement('a') as HTMLAnchorElement;
      this.renderer.setAttribute(link, 'href', url);
      this.renderer.setAttribute(link, 'download', `assetly-export-${Date.now()}.csv`);
      this.renderer.appendChild(this.document.body, link);
      link.click();
      this.renderer.removeChild(this.document.body, link);
      URL.revokeObjectURL(url);

      this.exporting.set(false);
      this.exportDone.set(true);
    });
  }
}