import { Injectable, inject, ErrorHandler } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

/**
 * Centralized notification service using Material Design 3 principles
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Show success notification
   */
  success(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'success-snackbar',
    });
  }

  /**
   * Show error notification
   */
  error(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'error-snackbar',
    });
  }

  /**
   * Show info notification
   */
  info(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'info-snackbar',
    });
  }

  /**
   * Show warning notification
   */
  warning(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'warning-snackbar',
    });
  }
}

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
