import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { PortfolioStore } from './store/portfolio.store';
import { PortfolioService } from './services/portfolio.service';
import { KpiCard } from './components/kpi-card/kpi-card';
import { KpiData } from './models/portfolio.model';

@Component({
  selector: 'app-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KpiCard],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class Overview implements OnInit {
  private store   = inject(PortfolioStore);
  private service = inject(PortfolioService);

  readonly loading  = this.store.loading;
  readonly gainers  = this.store.gainers;
  readonly losers   = this.store.losers;

  readonly kpis = signal<KpiData[]>([]);

  ngOnInit() {
    this.store.setLoading(true);
    this.service.getPositions().subscribe(positions => {
      this.store.setPositions(positions);
      this.store.setLoading(false);
      this.kpis.set([
        {
          id: 'total-value',
          label: 'Total Value',
          value: this.store.totalValue(),
          change: this.store.totalReturn(),
          changeLabel: `${this.store.totalReturn() >= 0 ? '+' : ''}$${Math.abs(this.store.totalReturn()).toFixed(0)} all time`,
          trend: this.store.totalReturn() >= 0 ? 'up' : 'down',
          sparkPoints: [40, 55, 45, 70, 60, 80, 100],
        },
        {
          id: 'day-gain',
          label: 'Day Gain',
          value: this.store.dayGain(),
          change: this.store.dayGain(),
          changeLabel: `+$${this.store.dayGain().toFixed(0)} today`,
          trend: 'up',
          sparkPoints: [30, 50, 20, 60, 75, 90, 100],
        },
        {
          id: 'total-return',
          label: 'Total Return',
          value: this.store.totalReturn(),
          change: this.store.totalReturn(),
          changeLabel: `${((this.store.totalReturn() / this.store.totalCost()) * 100).toFixed(1)}% all time`,
          trend: this.store.totalReturn() >= 0 ? 'up' : 'down',
          sparkPoints: [20, 35, 50, 65, 78, 88, 100],
        },
        {
          id: 'day-loss',
          label: 'Day Loss',
          value: this.store.dayLoss(),
          change: this.store.dayLoss(),
          changeLabel: `${this.store.losers()} positions down`,
          trend: 'down',
          sparkPoints: [100, 70, 85, 60, 50, 35, 20],
        },
      ]);
    });
  }
}