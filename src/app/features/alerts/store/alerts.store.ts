import { computed } from '@angular/core';
import {
  signalStore,
  withComputed,
  withMethods,
  withState,
  patchState,
} from '@ngrx/signals';
import {
  withEntities,
  setEntities,
  addEntity,
  removeEntity,
  updateEntity,
} from '@ngrx/signals/entities';
import { Alert } from '../models/alert.model';

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

  withMethods((store) => ({
    loadAlerts(alerts: Alert[]) {
      patchState(store, setEntities(alerts));
    },

    addAlert(alert: Alert) {
      patchState(store, addEntity(alert));
    },

    removeAlert(id: string) {
      patchState(store, removeEntity(id));
    },

    triggerAlert(id: string) {
      patchState(store, updateEntity({
        id,
        changes: {
          status: 'TRIGGERED',
          triggeredAt: new Date(),
        },
      }));
    },

    dismissAlert(id: string) {
      patchState(store, removeEntity(id));
    },
  }))
);