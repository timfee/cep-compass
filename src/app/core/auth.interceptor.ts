import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, throwError } from 'rxjs';
import { switchMap, catchError, concatMap } from 'rxjs/operators';
import { AuthService, TOKEN_STORAGE_KEY } from '../services/auth.service';
import { NotificationService } from './notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept Google API calls
  if (!req.url.includes('googleapis.com')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);

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
        // Attempt token refresh on 401 errors
        console.log('Access token expired, attempting refresh...');
        notificationService.info('Refreshing authentication...');
        
        return from(authService.refreshAccessToken()).pipe(
          concatMap(refreshedToken => {
            if (refreshedToken) {
              // Retry the original request with the new token
              console.log('Token refreshed successfully, retrying request...');
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${refreshedToken}`,
                  'Content-Type': 'application/json'
                }
              });
              return next(retryReq);
            } else {
              // Token refresh failed - clear storage and logout
              console.warn('Token refresh failed, logging out user');
              notificationService.error('Session expired. Please sign in again.');
              sessionStorage.removeItem(TOKEN_STORAGE_KEY);
              authService.logout();
              return throwError(() => new Error('Authentication refresh failed'));
            }
          }),
          catchError((refreshError: HttpErrorResponse) => {
            // If the retry also fails, check if it's another 401
            if (refreshError.status === 401) {
              console.error('Token refresh succeeded but retry still failed with 401, logging out user');
              notificationService.error('Session expired. Please sign in again.');
              sessionStorage.removeItem(TOKEN_STORAGE_KEY);
              authService.logout();
              return throwError(() => new Error('Authentication failed after refresh'));
            }
            // For other errors, just pass them through
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};