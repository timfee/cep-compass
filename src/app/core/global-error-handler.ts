import { Injectable, ErrorHandler } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Global error handler for uncaught exceptions
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  /**
   * Handle uncaught errors
   * @param error - The error to handle
   */
  handleError(error: any): void {
    console.error('Application error:', error);

    // Show stack trace in development only for actual Error objects
    if (!environment.production && error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}