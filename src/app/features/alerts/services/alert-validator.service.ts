import { Injectable, inject } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { VALID_SYMBOLS, MOCK_PRICES } from '../models/alert.model';
import { PriceFeedService } from '../../price-feed/services/price-feed.service';

@Injectable({ providedIn: 'root' })
export class AlertValidatorService {
  private readonly priceFeed = inject(PriceFeedService);

  validateSymbol(symbol: string): Observable<{
    valid: boolean;
    price?: number;
    message?: string;
  }> {
    if (!symbol?.trim()) {
      return of({ valid: false, message: 'Symbol is required' });
    }

    const upper = symbol.trim().toUpperCase();

    // Simulate network delay for validation
    return timer(600).pipe(
      map(() => {
        if (VALID_SYMBOLS.includes(upper)) {
          const live = this.priceFeed.prices()[upper]?.price;
          const price = live ?? MOCK_PRICES[upper];
          this.priceFeed.seedHistory(upper, price);
          return { valid: true, price };
        }
        return {
          valid: false,
          message: `"${upper}" not found. Try: AAPL, MSFT, NVDA`,
        };
      })
    );
  }
}