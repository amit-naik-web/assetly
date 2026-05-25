import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    loadComponent: () =>
      import('./features/overview/overview/overview').then(m => m.Overview),
    title: 'Assetly — Overview',
  },
  {
    path: 'prices',
    loadComponent: () =>
      import('./features/price-feed/price-feed/price-feed').then(m => m.PriceFeed),
    title: 'Assetly — Live Prices',
  },
  {
    path: 'chart/:symbol',
    loadComponent: () =>
      import('./features/chart/chart/chart').then(m => m.Chart),
    title: 'Assetly — Chart',
  },
  {
    path: 'holdings',
    loadComponent: () =>
      import('./features/holdings/holdings/holdings').then(m => m.Holdings),
    title: 'Assetly — Holdings',
  },
  {
    path: 'alerts',
    loadComponent: () =>
      import('./features/alerts/alerts/alerts').then(m => m.Alerts),
    title: 'Assetly — Alerts',
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/reports/reports/reports').then(m => m.Reports),
    title: 'Assetly — Reports',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found/not-found').then(m => m.NotFound),
    title: 'Assetly — Not Found',
  },
];