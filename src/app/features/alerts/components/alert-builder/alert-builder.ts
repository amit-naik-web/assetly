import {
    Component,
    ChangeDetectionStrategy,
    inject,
    signal,
    output,
  } from '@angular/core';
  import {
    NonNullableFormBuilder,
    ReactiveFormsModule,
    Validators,
    AbstractControl,
    ValidationErrors,
  } from '@angular/forms';
  import { NgClass } from '@angular/common';
  import { debounceTime, switchMap, map, first } from 'rxjs/operators';
  import { Observable } from 'rxjs';
  import { AlertValidatorService } from '../../services/alert-validator.service';
  import { AlertsStore } from '../../store/alerts.store';
  import {
    Alert,
    AlertCondition,
    NotifyMethod,
    CONDITION_LABELS,
    MOCK_PRICES,
  } from '../../models/alert.model';
  
  @Component({
    selector: 'app-alert-builder',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, NgClass],
    templateUrl: './alert-builder.html',
    styleUrl: './alert-builder.scss',
  })
  export class AlertBuilder {
    private fb        = inject(NonNullableFormBuilder);
    private validator = inject(AlertValidatorService);
    private store     = inject(AlertsStore);
  
    alertCreated = output<Alert>();
  
    readonly conditionLabels = CONDITION_LABELS;
    readonly conditions = Object.keys(CONDITION_LABELS) as AlertCondition[];
    readonly notifyOptions: NotifyMethod[] = ['TOAST', 'EMAIL', 'BOTH'];
  
    // Validation state signals
    readonly validating     = signal(false);
    readonly symbolValid    = signal<boolean | null>(null);
    readonly symbolPrice    = signal<number | null>(null);
    readonly symbolMessage  = signal('');
  
    readonly form = this.fb.group({
      symbol: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.pattern(/^[A-Z.]{1,6}$/i),
        ],
        asyncValidators: [this.symbolAsyncValidator()],
        updateOn: 'blur',
      }),
      condition: this.fb.control<AlertCondition>('PRICE_ABOVE'),
      targetValue: this.fb.control(0, [
        Validators.required,
        Validators.min(0.01),
      ]),
      notifyVia: this.fb.control<NotifyMethod>('TOAST'),
    });
  
    // Async validator — debounces and validates symbol
    private symbolAsyncValidator() {
      return (ctrl: AbstractControl): Observable<ValidationErrors | null> => {
        this.validating.set(true);
        this.symbolValid.set(null);
  
        return ctrl.valueChanges.pipe(
          debounceTime(400),
          switchMap(value =>
            this.validator.validateSymbol(value as string)
          ),
          map(result => {
            this.validating.set(false);
            if (result.valid) {
              this.symbolValid.set(true);
              this.symbolPrice.set(result.price ?? null);
              this.symbolMessage.set(
                `Valid — current price $${result.price?.toFixed(2)}`
              );
              return null;
            } else {
              this.symbolValid.set(false);
              this.symbolMessage.set(result.message ?? 'Invalid symbol');
              return { invalidSymbol: true };
            }
          }),
          first(),
        );
      };
    }
  
    submit() {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
  
      const { symbol, condition, targetValue, notifyVia } = this.form.getRawValue();
      const upper        = symbol.toUpperCase();
      const currentPrice = MOCK_PRICES[upper] ?? 0;
  
      const alert: Alert = {
        id:          `${upper}-${Date.now()}`,
        symbol:      upper,
        condition,
        targetValue,
        notifyVia,
        status:      'WATCHING',
        currentPrice,
        progressPct: this.calcProgress(currentPrice, targetValue, condition),
        createdAt:   new Date(),
      };
  
      this.store.addAlert(alert);
      this.alertCreated.emit(alert);
      this.form.reset();
      this.symbolValid.set(null);
      this.symbolPrice.set(null);
      this.symbolMessage.set('');
    }
  
    private calcProgress(
      current: number,
      target: number,
      condition: AlertCondition
    ): number {
      if (condition === 'PRICE_ABOVE') {
        return Math.min(Math.round((current / target) * 100), 100);
      }
      if (condition === 'PRICE_BELOW') {
        return Math.min(Math.round((target / current) * 100), 100);
      }
      return 50;
    }
  
    get symbolCtrl() { return this.form.controls.symbol; }
    get targetCtrl()  { return this.form.controls.targetValue; }
  }