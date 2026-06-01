import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
  output,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { NgClass } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, timer, startWith } from 'rxjs';
import { Observable, of } from 'rxjs';
import { AlertValidatorService } from '../../services/alert-validator.service';
import { AlertsStore } from '../../store/alerts.store';
import { PriceFeedService } from '../../../price-feed/services/price-feed.service';
import { AlertLivePanel } from '../alert-live-panel/alert-live-panel';
import { Alert, AlertCondition, VALID_SYMBOLS } from '../../models/alert.model';
import {
  calcAlertProgress,
  deriveAlertCondition,
} from '../../utils/alert-evaluation.util';
import { AlertEngineService } from '../../services/alert-engine.service';

@Component({
  selector: 'app-alert-builder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgClass, AlertLivePanel],
  templateUrl: './alert-builder.html',
  styleUrl: './alert-builder.scss',
})
export class AlertBuilder {
  private fb = inject(NonNullableFormBuilder);
  private validator = inject(AlertValidatorService);
  private store = inject(AlertsStore);
  private alertEngine = inject(AlertEngineService);
  private priceFeed = inject(PriceFeedService);

  alertCreated = output<Alert>();

  readonly symbolSuggestions = [...VALID_SYMBOLS].sort();

  readonly validating = signal(false);
  private readonly seededSymbol = signal('');
  readonly symbolValid = signal<boolean | null>(null);
  readonly symbolPrice = signal<number | null>(null);
  readonly symbolMessage = signal('');

  readonly form = this.fb.group({
    symbol: this.fb.control('', {
      validators: [
        Validators.required,
        Validators.pattern(/^[A-Z.]{1,6}$/i),
      ],
      asyncValidators: [this.symbolAsyncValidator()],
    }),
    targetValue: this.fb.control(
      { value: 0, disabled: true },
      [Validators.required, Validators.min(0.01)],
    ),
  });

  constructor() {
    effect(() => {
      const ctrl = this.form.controls.targetValue;
      if (this.symbolValid() === true) {
        if (ctrl.disabled) {
          ctrl.enable({ emitEvent: false });
        }
        return;
      }
      if (ctrl.enabled) {
        ctrl.setValue(0);
        ctrl.disable({ emitEvent: false });
      }
    });

    effect(() => {
      const sym = this.activeSymbol();
      const price = this.referencePrice();
      if (!sym || this.symbolValid() !== true || price <= 0) {
        return;
      }
      this.symbolMessage.set(`Valid — live price $${price.toFixed(2)}`);
    });
  }

  readonly panelTarget = toSignal(
    this.form.controls.targetValue.valueChanges.pipe(
      startWith(this.form.controls.targetValue.value),
    ),
    { initialValue: 0 },
  );

  readonly activeSymbol = computed(() => {
    if (this.symbolValid() !== true) {
      return '';
    }
    return this.form.controls.symbol.value.trim().toUpperCase();
  });

  readonly showLivePanel = computed(
    () => this.symbolValid() === true && this.activeSymbol().length > 0,
  );

  readonly referencePrice = computed(() => {
    const sym = this.activeSymbol();
    if (!sym) {
      return 0;
    }
    const live = this.priceFeed.prices()[sym]?.price;
    return live ?? this.symbolPrice() ?? 0;
  });

  readonly targetDeltaPct = computed(() => {
    const current = this.referencePrice();
    const target = this.panelTarget();
    if (current <= 0) {
      return 0;
    }
    return ((target - current) / current) * 100;
  });

  readonly targetDeltaUp = computed(() => this.targetDeltaPct() >= 0);

  readonly derivedCondition = computed((): AlertCondition =>
    deriveAlertCondition(this.panelTarget(), this.referencePrice()),
  );

  readonly targetDeltaLabel = computed(() => {
    const pct = this.targetDeltaPct();
    if (Math.abs(pct) < 0.005) {
      return '0.00%';
    }
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  });

  readonly canClear = computed(
    () =>
      this.form.controls.symbol.value.trim().length > 0 ||
      this.symbolValid() !== null ||
      this.validating(),
  );

  clearForm(): void {
    this.form.reset({ symbol: '', targetValue: 0 });
    this.form.markAsUntouched();
    this.form.markAsPristine();
    this.seededSymbol.set('');
    this.symbolValid.set(null);
    this.symbolPrice.set(null);
    this.symbolMessage.set('');
    this.validating.set(false);
  }

  private symbolAsyncValidator(): AsyncValidatorFn {
    return (ctrl: AbstractControl): Observable<ValidationErrors | null> => {
      const value = ((ctrl.value as string) ?? '').trim();

      if (!value) {
        this.validating.set(false);
        this.symbolValid.set(null);
        this.symbolPrice.set(null);
        this.symbolMessage.set('');
        return of(null);
      }

      this.validating.set(true);
      this.symbolValid.set(null);

      return timer(400).pipe(
        switchMap(() => this.validator.validateSymbol(value)),
        map(result => {
          this.validating.set(false);

          const current = ((ctrl.value as string) ?? '').trim();
          if (current !== value) {
            return null;
          }

          if (result.valid) {
            const upper = current.toUpperCase();
            this.symbolValid.set(true);
            this.symbolPrice.set(result.price ?? null);
            this.symbolMessage.set(
              `Valid — live price $${result.price?.toFixed(2)}`,
            );
            if (this.seededSymbol() !== upper && result.price != null) {
              this.form.controls.targetValue.setValue(result.price);
              this.seededSymbol.set(upper);
            }
            return null;
          }

          this.symbolValid.set(false);
          this.symbolPrice.set(null);
          this.seededSymbol.set('');
          this.symbolMessage.set(result.message ?? 'Invalid symbol');
          return { invalidSymbol: true };
        }),
      );
    };
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { symbol, targetValue } = this.form.getRawValue();
    const upper = symbol.toUpperCase();
    const currentPrice = this.referencePrice();
    const condition = deriveAlertCondition(targetValue, currentPrice);

    const alert: Alert = {
      id: `${upper}-${Date.now()}`,
      symbol: upper,
      condition,
      targetValue,
      notifyVia: 'TOAST',
      status: 'WATCHING',
      currentPrice,
      progressPct: calcAlertProgress(currentPrice, targetValue, condition),
      createdAt: new Date(),
    };

    this.store.addAlert(alert);
    this.alertEngine.evaluateNewAlert(alert);
    this.alertCreated.emit(alert);
    this.clearForm();
  }

  get symbolCtrl() {
    return this.form.controls.symbol;
  }
  get targetCtrl() {
    return this.form.controls.targetValue;
  }
}
