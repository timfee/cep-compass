import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: Error): void {
    // Log error details
    console.error('Global error caught:', error);

    if (environment.production && environment.enableErrorReporting) {
      // In production, you could send errors to a monitoring service
      // Example: Sentry, LogRocket, Firebase Crashlytics, etc.
      this.reportError(error);
    }
  }

  private reportError(error: Error): void {
    // Example implementation - in a real app you'd use your monitoring service
    const errorData = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Here you would send to your error reporting service
    console.warn('Error reported to monitoring service:', errorData);
  }
}