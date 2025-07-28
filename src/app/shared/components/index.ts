
export { ErrorDisplayComponent } from './error-display/error-display.component';
export { SkeletonComponent } from './skeleton/skeleton.component';
export { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';

/**
 * Email validation utilities
 */
export class EmailValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  static isValid(email: unknown): boolean {
    if (typeof email !== 'string') return false;
    if (!email) return false;
    return this.EMAIL_REGEX.test(email.trim());
  }
}