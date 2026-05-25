import { Routes } from '@angular/router';
import { ohlcvResolver } from './features/chart/resolvers/ohlcv.resolve';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    loadComponent: () =>
      import('./features/overview/overview').then(m => m.Overview),
    title: 'Assetly — Overview',
  },
  {
    path: 'prices',
    loadComponent: () =>
      import('./features/price-feed/price-feed').then(m => m.PriceFeed),
    title: 'Assetly — Live Prices',
  },
  {
    path: 'chart/:symbol',
    loadComponent: () =>
      import('./features/chart/chart').then(m => m.Chart),
    resolve: { ohlcv: ohlcvResolver },
    title: 'Assetly — Chart',
  },
  {
    path: 'holdings',
    loadComponent: () =>
      import('./features/holdings/holdings').then(m => m.Holdings),
    title: 'Assetly — Holdings',
  },
  {
    path: 'alerts',
    loadComponent: () =>
      import('./features/alerts/alerts').then(m => m.Alerts),
    title: 'Assetly — Alerts',
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/reports/reports').then(m => m.Reports),
    title: 'Assetly — Reports',
  },
  {
    path: 'prices',
    loadComponent: () =>
      import('./features/price-feed/price-feed').then(m => m.PriceFeed),
    title: 'Assetly — Live Prices',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found').then(m => m.NotFound),
    title: 'Assetly — Not Found',
  },
];