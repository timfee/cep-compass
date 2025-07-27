import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { OrgUnitsService } from './org-units.service';
import { GOOGLE_API_CONFIG } from '../shared/constants/google-api.constants';
import { GoogleApiErrorHandler } from '../shared/utils/google-api-error-handler';
import { BaseApiService } from '../core/base-api.service';

/**
 * Represents a Chrome browser enrollment token from Chrome Enterprise API
 */
export interface EnrollmentToken {
  tokenId: string;
  token: string;
  tokenPermanentId: string;
  customerId: string;
  orgUnitPath: string;
  createdTime: string;
  revocationTime?: string;
  state: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expireTime?: string;
}

/**
 * Request payload for creating a new enrollment token
 */
export interface CreateTokenRequest {
  orgUnitPath: string; // Required, from OrgUnit service
  tokenPermanentId?: string; // Optional custom ID
  expireTime?: string; // Optional expiration (ISO 8601 format)
}

/**
 * Response from token creation including helper enrollment URL
 */
export interface TokenCreationResponse {
  token: EnrollmentToken;
  enrollmentUrl: string; // Constructed helper URL
}

/**
 * Response from Chrome Enterprise API for listing enrollment tokens
 */
interface EnrollmentTokensApiResponse {
  enrollmentTokens?: {
    tokenId?: string;
    token?: string;
    tokenPermanentId?: string;
    customerId?: string;
    orgUnitPath?: string;
    createdTime?: string;
    revocationTime?: string;
    state?: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    expireTime?: string;
  }[];
  nextPageToken?: string;
  etag?: string;
}

/**
 * Response from Chrome Enterprise API for creating a token
 */
interface CreateTokenApiResponse {
  tokenId?: string;
  token?: string;
  tokenPermanentId?: string;
  customerId?: string;
  orgUnitPath?: string;
  createdTime?: string;
  state?: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  expireTime?: string;
}

/**
 * Service for managing Chrome browser enrollment tokens using the Chrome Enterprise API
 * Handles token creation, retrieval, and management for browser enrollment
 */
