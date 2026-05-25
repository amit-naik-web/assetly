import { HttpInterceptorFn } from '@angular/common/http';
import { retry, timer } from 'rxjs';

export const retryInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    retry({
      count: 3,
      delay: (_, attempt) => timer(Math.pow(2, attempt) * 1000),
      resetOnSuccess: true,
    })
  );