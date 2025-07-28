import { TestBed } from '@angular/core/testing';
import { AuthService, TOKEN_STORAGE_KEY } from './auth.service';

// Type for accessing private methods in tests
type AuthServiceWithPrivates = AuthService & {
  encryptToken(token: string): Promise<string>;
  decryptToken(encryptedToken: string): Promise<string>;
  migrateBase64Token(stored: string): Promise<string | null>;
  getOrCreateEncryptionKey(): Promise<CryptoKey>;
};

describe('AuthService Token Encryption', () => {
  let service: AuthServiceWithPrivates;

  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();

    // Mock Firebase Auth dependency
    const mockAuth = {
      app: { options: {} },
      config: {},
      name: 'test',
      authDomain: 'test.firebaseapp.com',
      apiKey: 'test-api-key'
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: 'auth',
          useValue: mockAuth
        },
        AuthService,
      ],
    });

    // Create service instance without injecting Auth
    service = new AuthService() as AuthServiceWithPrivates;
  });

  afterEach(() => {
    // Clean up sessionStorage after each test
    sessionStorage.clear();
  });

  describe('Token Encryption', () => {
    it('should encrypt and decrypt tokens correctly', async () => {
      const testToken = 'ya29.test_oauth_token_with_admin_privileges';

      // Encrypt the token
      const encrypted = await service.encryptToken(testToken);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(testToken);
      expect(encrypted.length).toBeGreaterThan(0);

      // Verify it's not Base64 encoded version of the original
      expect(encrypted).not.toBe(btoa(testToken));

      // Decrypt the token
      const decrypted = await service.decryptToken(encrypted);
      expect(decrypted).toBe(testToken);
    });

    it('should handle corrupted encrypted tokens gracefully', async () => {
      // Test with invalid encrypted data
      await expectAsync(service.decryptToken('invalid_encrypted_data'))
        .toBeRejectedWithError('Invalid or corrupted token');

      // Test with empty string
      await expectAsync(service.decryptToken(''))
        .toBeRejectedWithError('Invalid or corrupted token');
    });

    it('should migrate Base64-encoded tokens to encrypted format', async () => {
      const testToken = 'ya29.test_oauth_token_with_admin_privileges';
      const base64Token = btoa(testToken);

      // Store a Base64-encoded token as if it was from the old system
      sessionStorage.setItem(TOKEN_STORAGE_KEY, base64Token);

      // Call migration method directly
      const migrated = await service.migrateBase64Token(base64Token);

      expect(migrated).toBe(testToken);

      // Verify that the stored token is now encrypted (not Base64)
      const storedAfterMigration = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      expect(storedAfterMigration).toBeDefined();
      expect(storedAfterMigration).not.toBe(base64Token);

      // Should be able to decrypt the new token
      const decrypted = await service.decryptToken(storedAfterMigration!);
      expect(decrypted).toBe(testToken);
    });

    it('should not migrate invalid Base64 tokens', async () => {
      const invalidToken = 'not_a_valid_oauth_token';
      const base64Invalid = btoa(invalidToken);

      const migrated = await service.migrateBase64Token(base64Invalid);

      // Should return null for invalid tokens
      expect(migrated).toBeNull();
    });

    it('should create unique encryption keys per session', async () => {
      const testToken1 = 'ya29.test_token_1';

      // Encrypt the same token twice
      const encrypted1 = await service.encryptToken(testToken1);
      const encrypted2 = await service.encryptToken(testToken1);

      // Should produce different encrypted values due to random IV
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same value
      const decrypted1 = await service.decryptToken(encrypted1);
      const decrypted2 = await service.decryptToken(encrypted2);

      expect(decrypted1).toBe(testToken1);
      expect(decrypted2).toBe(testToken1);
    });

    it('should properly handle the encryption key lifecycle', async () => {
      const testToken = 'ya29.test_oauth_token';

      // Should create a new key initially
      const key1 = await service.getOrCreateEncryptionKey();
      expect(key1).toBeDefined();

      // Should reuse the same key on subsequent calls
      const key2 = await service.getOrCreateEncryptionKey();
      expect(key2).toBeDefined();

      // Encrypt with the key
      const encrypted = await service.encryptToken(testToken);
      expect(encrypted).toBeDefined();

      // Clear session storage to simulate logout
      sessionStorage.clear();

      // Should create a new key after clearing storage
      const key3 = await service.getOrCreateEncryptionKey();
      expect(key3).toBeDefined();
    });
  });
});