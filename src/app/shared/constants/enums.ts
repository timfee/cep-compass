/**
 * Enums for type safety and to replace string unions throughout the application
 */

/**
 * User roles in the application
 */
export enum UserRole {
  SUPER_ADMIN = 'superAdmin',
  CEP_ADMIN = 'cepAdmin',
}

/**
 * Token states for enrollment tokens
 */
export enum TokenState {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

/**
 * Dashboard card categories
 */
export enum DashboardCategory {
  SETUP = 'setup',
  ENROLLMENT = 'enrollment',
  MANAGEMENT = 'management',
  SECURITY = 'security',
}

/**
 * API call states
 */
export enum ApiState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

/**
 * Email template types
 */
export enum EmailTemplateType {
  BROWSER_ENROLLMENT = 'browser-enrollment',
  PROFILE_ENROLLMENT = 'profile-enrollment',
  ADMIN_NOTIFICATION = 'admin-notification',
}

/**
 * Org unit levels
 */
export enum OrgUnitLevel {
  ROOT = 0,
  FIRST_LEVEL = 1,
  SECOND_LEVEL = 2,
  THIRD_LEVEL = 3,
}

/**
 * Material badge colors
 */
export enum BadgeColor {
  PRIMARY = 'primary',
  ACCENT = 'accent',
  WARN = 'warn',
}

/**
 * Notification types
 */
export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Browser types for enrollment instructions
 */
export enum BrowserType {
  CHROME = 'chrome',
  EDGE = 'edge',
  BRAVE = 'brave',
}

/**
 * Operating system types
 */
export enum OperatingSystem {
  WINDOWS = 'windows',
  MACOS = 'macOS',
  LINUX = 'linux',
}

/**
 * Type guards for enum validation
 */
export const EnumValidators = {
  isUserRole(value: string): value is UserRole {
    return Object.values(UserRole).includes(value as UserRole);
  },

  isTokenState(value: string): value is TokenState {
    return Object.values(TokenState).includes(value as TokenState);
  },

  isDashboardCategory(value: string): value is DashboardCategory {
    return Object.values(DashboardCategory).includes(value as DashboardCategory);
  },

  isEmailTemplateType(value: string): value is EmailTemplateType {
    return Object.values(EmailTemplateType).includes(value as EmailTemplateType);
  },

  isBadgeColor(value: string): value is BadgeColor {
    return Object.values(BadgeColor).includes(value as BadgeColor);
  },
} as const;