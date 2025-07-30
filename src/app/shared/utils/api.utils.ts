/**
 * Shared utilities for API operations to reduce code duplication
 */

import { GOOGLE_API_CONFIG } from '../constants/google-api.constants';
import { PAGINATION_CONFIG } from '../constants/app.constants';

/**
 * Common API URL building utilities
 */
export class ApiUrlBuilder {
  /**
   * Builds a paginated API URL with query parameters
   */
  static buildPaginatedUrl(
    baseUrl: string,
    options: {
      pageToken?: string | null;
      maxResults?: number;
      customerId?: string;
      fields?: string;
      additionalParams?: Record<string, string>;
    } = {},
  ): string {
    const {
      pageToken,
      maxResults,
      customerId = GOOGLE_API_CONFIG.CUSTOMER_ID,
      fields,
      additionalParams = {},
    } = options;

    const params = new URLSearchParams();

    // Add customer ID if provided
    if (customerId) {
      params.set('customer', customerId);
    }

    // Add pagination parameters
    if (maxResults) {
      params.set('maxResults', maxResults.toString());
    }

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    // Add fields parameter for performance optimization
    if (fields) {
      params.set('fields', fields);
    }

    // Add any additional parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Builds a customer-specific API URL
   */
  static buildCustomerUrl(
    endpoint: string,
    version: 'v1' | 'v1.1beta1' = 'v1',
    customerId = GOOGLE_API_CONFIG.CUSTOMER_ID,
  ): string {
    const baseUrl =
      version === 'v1'
        ? GOOGLE_API_CONFIG.BASE_URLS.DIRECTORY_V1
        : GOOGLE_API_CONFIG.BASE_URLS.DIRECTORY_V1_1_BETA;

    return `${baseUrl}/customer/${customerId}/${endpoint}`;
  }
}

/**
 * Common API response validation utilities
 */
export class ApiResponseValidator {
  /**
   * Validates that required fields exist in an API response object.
   *
   * @template T - The expected shape of the API response object. Must extend `Record<string, unknown>`.
   * @param {unknown} data - The API response object to validate.
   * @param {Array<keyof T>} requiredFields - A list of fields that must exist in the object.
   * @param {string} [objectName='API response'] - A name for the object being validated, used in warning messages.
   * @returns {data is T} - Returns `true` if all required fields exist in the object and `data` matches the type `T`.
   *                        Otherwise, returns `false` and logs a warning.
   * @throws {void} - Does not throw exceptions but logs warnings for missing fields or invalid objects.
   */
  static validateRequiredFields<T extends Record<string, unknown>>(
    data: unknown,
    requiredFields: (keyof T)[],
    objectName = 'API response',
  ): data is T {
    if (!data || typeof data !== 'object') {
      console.warn(`${objectName} is not a valid object:`, data);
      return false;
    }

    const obj = data as Record<string, unknown>;
    const missingFields = requiredFields.filter(
      (field) => obj[field as string] === undefined,
    );

    if (missingFields.length > 0) {
      console.warn(
        `${objectName} missing required fields: ${missingFields.join(', ')}`,
        data,
      );
      return false;
    }

    return true;
  }

  /**
   * Validates string field type
   */
  static validateStringField(
    obj: Record<string, unknown>,
    fieldName: string,
  ): boolean {
    const value = obj[fieldName];
    return value === undefined || typeof value === 'string';
  }

  /**
   * Validates boolean field type
   */
  static validateBooleanField(
    obj: Record<string, unknown>,
    fieldName: string,
  ): boolean {
    const value = obj[fieldName];
    return value === undefined || typeof value === 'boolean';
  }

  /**
   * Validates array field type
   */
  static validateArrayField(
    obj: Record<string, unknown>,
    fieldName: string,
  ): boolean {
    const value = obj[fieldName];
    return value === undefined || Array.isArray(value);
  }
}

/**
 * Common data mapping utilities
 */
export class ApiDataMapper {
  /**
   * Maps API response with default values for missing fields
   */
  static mapWithDefaults<T>(
    source: Record<string, unknown>,
    fieldMappings: Record<keyof T, unknown>,
  ): T {
    const result = {} as T;

    Object.entries(fieldMappings).forEach(([key, defaultValue]) => {
      const typedKey = key as keyof T;
      result[typedKey] = (source[key] ?? defaultValue) as T[keyof T];
    });

    return result;
  }

  /**
   * Handles missing required fields gracefully with logging
   */
  static handleMissingFields(
    apiData: Record<string, unknown>,
    requiredFields: string[],
    objectType: string,
  ): void {
    const missingFields = requiredFields.filter((field) => !apiData[field]);

    if (missingFields.length > 0) {
      console.warn(
        `Missing required fields in ${objectType}: ${missingFields.join(', ')}`,
        apiData,
      );
    }
  }
}

/**
 * Common pagination utilities
 */
export class PaginationUtils {
  /**
   * Gets appropriate page size based on data type
   */
  static getPageSize(dataType: 'users' | 'groups' | 'tokens'): number {
    switch (dataType) {
      case 'users':
        return PAGINATION_CONFIG.USERS_DEFAULT;
      case 'groups':
        return PAGINATION_CONFIG.GROUPS_DEFAULT;
      case 'tokens':
        return PAGINATION_CONFIG.TOKENS_DEFAULT;
      default:
        return PAGINATION_CONFIG.USERS_DEFAULT;
    }
  }

  /**
   * Gets maximum allowed page size based on data type
   */
  static getMaxPageSize(dataType: 'users' | 'groups' | 'tokens'): number {
    switch (dataType) {
      case 'users':
        return PAGINATION_CONFIG.USERS_MAX;
      case 'groups':
        return PAGINATION_CONFIG.GROUPS_MAX;
      case 'tokens':
        return PAGINATION_CONFIG.TOKENS_DEFAULT; // No specific max for tokens
      default:
        return PAGINATION_CONFIG.USERS_MAX;
    }
  }

  /**
   * Clamps page size to valid range
   */
  static clampPageSize(
    size: number,
    dataType: 'users' | 'groups' | 'tokens',
  ): number {
    const max = this.getMaxPageSize(dataType);
    return Math.min(size, max);
  }
}
