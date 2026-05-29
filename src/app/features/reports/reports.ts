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
import { PerformanceRow } from './models/report.model';
import { PortfolioStore } from '../overview/store/portfolio.store';
import { Position } from '../overview/models/portfolio.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PerformanceChart],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
  private readonly service = inject(ReportService);
  private readonly portfolioStore = inject(PortfolioStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  readonly exporting = signal(false);
  readonly exportDone = signal(false);

  readonly perfRows = signal<PerformanceRow[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.service.getPerformanceData().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(rows => {
      this.perfRows.set(rows);
      this.loading.set(false);
    });
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
