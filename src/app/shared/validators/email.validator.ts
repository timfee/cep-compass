/**
 * Email validation utilities
 */
export class EmailValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Validates if a value is a valid email address
   * @param email - The email address to validate
   * @returns true if valid email format
   */
  static isValid(email: unknown): boolean {
    if (typeof email !== 'string' || !email) return false;
    return this.EMAIL_REGEX.test(email.trim());
  }
}