@Injectable({
  providedIn: 'root',
})
export class EnrollmentTokenService extends BaseApiService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly orgUnitsService = inject(OrgUnitsService);

  private readonly API_BASE_URL =
    GOOGLE_API_CONFIG.BASE_URLS.DIRECTORY_V1_1_BETA;

  // Private state signals
  private readonly _tokens = signal<EnrollmentToken[]>([]);

  // Default token expiration (30 days from creation)
  private readonly DEFAULT_EXPIRATION_DAYS = 30;

  /**
   * Signal containing all enrollment tokens
   * Sorted by creation time (newest first)
   */
  public readonly tokens = computed(() => {
    const tokens = this._tokens();
    return [...tokens].sort(
      (a, b) =>
        new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime(),
    );
  });

  /**
   * Signal providing active tokens grouped by organizational unit
   */
  public readonly activeTokensByOu = computed(() => {
    const tokens = this.tokens();
    const activeTokens = tokens.filter((token) => this.isTokenActive(token));

    const tokensByOu = new Map<string, EnrollmentToken[]>();
    activeTokens.forEach((token) => {
      const existing = tokensByOu.get(token.orgUnitPath) || [];
      tokensByOu.set(token.orgUnitPath, [...existing, token]);
    });

    return tokensByOu;
  });

  /**
   * Lists all enrollment tokens, optionally filtered by organizational unit
   * Uses caching to avoid unnecessary API calls
   *
   * @param orgUnitPath - Optional filter by org unit path
   * @returns Promise that resolves to array of enrollment tokens
   */
  async listTokens(orgUnitPath?: string): Promise<EnrollmentToken[]> {
    // Check if we have cached data that's still valid
    if (this.isCacheValid() && !orgUnitPath) {
      return this.tokens();
    }

    // Check if user is authenticated
    const currentUser = this.authService.user();
    if (!currentUser) {
      this.setError('User not authenticated');
      throw new Error('User not authenticated');
    }

    this.setLoading(true);

    try {
      const tokens = await this.fetchAllTokens(orgUnitPath);

      if (!orgUnitPath) {
        // Only cache if we're fetching all tokens
        this._tokens.set(tokens);
        this.updateFetchTime();
      }

      return tokens;
    } catch (error) {
      const errorMessage = this.handleApiError(error);
      this.setError(errorMessage);
      console.error('Failed to fetch enrollment tokens:', error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Creates a new enrollment token for browser enrollment
   * Validates org unit path and checks for existing active tokens
   *
   * @param request - Token creation request parameters
   * @returns Promise that resolves to token creation response
   */
  async createToken(
    request: CreateTokenRequest,
  ): Promise<TokenCreationResponse> {
    // Validate org unit exists
    if (!this.validateOrgUnit(request.orgUnitPath)) {
      throw new Error(`Organizational unit not found: ${request.orgUnitPath}`);
    }

    // Check if user is authenticated
    const currentUser = this.authService.user();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    this.setLoading(true);

    try {
      // Set default expiration if not provided
      let expireTime = request.expireTime;
      if (!expireTime) {
        const now = new Date();
        const expirationDate = new Date(
          now.getTime() + this.DEFAULT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
        );
        expireTime = expirationDate.toISOString();
      }

      const createPayload = {
        orgUnitPath: request.orgUnitPath,
        ...(request.tokenPermanentId && {
          tokenPermanentId: request.tokenPermanentId,
        }),
        expireTime,
      };

      const url = `${this.API_BASE_URL}/customer/${GOOGLE_API_CONFIG.CUSTOMER_ID}/chrome/enrollmentTokens`;

      const response = await firstValueFrom(
        this.http.post<CreateTokenApiResponse>(url, createPayload),
      );

      if (!response) {
        throw new Error('Empty response from Chrome Enterprise API');
      }

      const newToken = this.mapApiResponseToToken(response);

      // Add to cached tokens
      const currentTokens = this._tokens();
      this._tokens.set([...currentTokens, newToken]);

      // Generate enrollment URL
      const enrollmentUrl = this.generateEnrollmentUrl(newToken.token);

      return {
        token: newToken,
        enrollmentUrl,
      };
    } catch (error) {
      const errorMessage = this.handleApiError(error);
      this.setError(errorMessage);
      console.error('Failed to create enrollment token:', error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Revokes an enrollment token by ID
   *
   * @param tokenId - ID of the token to revoke
   * @returns Promise that resolves when revocation is complete
   */
  async revokeToken(tokenId: string): Promise<void> {
    // Check if user is authenticated
    const currentUser = this.authService.user();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    this.setLoading(true);

    try {
      const url = `${this.API_BASE_URL}/customer/${GOOGLE_API_CONFIG.CUSTOMER_ID}/chrome/enrollmentTokens/${tokenId}:revoke`;

      await firstValueFrom(this.http.post(url, {}));

      // Update cached token state
      const currentTokens = this._tokens();
      const updatedTokens = currentTokens.map((token) =>
        token.tokenId === tokenId
          ? {
              ...token,
              state: 'REVOKED' as const,
              revocationTime: new Date().toISOString(),
            }
          : token,
      );
      this._tokens.set(updatedTokens);
    } catch (error) {
      const errorMessage = this.handleApiError(error);
      this.setError(errorMessage);
      console.error('Failed to revoke enrollment token:', error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Gets detailed information about a specific enrollment token
   *
   * @param tokenId - ID of the token to retrieve
   * @returns Promise that resolves to the token details
   */
  async getTokenDetails(tokenId: string): Promise<EnrollmentToken> {
    // First check if we have it in cache
    const cachedTokens = this._tokens();
    const cachedToken = cachedTokens.find((token) => token.tokenId === tokenId);
    if (cachedToken) {
      return cachedToken;
    }

    // If not in cache, fetch all tokens to get the latest data
    const tokens = await this.listTokens();
    const token = tokens.find((t) => t.tokenId === tokenId);

    if (!token) {
      throw new Error(`Enrollment token not found: ${tokenId}`);
    }

    return token;
  }

  /**
   * Generates enrollment instructions for different operating systems
   *
   * @param token - The enrollment token string
   * @returns Formatted enrollment instructions
   */
  generateEnrollmentInstructions(token: string): string {
    return `
Windows: 
1. Run as Administrator: 
   reg add HKLM\\Software\\Policies\\Google\\Chrome\\CloudManagementEnrollmentToken /v CloudManagementEnrollmentToken /t REG_SZ /d ${token} /f
2. Restart Chrome

macOS:
1. Run in Terminal:
   sudo defaults write com.google.Chrome CloudManagementEnrollmentToken -string "${token}"
2. Restart Chrome

Linux:
1. Create file /etc/opt/chrome/policies/managed/enrollment.json:
   {"CloudManagementEnrollmentToken": "${token}"}
2. Restart Chrome
    `.trim();
  }

  /**
   * Checks if a token is currently active
   *
   * @param token - The enrollment token to check
   * @returns True if the token is active
   */
  isTokenActive(token: EnrollmentToken): boolean {
    if (token.state !== 'ACTIVE') {
      return false;
    }

    // Check if token has expired
    if (token.expireTime) {
      const expirationDate = new Date(token.expireTime);
      const now = new Date();
      return now < expirationDate;
    }

    return true;
  }

  /**
   * Gets the expiration date of a token
   *
   * @param token - The enrollment token
   * @returns Expiration date or null if no expiration
   */
  getTokenExpirationDate(token: EnrollmentToken): Date | null {
    return token.expireTime ? new Date(token.expireTime) : null;
  }

  /**
   * Masks token value for display (shows last 4 characters)
   *
   * @param tokenValue - The full token value
   * @returns Masked token string
   */
  maskToken(tokenValue: string): string {
    if (tokenValue.length <= 4) {
      return tokenValue;
    }
    const maskedPart = '*'.repeat(tokenValue.length - 4);
    const visiblePart = tokenValue.slice(-4);
    return `${maskedPart}${visiblePart}`;
  }

  /**
   * Clears the cached enrollment tokens data
   * Forces a fresh fetch on next API call
   */
  clearCache(): void {
    this._tokens.set([]);
    this.clearState();
  }

  /**
   * Fetches all enrollment tokens from the API, handling pagination
   *
   * @param accessToken - OAuth access token for API authentication
   * @param orgUnitPath - Optional filter by org unit path
   * @returns Promise resolving to array of enrollment tokens
   */
  private async fetchAllTokens(
    orgUnitPath?: string,
  ): Promise<EnrollmentToken[]> {
    const allTokens: EnrollmentToken[] = [];
    let pageToken: string | undefined;

    do {
      const url = this.buildApiUrl(pageToken, orgUnitPath);

      const response = await firstValueFrom(
        this.http.get<EnrollmentTokensApiResponse>(url),
      );

      if (response?.enrollmentTokens) {
        const mappedTokens = response.enrollmentTokens.map(
          this.mapApiResponseToToken,
        );
        allTokens.push(...mappedTokens);
      }

      pageToken = response?.nextPageToken;
    } while (pageToken);

    return allTokens;
  }

  /**
   * Builds the API URL for fetching enrollment tokens
   *
   * @param pageToken - Optional page token for pagination
   * @param orgUnitPath - Optional filter by org unit path
   * @returns Complete API URL
   */
  private buildApiUrl(pageToken?: string, orgUnitPath?: string): string {
    const baseUrl = `${this.API_BASE_URL}/customer/${GOOGLE_API_CONFIG.CUSTOMER_ID}/chrome/enrollmentTokens`;
    const params = new URLSearchParams();

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    if (orgUnitPath) {
      params.set('orgUnitPath', orgUnitPath);
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Maps API response object to internal EnrollmentToken interface
   *
   * @param apiToken - Raw enrollment token from API response
   * @returns Mapped EnrollmentToken object
   */
  private mapApiResponseToToken(apiToken: {
    tokenId?: string;
    token?: string;
    tokenPermanentId?: string;
    customerId?: string;
    orgUnitPath?: string;
    createdTime?: string;
    revocationTime?: string;
    state?: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    expireTime?: string;
  }): EnrollmentToken {
    // Validate required fields
    if (!apiToken.tokenId || !apiToken.token || !apiToken.orgUnitPath) {
      console.warn('Missing required fields in API response:', apiToken);
      throw new Error(
        'API response is missing required fields: tokenId, token, or orgUnitPath.',
      );
    }

    return {
      tokenId: apiToken.tokenId,
      token: apiToken.token,
      tokenPermanentId: apiToken.tokenPermanentId || '',
      customerId: apiToken.customerId || '',
      orgUnitPath: apiToken.orgUnitPath,
      createdTime: apiToken.createdTime || new Date().toISOString(),
      revocationTime: apiToken.revocationTime,
      state: apiToken.state || 'ACTIVE',
      expireTime: apiToken.expireTime,
    };
  }

  /**
   * Generates an enrollment URL for easy access
   *
   * @param token - The enrollment token string
   * @returns Enrollment helper URL
   */
  private generateEnrollmentUrl(token: string): string {
    // This could be enhanced to point to an internal enrollment guide page
    const encodedToken = encodeURIComponent(token);
    return `chrome://management/enrollment?token=${encodedToken}`;
  }

  /**
   * Handles API errors and returns user-friendly error messages
   *
   * @param error - Error from HTTP request
   * @returns User-friendly error message
   */
  private handleApiError(error: unknown): string {
    return GoogleApiErrorHandler.handleEnrollmentTokenError(error);
  }

  /**
   * Validates org unit path exists
   *
   * @param orgUnitPath - The org unit path to validate
   * @returns True if org unit exists
   */
  private validateOrgUnit(orgUnitPath: string): boolean {
    const orgUnit = this.orgUnitsService.getOrgUnitByPath(orgUnitPath);
    return !!orgUnit;
  }
}
