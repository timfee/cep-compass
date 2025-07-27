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
