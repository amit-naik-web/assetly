import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ReportService } from './services/report.service';
import { PerformanceChart } from './components/performance-chart/performance-chart';
import { ExportHistory } from './components/export-history/export-history';
import {
  PerformanceRow, ExportRecord,
  ReportTab, REPORT_TABS,
} from './models/report.model';
import { PortfolioStore } from '../overview/store/portfolio.store';

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PerformanceChart, ExportHistory],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
  private service = inject(ReportService);
  private portfolioStore = inject(PortfolioStore);

  readonly tabs = REPORT_TABS;
  readonly activeTab  = signal<ReportTab>('performance');
  readonly exporting  = signal(false);
  readonly exportDone = signal(false);

  readonly perfRows    = signal<PerformanceRow[]>([]);
  readonly exportHistory = signal<ExportRecord[]>([]);
  readonly loading     = signal(true);

  readonly kpis = {
    periodReturn: '+$12,841',
    bestPosition: 'MSFT +11.2%',
    worstPosition: 'TSLA -4.8%',
  };

  ngOnInit() {
    this.service.getPerformanceData().subscribe(rows => {
      this.perfRows.set(rows);
      this.loading.set(false);
    });
    this.service.getExportHistory().subscribe(records => {
      this.exportHistory.set(records);
    });
  }

  selectTab(tab: ReportTab) {
    this.activeTab.set(tab);
  }

  exportCsv() {
    this.exporting.set(true);
    this.exportDone.set(false);

    const positions = this.portfolioStore.positions().map((p: any) => ({
      symbol: p.symbol,
      totalValue: p.shares * p.currentPrice,
    }));

    this.service.exportCsv(positions).subscribe(blob => {
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `assetly-export-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      this.exporting.set(false);
      this.exportDone.set(true);
    });
  }
}