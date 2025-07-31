/**
 * Constants for e2e tests
 */

// Timeout constants
export const DEFAULT_TIMEOUT = 30000;
export const AUTH_TIMEOUT = 15000;
export const ROLE_SELECTION_TIMEOUT = 10000;
export const SHORT_TIMEOUT = 5000;

// Local storage keys
export const LOCAL_STORAGE_USER_KEY = 'cep_user';

// Test selectors
export const SELECTORS = {
  GOOGLE_SIGN_IN: 'button:has-text("Sign in with Google")',
  GOOGLE_EMAIL_INPUT: '#identifierId',
  GOOGLE_EMAIL_NEXT: '#identifierNext',
  GOOGLE_PASSWORD_INPUT: 'input[name="password"]',
  GOOGLE_PASSWORD_NEXT: '#passwordNext',
  CONSENT_BUTTONS: 'button:has-text("Allow"), button:has-text("Continue"), button:has-text("Authorize")',
  ROLE_OPTION: '[data-testid="role-option"]',
  LOGOUT_BUTTONS: '[data-testid="logout"], button:has-text("Logout"), button:has-text("Sign out")',
  USER_EMAIL: '[data-testid="user-email"], .user-email',
} as const;

// URL patterns
export const URL_PATTERNS = {
  DASHBOARD_OR_ROLE: /dashboard|select-role/,
  DASHBOARD: /dashboard/,
  LOGIN: /login/,
} as const;