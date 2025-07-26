/**
 * Google API constants for Chrome Enterprise Plus (CEP) administration
 *
 * This file centralizes all Google API configuration including:
 * - Service IDs with human-readable names and descriptions
 * - API base URLs and versions
 * - Customer identifiers
 * - Role privilege definitions
 */

/**
 * Google API Service definitions with IDs, names, and descriptions
 */
export const GOOGLE_API_SERVICES = {
  // Organizational Units management
  ORG_UNITS: {
    id: '00haapch16h1ysv',
    name: 'Organizational Units',
    description: 'Manage organizational units and user assignments',
  },

  // Security Center and Data Security services
  SECURITY_CENTER: {
    id: '01egqt2p2p8gvae',
    name: 'Security Center',
    description: 'Activity rules, app admin, and DLP rule management',
  },

  // Access Level Management
  ACCESS_LEVEL: {
    id: '01rvwp1q4axizdr',
    name: 'Access Level Management',
    description: 'Context-aware access level management',
  },

  // Chrome DLP services
  CHROME_DLP: {
    id: '01x0gk371sq486y',
    name: 'Chrome DLP',
    description: 'Chrome Data Loss Prevention settings and insights',
  },

  // DLP Rules (different from Chrome DLP)
  DLP_RULES: {
    id: '01tuee744r4kt8',
    name: 'DLP Rules',
    description: 'Data Loss Prevention rule management and events',
  },

  // Chrome Management (primary Chrome Enterprise service)
  CHROME_MANAGEMENT: {
    id: '02a0gzzo1mc6iq8',
    name: 'Chrome Management',
    description: 'Chrome browsers, profiles, policies, and device management',
  },

  // Alert Center
  ALERT_CENTER: {
    id: '02pta16n3efhw69',
    name: 'Alert Center',
    description: 'Google Workspace security alerts and incidents',
  },

  // Device Management (includes Mobile Device Management)
  DEVICE_MANAGEMENT: {
    id: '03hv69ve4bjwe54',
    name: 'Device Management',
    description: 'Mobile and Chrome device settings management',
  },

  // Chrome Apps
  CHROME_APPS: {
    id: '04f0gzxo3qx17h',
    name: 'Chrome Apps',
    description: 'Chrome application details and management',
  },

  // Reports
  REPORTS: {
    id: '01fob9te2rj6rw9',
    name: 'Reports',
    description: 'Google Workspace administrative reports',
  },
} as const;

/**
 * Google API configuration constants
 */
export const GOOGLE_API_CONFIG = {
  /**
   * Customer identifier for Google Admin APIs
   */
  CUSTOMER_ID: 'my_customer',

  /**
   * Base URLs for Google Admin Directory API
   */
  BASE_URLS: {
    DIRECTORY_V1: 'https://www.googleapis.com/admin/directory/v1',
    DIRECTORY_V1_1_BETA: 'https://www.googleapis.com/admin/directory/v1.1beta1',
  },

  /**
   * API versions
   */
  VERSIONS: {
    STABLE: 'v1',
    BETA: 'v1.1beta1',
  },
} as const;

/**
 * Privilege interface for type safety
 */
export interface Privilege {
  privilegeName: string;
  serviceId: string;
}

/**
 * Chrome Enterprise Plus (CEP) Admin required privileges
 * This is the authoritative list used for both frontend role creation
 * and backend role validation.
 */
