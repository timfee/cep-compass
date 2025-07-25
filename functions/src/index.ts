import { initializeApp } from 'firebase-admin/app';
import * as logger from 'firebase-functions/logger';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin_directory_v1, google } from 'googleapis';

initializeApp();

// --- CONSTANTS ---
// This list defines the exact set of privileges required for a user to be
// considered a Chrome Enterprise Plus (CEP) delegated admin. A user must have
// ALL of these privileges. Each privilege is defined by its unique name and
// the service it belongs to, as mapped from the user-provided table and JSON.
const REQUIRED_CEP_ADMIN_PRIVILEGES = [
  // Table: Google Admin Console Privileges
  // Privilege Area: Organizational Units -> Permission: Read
  // API Privilege: Organizational Units -> Read
  { privilegeName: 'ORGANIZATION_UNITS_RETRIEVE', serviceId: '00haapch16h1ysv' },

  // Privilege Area: Security Center -> Permission: Activity Rules Full administrative rights for Security Center
  { privilegeName: 'ACTIVITY_RULES', serviceId: '01egqt2p2p8gvae' },
  { privilegeName: 'APP_ADMIN', serviceId: '01egqt2p2p8gvae' },

  // Privilege Area: Data Security -> Permission: Rule Management
  // Also covers: DLP -> Manage DLP rule
  { privilegeName: 'MANAGE_GSC_RULE', serviceId: '01egqt2p2p8gvae' },

  // Privilege Area: DLP -> Permission: View DLP rule
  { privilegeName: 'VIEW_GSC_RULE', serviceId: '01egqt2p2p8gvae' },

  // Privilege Area: Data Security -> Permission: Access Level Management
  { privilegeName: 'ACCESS_LEVEL_MANAGEMENT', serviceId: '01rvwp1q4axizdr' },

  // Privilege Area: Chrome Management -> Permission: Settings
  // Also covers: Mobile Device Management -> Settings
  { privilegeName: 'MANAGE_DEVICE_SETTINGS', serviceId: '03hv69ve4bjwe54' },

  // Privilege Area: Chrome DLP -> Permission: Manage Chrome DLP application insights settings
  { privilegeName: 'MANAGE_CHROME_INSIGHT_SETTINGS', serviceId: '01x0gk371sq486y' },

  // Privilege Area: Chrome DLP -> Permission: View and manage Chrome DLP application OCR setting
  { privilegeName: 'VIEW_AND_MANAGE_CHROME_OCR_SETTING', serviceId: '01x0gk371sq486y' },

  // Privilege Area: Chrome DLP -> Permission: View Chrome DLP application insights settings
  { privilegeName: 'VIEW_CHROME_INSIGHT_SETTINGS', serviceId: '01x0gk371sq486y' },

  // Privilege Area: Mobile Device Management -> Permission: Managed Devices
  { privilegeName: 'MANAGE_DEVICES', serviceId: '03hv69ve4bjwe54' },

  // Privilege Area: Chrome Enterprise Security Services -> Permission: Settings
  { privilegeName: 'APP_ADMIN', serviceId: '03hv69ve4bjwe54' },

  // Privilege Area: Alert Center -> Permission: Full access
  { privilegeName: 'APPS_INCIDENTS_FULL_ACCESS', serviceId: '02pta16n3efhw69' },

  // Privilege Area: Reports -> Permission: (Select the main checkbox to grant access)
  { privilegeName: 'REPORTS_ACCESS', serviceId: '01fob9te2rj6rw9' },
];

// --- TYPE DEFINITIONS ---
interface Privilege {
  privilegeName: string;
  serviceId: string;
}

interface UserRoles {
  isSuperAdmin: boolean;
  isCepAdmin: boolean;
  missingPrivileges?: Privilege[];
}

interface CustomSchema$Role extends admin_directory_v1.Schema$Role {
  privileges?: {
    privilegeName?: string;
    serviceId?: string;
  }[];
}

export const getRoles = onCall(async (request): Promise<UserRoles> => {
  const userEmail = request.auth?.token.email;

  if (!userEmail) {
    throw new HttpsError('unauthenticated', 'User is not authenticated.');
  }

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/admin.directory.user.readonly',
        'https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly',
      ],
    });

    const admin = google.admin({
      version: 'directory_v1',
      auth,
    });

    const userRes = await admin.users.get({ userKey: userEmail });
    const isSuperAdmin = userRes.data.isAdmin ?? false;

    if (isSuperAdmin) {
      logger.info(`User ${userEmail} is a super admin.`);
      return { isSuperAdmin: true, isCepAdmin: true };
    }

    const assignmentsRes = await admin.roleAssignments.list({
      userKey: userEmail,
      customer: 'my_customer',
    });
    const roleAssignments = assignmentsRes.data.items;

    if (!roleAssignments || roleAssignments.length === 0) {
      logger.info(`User ${userEmail} has no assigned roles.`);
      return {
        isSuperAdmin: false,
        isCepAdmin: false,
        missingPrivileges: REQUIRED_CEP_ADMIN_PRIVILEGES,
      };
    }

    const rolePromises = roleAssignments
      .map((assignment) => assignment.roleId)
      .filter((roleId): roleId is string => !!roleId)
      .map((roleId) =>
        admin.roles.get({ customer: 'my_customer', roleId })
      );

    const roles = await Promise.all(rolePromises);

    const userPrivileges = new Set<string>();
    for (const role of roles) {
      const customRole = role.data as CustomSchema$Role;
      if (customRole.privileges) {
        for (const p of customRole.privileges) {
          if (p.privilegeName && p.serviceId) {
            userPrivileges.add(`${p.privilegeName}:${p.serviceId}`);
          }
        }
      }
    }

    const missingPrivileges = REQUIRED_CEP_ADMIN_PRIVILEGES.filter((req) => {
      const requiredKey = `${req.privilegeName}:${req.serviceId}`;
      return !userPrivileges.has(requiredKey);
    });

    const isCepAdmin = missingPrivileges.length === 0;

    logger.info(`Roles for ${userEmail}`, { isSuperAdmin, isCepAdmin });

    if (isCepAdmin) {
      return { isSuperAdmin, isCepAdmin };
    } else {
      return { isSuperAdmin, isCepAdmin, missingPrivileges };
    }
  } catch (error) {
    logger.error('API Error checking admin roles:', error);
    throw new HttpsError('internal', 'Error checking admin roles.', error);
  }
});