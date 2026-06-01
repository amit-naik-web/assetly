import { computed } from '@angular/core';
import {
  signalStore,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import {
  withEntities,
  setEntities,
  addEntity,
  removeEntity,
  updateEntity,
} from '@ngrx/signals/entities';
import { inject } from '@angular/core';
import { Alert } from '../models/alert.model';
import { AlertToastService } from '../../../core/services/alert-toast.service';

export const AlertsStore = signalStore(
  { providedIn: 'root' },
  withEntities<Alert>(),

  withComputed(({ entities }) => ({
    triggered: computed(() =>
      entities().filter(a => a.status === 'TRIGGERED')
    ),
    watching: computed(() =>
      entities().filter(a => a.status === 'WATCHING')
    ),
    triggeredCount: computed(() =>
      entities().filter(a => a.status === 'TRIGGERED').length
    ),
  })),

  withMethods((store) => {
    const alertToast = inject(AlertToastService);

    return {
    loadAlerts(alerts: Alert[]) {
      patchState(store, setEntities(alerts));
    },

    addAlert(alert: Alert) {
      patchState(store, addEntity(alert));
    },

    removeAlert(id: string) {
      patchState(store, removeEntity(id));
    },

    updateWatchingAlert(
      id: string,
      changes: Pick<Alert, 'currentPrice' | 'progressPct'>,
    ) {
      patchState(store, updateEntity({ id, changes }));
    },

    triggerAlert(id: string, currentPrice: number, message: string) {
      const at = new Date();
      const entity = store.entities().find(a => a.id === id);
      const symbol = entity?.symbol ?? '';

      patchState(
        store,
        updateEntity({
          id,
          changes: {
            status: 'TRIGGERED',
            triggeredAt: at,
            currentPrice,
            progressPct: 100,
          },
        }),
      );

      alertToast.show(message, symbol);
    },

    dismissAlert(id: string) {
      patchState(store, removeEntity(id));
    },
  };
  }),
);