import {
    Component,
    ChangeDetectionStrategy,
    signal,
    OnInit,
    inject,
  } from '@angular/core';
  import { NgClass } from '@angular/common';
  import { WatchlistItem, MOCK_PRICES } from '../../models/alert.model';
  import { Router } from '@angular/router';
  
  @Component({
    selector: 'app-watchlist',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass],
    templateUrl: './watchlist.html',
    styleUrl: './watchlist.scss',
  })
  export class Watchlist implements OnInit {
    readonly Math = Math;
    private router = inject(Router);
  
    readonly items = signal<WatchlistItem[]>([]);
  
    ngOnInit() {
      this.items.set([
        { symbol: 'META',  companyName: 'Meta Platforms',   price: 583.20, changePct: 1.47  },
        { symbol: 'COIN',  companyName: 'Coinbase',         price: 312.40, changePct: -1.88 },
        { symbol: 'VTI',   companyName: 'Vanguard Total',   price: 284.17, changePct: 0.55  },
        { symbol: 'AMZN',  companyName: 'Amazon',           price: 224.71, changePct: 0.93  },
        { symbol: 'BRK.B', companyName: 'Berkshire B',      price: 541.88, changePct: -0.22 },
      ]);
    }
  
    viewChart(symbol: string) {
      this.router.navigate(['/chart', symbol]);
    }
  }