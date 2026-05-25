import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // TODO: attach Bearer token from AuthStore
  return next(req);
};