/**
 * Application-wide constants to eliminate magic numbers and repeated values
 */

/**
 * Cache and timing configuration
 */
export const CACHE_CONFIG = {
  /** Default cache duration in milliseconds (5 minutes) */
  DEFAULT_DURATION: 5 * 60 * 1000,
  /** Token cache duration in milliseconds (1 hour) */
  TOKEN_DURATION: 60 * 60 * 1000,
} as const;

/**
 * API pagination configuration
 */
export const PAGINATION_CONFIG = {
  /** Default page size for user listings */
  USERS_DEFAULT: 100,
  /** Maximum page size for user listings */
  USERS_MAX: 500,
  /** Default page size for group listings */
  GROUPS_DEFAULT: 50,
  /** Maximum page size for group listings */
  GROUPS_MAX: 200,
  /** Default page size for tokens */
  TOKENS_DEFAULT: 100,
  /** Default page size for org units */
  ORG_UNITS_DEFAULT: 100,
} as const;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  MAX_ATTEMPTS: 3,
  /** Base delay for exponential backoff in milliseconds */
  BASE_DELAY: 1000,
  /** Maximum random jitter in milliseconds */
  MAX_JITTER: 1000,
} as const;

/**
 * Token configuration
 */
export const TOKEN_CONFIG = {
  /** Default token expiration in days */
  DEFAULT_EXPIRATION_DAYS: 30,
  /** Number of characters to show when masking tokens */
  MASK_VISIBLE_CHARS: 4,
} as const;

/**
 * Search configuration
 */
export const SEARCH_CONFIG = {
  /** Minimum query length for server-side search */
  MIN_QUERY_LENGTH: 3,
  /** Default search results limit */
  DEFAULT_LIMIT: 200,
} as const;

/**
 * OAuth scope definitions to avoid duplication
 */
export const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/admin.directory.user.readonly',
  'https://www.googleapis.com/auth/admin.directory.group.readonly',
  'https://www.googleapis.com/auth/admin.directory.rolemanagement',
  'https://www.googleapis.com/auth/admin.directory.orgunit.readonly',
  'https://www.googleapis.com/auth/admin.directory.device.chromebrowsers',
] as const;

/**
 * OAuth configuration parameters
 */
export const OAUTH_CONFIG = {
  ACCESS_TYPE: 'offline',
  PROMPT_CONSENT: 'consent',
  PROMPT_NONE: 'none',
} as const;
