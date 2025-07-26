import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import {
  EnrollmentTokenService,
  EnrollmentToken,
  CreateTokenRequest,
} from './enrollment-token.service';
import { AuthService } from './auth.service';
import { OrgUnitsService, OrgUnit } from './org-units.service';

describe('EnrollmentTokenService', () => {
  let service: EnrollmentTokenService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let orgUnitsServiceSpy: jasmine.SpyObj<OrgUnitsService>;

  const mockUser = { uid: 'test-user', email: 'test@example.com' };
  const mockAccessToken = 'mock-access-token';

  const mockOrgUnit: OrgUnit = {
    orgUnitPath: '/Engineering',
    orgUnitId: 'ou-123',
    name: 'Engineering',
    description: 'Engineering department',
  };

  const mockEnrollmentToken: EnrollmentToken = {
    tokenId: 'token-123',
    token: 'enrollment-token-abc123',
    tokenPermanentId: 'perm-123',
    customerId: 'customer-123',
    orgUnitPath: '/Engineering',
    createdTime: '2024-01-15T10:00:00Z',
    state: 'ACTIVE',
    expireTime: '2024-02-15T10:00:00Z',
  };

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', [
      'user',
      'getAccessToken',
    ]);
    const orgUnitsSpy = jasmine.createSpyObj('OrgUnitsService', [
      'getOrgUnitByPath',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EnrollmentTokenService,
        { provide: AuthService, useValue: authSpy },
        { provide: OrgUnitsService, useValue: orgUnitsSpy },
      ],
    });

    service = TestBed.inject(EnrollmentTokenService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    orgUnitsServiceSpy = TestBed.inject(
      OrgUnitsService,
    ) as jasmine.SpyObj<OrgUnitsService>;

    // Setup default spy returns
    authServiceSpy.user.and.returnValue(mockUser as never);
    authServiceSpy.getAccessToken.and.returnValue(
      Promise.resolve(mockAccessToken),
    );
    orgUnitsServiceSpy.getOrgUnitByPath.and.returnValue(mockOrgUnit);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('basic functionality', () => {
    it('should provide tokens signal', () => {
      expect(service.tokens).toBeDefined();
      expect(service.tokens()).toEqual([]);
    });

    it('should provide activeTokensByOu signal', () => {
      expect(service.activeTokensByOu).toBeDefined();
      expect(service.activeTokensByOu()).toBeInstanceOf(Map);
    });

    it('should provide isLoading signal', () => {
      expect(service.isLoading).toBeDefined();
      expect(service.isLoading()).toBe(false);
    });

    it('should provide error signal', () => {
      expect(service.error).toBeDefined();
      expect(service.error()).toBeNull();
    });
  });

  describe('generateEnrollmentInstructions', () => {
    it('should generate instructions for all platforms', () => {
      const token = 'test-token-123';
      const instructions = service.generateEnrollmentInstructions(token);

      expect(instructions).toContain('Windows:');
      expect(instructions).toContain('macOS:');
      expect(instructions).toContain('Linux:');
      expect(instructions).toContain(token);
      expect(instructions).toContain('reg add HKLM');
      expect(instructions).toContain('sudo defaults write');
      expect(instructions).toContain('enrollment.json');
    });
  });

  describe('isTokenActive', () => {
    it('should return true for active non-expired token', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const activeToken: EnrollmentToken = {
        ...mockEnrollmentToken,
        state: 'ACTIVE',
        expireTime: futureDate.toISOString(),
      };

      expect(service.isTokenActive(activeToken)).toBe(true);
    });

    it('should return false for revoked token', () => {
      const revokedToken: EnrollmentToken = {
        ...mockEnrollmentToken,
        state: 'REVOKED',
      };

      expect(service.isTokenActive(revokedToken)).toBe(false);
    });

    it('should return false for expired token', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const expiredToken: EnrollmentToken = {
        ...mockEnrollmentToken,
        state: 'ACTIVE',
        expireTime: pastDate.toISOString(),
      };

      expect(service.isTokenActive(expiredToken)).toBe(false);
    });

    it('should return true for active token without expiration', () => {
      const noExpirationToken: EnrollmentToken = {
        ...mockEnrollmentToken,
        state: 'ACTIVE',
        expireTime: undefined,
      };

      expect(service.isTokenActive(noExpirationToken)).toBe(true);
    });
  });

  describe('getTokenExpirationDate', () => {
    it('should return expiration date when expireTime is set', () => {
      const token: EnrollmentToken = {
        ...mockEnrollmentToken,
        expireTime: '2024-02-15T10:00:00Z',
      };

      const result = service.getTokenExpirationDate(token);
      expect(result).toEqual(new Date('2024-02-15T10:00:00Z'));
    });

    it('should return null when expireTime is not set', () => {
      const token: EnrollmentToken = {
        ...mockEnrollmentToken,
        expireTime: undefined,
      };

      const result = service.getTokenExpirationDate(token);
      expect(result).toBeNull();
    });
  });

  describe('maskToken', () => {
    it('should mask long tokens showing only last 4 characters', () => {
      const token = 'very-long-enrollment-token-123456';
      const masked = service.maskToken(token);

      expect(masked).toBe('*****************************3456');
      expect(masked.slice(-4)).toBe('3456');
    });

    it('should return original token if 4 characters or less', () => {
      const shortToken = 'abc';
      const masked = service.maskToken(shortToken);

      expect(masked).toBe('abc');
    });

    it('should handle exactly 4 character tokens', () => {
      const token = 'abcd';
      const masked = service.maskToken(token);

      expect(masked).toBe('abcd');
    });
  });

  describe('computed signals', () => {
    it('should compute activeTokensByOu correctly', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const activeToken: EnrollmentToken = {
        ...mockEnrollmentToken,
        tokenId: 'active-1',
        state: 'ACTIVE',
        expireTime: futureDate.toISOString(),
      };

      const revokedToken: EnrollmentToken = {
        ...mockEnrollmentToken,
        tokenId: 'revoked-1',
        state: 'REVOKED',
        orgUnitPath: '/Marketing',
      };

      const expiredToken: EnrollmentToken = {
        ...mockEnrollmentToken,
        tokenId: 'expired-1',
        state: 'ACTIVE',
        expireTime: '2020-01-01T00:00:00Z',
        orgUnitPath: '/Sales',
      };

      service['_tokens'].set([activeToken, revokedToken, expiredToken]);

      const activeTokensByOu = service.activeTokensByOu();

      expect(activeTokensByOu.size).toBe(1);
      expect(activeTokensByOu.has('/Engineering')).toBe(true);
      expect(activeTokensByOu.get('/Engineering')).toEqual([activeToken]);
      expect(activeTokensByOu.has('/Marketing')).toBe(false);
      expect(activeTokensByOu.has('/Sales')).toBe(false);
    });

    it('should sort tokens by creation time (newest first)', () => {
      const olderToken: EnrollmentToken = {
        ...mockEnrollmentToken,
        tokenId: 'older',
        createdTime: '2024-01-01T10:00:00Z',
      };

      const newerToken: EnrollmentToken = {
        ...mockEnrollmentToken,
        tokenId: 'newer',
        createdTime: '2024-01-15T10:00:00Z',
      };

      service['_tokens'].set([olderToken, newerToken]);

      const sortedTokens = service.tokens();
      expect(sortedTokens[0].tokenId).toBe('newer');
      expect(sortedTokens[1].tokenId).toBe('older');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', () => {
      service['_tokens'].set([mockEnrollmentToken]);
      service['_lastFetchTime'].set(Date.now());
      service['_error'].set('Some error');

      service.clearCache();

      expect(service.tokens()).toEqual([]);
      expect(service['_lastFetchTime']()).toBeNull();
      expect(service.error()).toBeNull();
    });
  });

  describe('authentication checks', () => {
    it('should reject operations when user is not authenticated', async () => {
      authServiceSpy.user.and.returnValue(null);

      await expectAsync(service.listTokens()).toBeRejectedWithError(
        'User not authenticated',
      );
    });
  });

  describe('org unit validation', () => {
    it('should validate org unit exists before creating token', async () => {
      orgUnitsServiceSpy.getOrgUnitByPath.and.returnValue(undefined);

      const createRequest: CreateTokenRequest = {
        orgUnitPath: '/NonExistent',
      };

      await expectAsync(
        service.createToken(createRequest),
      ).toBeRejectedWithError('Organizational unit not found: /NonExistent');
    });
  });
});