export const CEP_ADMIN_PRIVILEGES: Privilege[] = [
  // Organizational Units -> Read
  {
    privilegeName: 'ORGANIZATION_UNITS_RETRIEVE',
    serviceId: GOOGLE_API_SERVICES.ORG_UNITS.id,
  },

  // Security Center -> Activity Rules Full administrative rights
  {
    privilegeName: 'ACTIVITY_RULES',
    serviceId: GOOGLE_API_SERVICES.SECURITY_CENTER.id,
  },
  {
    privilegeName: 'APP_ADMIN',
    serviceId: GOOGLE_API_SERVICES.SECURITY_CENTER.id,
  },

  // Data Security -> Rule Management (DLP -> Manage DLP rule)
  {
    privilegeName: 'MANAGE_GSC_RULE',
    serviceId: GOOGLE_API_SERVICES.SECURITY_CENTER.id,
  },

  // DLP -> View DLP rule
  {
    privilegeName: 'VIEW_GSC_RULE',
    serviceId: GOOGLE_API_SERVICES.SECURITY_CENTER.id,
  },

  // Data Security -> Access Level Management
  {
    privilegeName: 'ACCESS_LEVEL_MANAGEMENT',
    serviceId: GOOGLE_API_SERVICES.ACCESS_LEVEL.id,
  },

  // Chrome Management -> Settings (Mobile Device Management -> Settings)
  {
    privilegeName: 'MANAGE_DEVICE_SETTINGS',
    serviceId: GOOGLE_API_SERVICES.DEVICE_MANAGEMENT.id,
  },

  // Chrome DLP -> Manage Chrome DLP application insights settings
  {
    privilegeName: 'MANAGE_CHROME_INSIGHT_SETTINGS',
    serviceId: GOOGLE_API_SERVICES.CHROME_DLP.id,
  },

  // Chrome DLP -> View and manage Chrome DLP application OCR setting
  {
    privilegeName: 'VIEW_AND_MANAGE_CHROME_OCR_SETTING',
    serviceId: GOOGLE_API_SERVICES.CHROME_DLP.id,
  },

  // Chrome DLP -> View Chrome DLP application insights settings
  {
    privilegeName: 'VIEW_CHROME_INSIGHT_SETTINGS',
    serviceId: GOOGLE_API_SERVICES.CHROME_DLP.id,
  },

  // Mobile Device Management -> Managed Devices
  {
    privilegeName: 'MANAGE_DEVICES',
    serviceId: GOOGLE_API_SERVICES.DEVICE_MANAGEMENT.id,
  },

  // Chrome Enterprise Security Services -> Settings
  {
    privilegeName: 'APP_ADMIN',
    serviceId: GOOGLE_API_SERVICES.DEVICE_MANAGEMENT.id,
  },

  // Alert Center -> Full access
  {
    privilegeName: 'APPS_INCIDENTS_FULL_ACCESS',
    serviceId: GOOGLE_API_SERVICES.ALERT_CENTER.id,
  },

  // Reports -> Main access
  {
    privilegeName: 'REPORTS_ACCESS',
    serviceId: GOOGLE_API_SERVICES.REPORTS.id,
  },
];

/**
 * Utility functions for working with Google API constants
 */
export const GoogleApiUtils = {
  /**
   * Get service information by ID
   */
  getServiceById(serviceId: string) {
    return Object.values(GOOGLE_API_SERVICES).find(
      (service) => service.id === serviceId,
    );
  },

  /**
   * Get all service IDs
   */
  getAllServiceIds(): string[] {
    return Object.values(GOOGLE_API_SERVICES).map((service) => service.id);
  },

  /**
   * Build directory API URL
   */
  buildDirectoryUrl(version: 'v1' | 'v1.1beta1' = 'v1'): string {
    return version === 'v1'
      ? GOOGLE_API_CONFIG.BASE_URLS.DIRECTORY_V1
      : GOOGLE_API_CONFIG.BASE_URLS.DIRECTORY_V1_1_BETA;
  },

  /**
   * Build customer-specific API URL
   */
  buildCustomerUrl(
    endpoint: string,
    version: 'v1' | 'v1.1beta1' = 'v1',
  ): string {
    const baseUrl = this.buildDirectoryUrl(version);
    return `${baseUrl}/customer/${GOOGLE_API_CONFIG.CUSTOMER_ID}/${endpoint}`;
  },
} as const;
