import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const message =
        err.error?.message ?? `HTTP ${err.status}: ${err.statusText}`;
      console.error('[Assetly HTTP Error]', message);
      return throwError(() => new Error(message));
    })
  );