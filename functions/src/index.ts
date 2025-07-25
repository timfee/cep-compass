import { initializeApp } from 'firebase-admin/app';
import * as logger from 'firebase-functions/logger';
import { onCall } from 'firebase-functions/v2/https';
import { admin_directory_v1, google } from 'googleapis';

initializeApp();

// --- CONSTANTS ---
const CHROME_ADMIN_PRIVILEGE = 'chrome.management.admin.access';

// --- TYPE DEFINITIONS ---
interface UserRoles {
  isSuperAdmin: boolean;
  isCepAdmin: boolean;
}

interface CustomSchema$User extends admin_directory_v1.Schema$User {
  isSuperAdmin?: boolean;
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
    logger.error('User is not authenticated');
    return { isSuperAdmin: false, isCepAdmin: false };
  }

  try {
    const auth = new google.auth.GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/admin.directory.user.readonly',
        'https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly',
      ],
    });

    const admin: admin_directory_v1.Admin = google.admin({
      version: 'directory_v1',
      auth,
    });

    // Perform three API calls in parallel to get all necessary info
    const [userResult, assignmentsResult, allRolesResult] = await Promise.all([
      admin.users.get({ userKey: userEmail }).catch(() => null),
      admin.roleAssignments.list({ userKey: userEmail }).catch(() => null),
      admin.roles.list({ customer: 'my_customer' }).catch(() => null),
    ]);

    const isSuperAdmin =
      (userResult?.data as CustomSchema$User)?.isSuperAdmin ?? false;

    // Find the role that contains the required privilege
    const cepAdminRole = (
      allRolesResult?.data.items as CustomSchema$Role[]
    )?.find((role) =>
      role.privileges?.some(
        (privilege) => privilege.privilegeName === CHROME_ADMIN_PRIVILEGE,
      ),
    );
    const cepAdminRoleId = cepAdminRole?.roleId ?? null;

    // Check if the user is assigned to the role we just found
    let isCepAdmin = false;
    if (cepAdminRoleId && assignmentsResult?.data.items) {
      isCepAdmin =
        assignmentsResult.data.items.some(
          (assignment) => assignment.roleId === cepAdminRoleId,
        ) ?? false;
    }

    logger.info('Dynamically determined roles:', {
      isSuperAdmin,
      isCepAdmin,
      foundCepRoleId: cepAdminRoleId,
    });

    return { isSuperAdmin, isCepAdmin };
  } catch (error) {
    logger.error('API Error checking admin roles:', error);
    return { isSuperAdmin: false, isCepAdmin: false };
  }
});
