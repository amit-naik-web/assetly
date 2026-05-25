import { computed } from '@angular/core';
import {
    patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Position } from '../models/portfolio.model';

interface PortfolioState {
  positions: Position[];
  loading: boolean;
  error: string | null;
}

const initialState: PortfolioState = {
  positions: [],
  loading: false,
  error: null,
};

export const PortfolioStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ positions }) => ({

    totalValue: computed(() =>
      positions().reduce((sum, p) => sum + p.shares * p.currentPrice, 0)
    ),

    totalCost: computed(() =>
      positions().reduce((sum, p) => sum + p.shares * p.avgCost, 0)
    ),

    totalReturn: computed(() => {
      const cost  = positions().reduce((s, p) => s + p.shares * p.avgCost, 0);
      const value = positions().reduce((s, p) => s + p.shares * p.currentPrice, 0);
      return value - cost;
    }),

    dayGain: computed(() =>
      positions()
        .filter(p => p.dayChangePct > 0)
        .reduce((sum, p) => sum + p.shares * p.dayChange, 0)
    ),

    dayLoss: computed(() =>
      positions()
        .filter(p => p.dayChangePct < 0)
        .reduce((sum, p) => sum + p.shares * p.dayChange, 0)
    ),

    gainers: computed(() =>
      positions().filter(p => p.dayChangePct > 0).length
    ),

    losers: computed(() =>
      positions().filter(p => p.dayChangePct < 0).length
    ),

    allocation: computed(() => {
      const total = positions().reduce((s, p) => s + p.shares * p.currentPrice, 0);
      const sectors: Record<string, number> = {};
      positions().forEach(p => {
        const val = p.shares * p.currentPrice;
        sectors[p.sector] = (sectors[p.sector] ?? 0) + val;
      });
      const colors: Record<string, string> = {
        'Technology': '#378ADD',
        'Financials':  '#1D9E75',
        'Automotive':  '#EF9F27',
        'Healthcare':  '#7F77DD',
        'Energy':      '#E24B4A',
      };
      return Object.entries(sectors).map(([label, val]) => ({
        label,
        pct: Math.round((val / total) * 100),
        color: colors[label] ?? '#D3D1C7',
      }));
    }),

  })),

  withMethods((store) => ({
    setPositions(positions: Position[]) {
      patchState(store, { positions });
    },
    setLoading(loading: boolean) {
      patchState(store, { loading });
    },
    setError(error: string | null) {
      patchState(store, { error });
    },
  }))
);