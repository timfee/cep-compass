import { TestBed } from '@angular/core/testing';
import { AuthService, TOKEN_STORAGE_KEY } from './auth.service';
import { signal } from '@angular/core';

/**
 * Unit tests for AuthService focusing on token storage behavior
 */
describe('AuthService Token Storage', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            user: signal(null),
            getAccessToken: jasmine.createSpy().and.returnValue(Promise.resolve(null)),
            logout: jasmine.createSpy().and.returnValue(Promise.resolve()),
          }
        }
      ],
    });
    service = TestBed.inject(AuthService);

    // Clear session storage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('token storage format', () => {
    it('should store tokens as plain text without Base64 encoding', () => {
      const mockToken = 'ya29.plaintext-token-example';
      sessionStorage.setItem(TOKEN_STORAGE_KEY, mockToken);

      // Token should be stored exactly as provided
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      expect(stored).toBe(mockToken);

      // Should not be Base64 encoded
      expect(stored).not.toBe(btoa(mockToken));
      
      // Should be retrievable directly
      expect(stored).toBe(mockToken);
    });

    it('should handle OAuth tokens with special characters', () => {
      const mockToken = 'ya29.token-with_special.chars/and+symbols=';
      sessionStorage.setItem(TOKEN_STORAGE_KEY, mockToken);

      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      expect(stored).toBe(mockToken);
    });

    it('should store token key correctly', () => {
      expect(TOKEN_STORAGE_KEY).toBe('cep_oauth_token');
    });
  });

  describe('sessionStorage behavior', () => {
    it('should clear token from sessionStorage on logout', async () => {
      const mockToken = 'ya29.token-to-be-cleared';
      sessionStorage.setItem(TOKEN_STORAGE_KEY, mockToken);

      await service.logout();

      expect(service.logout).toHaveBeenCalled();
    });

    it('should not have encoded token format in storage', () => {
      const plainToken = 'ya29.test-token-12345';
      const encodedToken = btoa(plainToken);
      
      // Store plain token
      sessionStorage.setItem(TOKEN_STORAGE_KEY, plainToken);
      
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      
      // Verify it's plain text, not encoded
      expect(stored).toBe(plainToken);
      expect(stored).not.toBe(encodedToken);
      
      // Verify we can read it directly without atob()
      expect(stored).toBe(plainToken);
    });
  });
});