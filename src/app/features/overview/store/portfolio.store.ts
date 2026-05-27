import { computed } from '@angular/core';
import {
    patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Position } from '../models/portfolio.model';
import { getSectorColor } from '../../../shared/sector-colors';

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

    holdingsCount: computed(() => positions().length),

    netDayChange: computed(() =>
      positions().reduce((sum, p) => sum + p.shares * p.dayChange, 0)
    ),

    dayReturnPct: computed(() => {
      const list = positions();
      const value = list.reduce((s, p) => s + p.shares * p.currentPrice, 0);
      const net = list.reduce((s, p) => s + p.shares * p.dayChange, 0);
      const prior = value - net;
      return prior > 0 ? (net / prior) * 100 : 0;
    }),

    totalReturnPct: computed(() => {
      const list = positions();
      const cost = list.reduce((s, p) => s + p.shares * p.avgCost, 0);
      if (cost === 0) return 0;
      const value = list.reduce((s, p) => s + p.shares * p.currentPrice, 0);
      return ((value - cost) / cost) * 100;
    }),

    allocation: computed(() => {
      const total = positions().reduce((s, p) => s + p.shares * p.currentPrice, 0);
      const sectors: Record<string, number> = {};
      positions().forEach(p => {
        const val = p.shares * p.currentPrice;
        sectors[p.sector] = (sectors[p.sector] ?? 0) + val;
      });
      return Object.entries(sectors).map(([label, val], index) => ({
        label,
        pct: Math.round((val / total) * 100),
        color: getSectorColor(label, index),
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