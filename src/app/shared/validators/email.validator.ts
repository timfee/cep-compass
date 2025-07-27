/**
 * Email validation utilities
 */
export class EmailValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Validates if a value is a valid email address.
   * @param email - The value to validate as an email address. Can be of any type.
   * @returns true if the value is in a valid email format, false otherwise.
   */
  static isValid(email: unknown): boolean {
    if (typeof email !== 'string') return false;
    if (!email) return false;
    return this.EMAIL_REGEX.test(email.trim());
  }
}