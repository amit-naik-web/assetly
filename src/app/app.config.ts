import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withViewTransitions,
  withRouterConfig,
} from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { retryInterceptor } from './core/interceptors/retry.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withViewTransitions(),
      withRouterConfig({ onSameUrlNavigation: 'reload' })
    ),
    provideHttpClient(withFetch(),
    withInterceptors([authInterceptor, retryInterceptor, errorInterceptor])
  ),
    provideClientHydration(withEventReplay()),
  ],
};