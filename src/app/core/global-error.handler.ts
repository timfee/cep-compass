import { ErrorHandler, Injectable } from '@angular/core';
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
  handleError(error: Error): void {
    console.error('Application error:', error);
    
    // Show stack trace in development only
    if (!environment.production && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}
