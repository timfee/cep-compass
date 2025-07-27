import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept Google API calls
  if (!req.url.includes('googleapis.com')) {
    return next(req);
  }

  const authService = inject(AuthService);

  return from(authService.getAccessToken()).pipe(
    switchMap(token => {
      if (!token) {
        return throwError(() => new Error('No access token available'));
      }
      
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return next(authReq);
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired - clear storage and redirect to login
        sessionStorage.removeItem('cep_oauth_token');
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};