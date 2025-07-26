import { HttpErrorResponse } from '@angular/common/http';

/**
 * Shared utility for handling Google API errors consistently across services
 * Consolidates error handling logic that was previously duplicated in multiple services
 */
export class GoogleApiErrorHandler {
  /**
   * Handle API errors and return user-friendly error messages
   * 
   * @param error - The error from the API call
   * @param serviceName - Name of the service for context in error messages
   * @param defaultAction - Default action description for generic error messages
   * @returns User-friendly error message
   */
  static handleApiError(
    error: unknown, 
    serviceName = 'Google service',
    defaultAction = 'complete the operation'
  ): string {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 401:
          return 'Authentication required. Please log in again.';
        case 403:
          return `Insufficient permissions to access ${serviceName}. Please ensure you have the required admin privileges.`;
        case 404:
          return `${serviceName} not found. Please check your Google Workspace configuration.`;
        case 409:
          return 'Quota limit reached. Please try again later or contact your administrator.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Google service temporarily unavailable. Please try again later.';
        default:
          return `Failed to ${defaultAction}: ${error.message || 'Unknown error'}`;
      }
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return `Error: ${(error as Error).message}`;
    }

    return `Failed to ${defaultAction}. Please try again.`;
  }

  /**
   * Handle directory service specific errors
   */
  static handleDirectoryError(error: unknown): string {
    return this.handleApiError(error, 'directory', 'fetch directory data');
  }

  /**
   * Handle enrollment token service specific errors
   */
  static handleEnrollmentTokenError(error: unknown): string {
    return this.handleApiError(error, 'Chrome enrollment tokens', 'manage enrollment tokens');
  }

  /**
   * Handle organizational units service specific errors
   */
  static handleOrgUnitsError(error: unknown): string {
    return this.handleApiError(error, 'organizational units', 'fetch organizational units');
  }

  /**
   * Handle admin role service specific errors
   */
  static handleAdminRoleError(error: unknown): string {
    return this.handleApiError(error, 'admin roles', 'manage admin roles');
  }
}