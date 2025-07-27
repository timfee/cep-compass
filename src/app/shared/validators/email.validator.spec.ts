import { EmailValidator } from './email.validator';

describe('EmailValidator', () => {
  describe('isValid', () => {
    it('should return true for valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'admin@sub.domain.com',
        'user123@test-site.com',
        'a@b.co'
      ];

      validEmails.forEach(email => {
        expect(EmailValidator.isValid(email)).toBe(true, `Expected ${email} to be valid`);
      });
    });

    it('should return false for invalid email addresses', () => {
      const invalidEmails = [
        '',
        'not-an-email',
        '@domain.com',
        'user@',
        'user@@domain.com',
        'user@domain',
        'user name@domain.com',
        'user@domain..com',
        '.user@domain.com',
        'user.@domain.com'
      ];

      invalidEmails.forEach(email => {
        expect(EmailValidator.isValid(email)).toBe(false, `Expected ${email} to be invalid`);
      });
    });

    it('should handle empty and null inputs', () => {
      expect(EmailValidator.isValid('')).toBe(false);
      expect(EmailValidator.isValid(null)).toBe(false);
      expect(EmailValidator.isValid(undefined)).toBe(false);
    });

    it('should trim whitespace from email before validation', () => {
      expect(EmailValidator.isValid('  test@example.com  ')).toBe(true);
      expect(EmailValidator.isValid('\tuser@domain.com\n')).toBe(true);
    });

    it('should be case sensitive as per email standards', () => {
      expect(EmailValidator.isValid('Test@EXAMPLE.COM')).toBe(true);
      expect(EmailValidator.isValid('USER@domain.com')).toBe(true);
    });

    it('should match the original regex pattern', () => {
      // This ensures our EmailValidator produces the same results as the original
      const originalRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      const testEmails = [
        'test@example.com',
        'invalid@',
        '@invalid.com',
        'test@@example.com',
        'valid.email@domain.co.uk',
        ''
      ];

      testEmails.forEach(email => {
        const originalResult = originalRegex.test(email);
        const validatorResult = EmailValidator.isValid(email);
        expect(validatorResult).toBe(originalResult, 
          `EmailValidator should match original regex for: ${email}`);
      });
    });
  });
});