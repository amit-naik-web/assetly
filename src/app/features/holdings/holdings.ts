import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { HoldingsService } from './services/holdings.service';
import { HoldingsTable } from './components/holdings-table/holdings-table';
import { HoldingRow } from './models/holdings.model';

@Component({
  selector: 'app-holdings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HoldingsTable],
  templateUrl: './holdings.html',
  styleUrl: './holdings.scss',
})
export class Holdings implements OnInit {
  private service = inject(HoldingsService);

  readonly rows    = signal<HoldingRow[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.service.getHoldings().subscribe(rows => {
      this.rows.set(rows);
      this.loading.set(false);
    });
  }
}