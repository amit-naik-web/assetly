import {
    Component,
    ChangeDetectionStrategy,
    input,
    computed,
    inject,
  } from '@angular/core';
  import { NgClass, TitleCasePipe  } from '@angular/common';
  import { OhlcvCandle, Indicator } from '../../models/chart.model';
  import { ChartService } from '../../services/chart.service';
  
  @Component({
    selector: 'app-indicator-panel',
    standalone: true,
    imports: [NgClass,TitleCasePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './indicator-panel.html',
    styleUrl: './indicator-panel.scss',
  })
  export class IndicatorPanel {
    candles = input.required<OhlcvCandle[]>();
    symbol  = input.required<string>();
  
    private service = inject(ChartService);
  
    readonly currentPrice = computed(() => {
      const c = this.candles();
      return c.length ? c[c.length - 1].close : 0;
    });
  
    readonly indicators = computed<Indicator[]>(() => {
      const c = this.candles();
      if (!c.length) return [];
      const { rsi, sma50, sma200, macd } = this.service.calculateIndicators(c);
      const price = this.currentPrice();
  
      return [
        {
          label: 'RSI (14)',
          value: rsi,
          signal: rsi === null ? 'neutral'
            : rsi > 70 ? 'sell'
            : rsi < 30 ? 'buy'
            : 'neutral',
          formatted: rsi !== null ? rsi.toFixed(1) : '—',
        },
        {
          label: 'MACD',
          value: macd,
          signal: macd === null ? 'neutral' : macd > 0 ? 'buy' : 'sell',
          formatted: macd !== null
            ? `${macd >= 0 ? '+' : ''}${macd.toFixed(2)}`
            : '—',
        },
        {
          label: 'SMA 50',
          value: sma50,
          signal: sma50 === null ? 'neutral' : price > sma50 ? 'buy' : 'sell',
          formatted: sma50 !== null ? `$${sma50.toFixed(2)}` : '—',
        },
        {
          label: 'SMA 200',
          value: sma200,
          signal: sma200 === null ? 'neutral' : price > sma200 ? 'buy' : 'sell',
          formatted: sma200 !== null ? `$${sma200.toFixed(2)}` : '—',
        },
      ];
    });
  }