import { Injectable } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { VALID_SYMBOLS, MOCK_PRICES } from '../models/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertValidatorService {

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
          return {
            valid: true,
            price: MOCK_PRICES[upper],
          };
        }
        return {
          valid: false,
          message: `"${upper}" not found. Try: AAPL, MSFT, NVDA`,
        };
      })
    );
  }
}