import { EmailValidator } from './email-validator.utils';

describe('EmailValidator', () => {
  describe('isValid', () => {
    it('should return true for valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'firstname.lastname@company.net',
        'email@123.123.123.123', // IP address
        'user123@example123.com',
        'test_email@example.com',
        'user-name@example.com',
        'a@b.co',
        '1234567890@example.com',
        'email@example-domain.com',
        'test.email.with+symbol@example.com',
        '_______@example.com',
        'email@example.name',
        'email@example.museum',
        'email..email@example.com', // consecutive dots are allowed by this regex
        '.email@example.com', // leading dot is allowed
        'email.@example.com', // trailing dot is allowed
        'email@example..com', // consecutive dots in domain are allowed
      ];

      validEmails.forEach((email) => {
        expect(EmailValidator.isValid(email)).toBe(
          true,
          `Expected ${email} to be valid`,
        );
      });
    });

    it('should return false for invalid email addresses', () => {
      const invalidEmails = [
        'plainaddress',
        'missingatsign.com',
        'missing@.com',
        'missing@domain',
        '@missingdomain.com',
        'spaces in@email.com',
        'email @example.com',
        'email@ example.com',
        'email@example .com',
        'email@',
        '@example.com',
        'email@.com',
        'email@com',
        'email@',
        'email',
        'example.com',
        'email@example',
        'a@b',
        'test@',
        '@test.com',
        'multiple@@example.com', // multiple @ symbols
        'email@example@example.com', // multiple @ symbols
        '', // empty string
        ' ', // just space
      ];

      invalidEmails.forEach((email) => {
        expect(EmailValidator.isValid(email)).toBe(
          false,
          `Expected ${email} to be invalid`,
        );
      });
    });

    it('should return false for non-string types', () => {
      const nonStrings = [
        null,
        undefined,
        123,
        true,
        false,
        [],
        {},
        Symbol('email'),
        new Date(),
        () => 'email@example.com',
      ];

      nonStrings.forEach((value) => {
        expect(EmailValidator.isValid(value)).toBe(
          false,
          `Expected ${typeof value} to be invalid`,
        );
      });
    });

    it('should handle emails with whitespace by trimming', () => {
      const emailsWithWhitespace = [
        '  test@example.com  ',
        '\ttest@example.com\t',
        '\ntest@example.com\n',
        ' test@example.com',
        'test@example.com ',
        '   test@example.com   ',
      ];

      emailsWithWhitespace.forEach((email) => {
        expect(EmailValidator.isValid(email)).toBe(
          true,
          `Expected trimmed ${email} to be valid`,
        );
      });
    });

    it('should return false for empty string after trimming', () => {
      const emptyValues = ['', '   ', '\t', '\n', '\r\n', '\t\n\r  '];

      emptyValues.forEach((value) => {
        expect(EmailValidator.isValid(value)).toBe(
          false,
          `Expected empty value "${value}" to be invalid`,
        );
      });
    });

    it('should handle international domain names', () => {
      const internationalEmails = [
        'test@xn--nxasmq6b.com', // IDN encoded
        'user@example.co.jp',
        'email@example.de',
        'test@domain.edu.au',
        'user@sub.domain.info',
      ];

      internationalEmails.forEach((email) => {
        expect(EmailValidator.isValid(email)).toBe(
          true,
          `Expected international email ${email} to be valid`,
        );
      });
    });

    it('should allow most special characters that are not whitespace or @', () => {
      // The regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/ allows any non-whitespace, non-@ character
      const validSpecialChars = [
        'test<@example.com',
        'test>@example.com',
        'test[@example.com',
        'test]@example.com',
        'test\\@example.com',
        'test,@example.com',
        'test;@example.com',
        'test:@example.com',
        'test"@example.com',
        "test'@example.com",
        'test`@example.com',
        'test~@example.com',
        'test!@example.com',
        'test#@example.com',
        'test$@example.com',
        'test%@example.com',
        'test^@example.com',
        'test&@example.com',
        'test*@example.com',
        'test=@example.com',
        'test?@example.com',
        'test{@example.com',
        'test}@example.com',
        'test|@example.com',
      ];

      validSpecialChars.forEach((email) => {
        expect(EmailValidator.isValid(email)).toBe(
          true,
          `Expected email with special char ${email} to be valid`,
        );
      });
    });
  });
});
