import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.obtenerToken();

  const reqConToken = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(reqConToken).pipe(
    catchError((error: unknown) => {
      const esLogin = req.url.includes('/auth/login');

      if (error instanceof HttpErrorResponse && error.status === 401 && !esLogin) {
        authService.logout();
        router.navigate(['/login'], { queryParams: { sesionExpirada: true } });
      }

      return throwError(() => error);
    }),
  );
};
