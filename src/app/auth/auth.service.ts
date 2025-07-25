import { Injectable, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  User,
  authState,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from '@angular/fire/auth';

// --- TYPE DEFINITIONS FOR GOOGLE ADMIN SDK API RESPONSES ---

/** Defines a single permission within a role. */
interface Privilege {
  privilegeName: string;
  serviceId: string;
}

/** Defines a custom admin role. */
interface Role {
  roleId: string;
  roleName: string;
  privileges: Privilege[];
}

/** The response structure for a list of roles. */
interface RolesListResponse {
  items: Role[];
}

/** Defines a user's role assignment. */
interface RoleAssignment {
  roleId: string;
  assignedTo: string;
}

/** The response structure for a list of role assignments. */
interface RoleAssignmentsListResponse {
  items: RoleAssignment[];
}

/** Defines the user object from the Admin SDK. */
interface DirectoryUser {
  isSuperAdmin: boolean;
}

// --- END OF TYPE DEFINITIONS ---

// This interface defines the roles we care about in our app.
export interface UserRoles {
  isSuperAdmin: boolean;
  isCepAdmin: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Inject the AngularFire Auth service
  private auth: Auth = inject(Auth);

  // 1. Get user state as an observable from AngularFire's `authState`.
  // 2. Convert that observable to a Signal using `toSignal`.
  public readonly user = toSignal(authState(this.auth), { initialValue: null });

  // This signal will hold the roles, separate from the user signal.
  public readonly roles = signal<UserRoles>({
    isSuperAdmin: false,
    isCepAdmin: false,
  });

  constructor() {
    // An `effect` is the correct Signal-based way to react to changes and
    // cause side effects, like fetching data. It replaces the constructor logic.
    effect(async () => {
      const currentUser = this.user(); // Get the current value of the user signal
      if (currentUser) {
        // If a user is logged in, perform the role check
        await this.updateAdminRoles(currentUser);
      } else {
        // If logged out, reset roles to default
        this.roles.set({ isSuperAdmin: false, isCepAdmin: false });
      }
    });
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    // Scopes are correct for reading user details, role assignments, and all role definitions
    provider.addScope(
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
    );
    provider.addScope(
      'https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly',
    );

    try {
      await signInWithPopup(this.auth, provider);
      // The effect() will automatically trigger the role check after login.
    } catch (error) {
      console.error('Login failed:', error);
      this.roles.set({ isSuperAdmin: false, isCepAdmin: false });
      throw error;
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  /**
   * Checks roles dynamically by finding the CEP Admin role based on its permissions.
   * This method updates the `roles` signal directly and is now strongly typed.
   */
  private async updateAdminRoles(user: User): Promise<void> {
    try {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const fetchJson = async <T>(url: string): Promise<T> => {
        const response = await fetch(url, { headers });
        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }
        return response.json() as Promise<T>;
      };

      // Perform three API calls in parallel to get all necessary info
      const [userResult, assignmentsResult, allRolesResult] = await Promise.all(
        [
          fetchJson<DirectoryUser>(
            `https://admin.googleapis.com/admin/directory/v1/users/${user.email}`,
          ).catch(() => ({ isSuperAdmin: false })),
          fetchJson<RoleAssignmentsListResponse>(
            `https://admin.googleapis.com/admin/directory/v1/roleassignments?userKey=${user.email}`,
          ).catch(() => ({ items: [] })),
          fetchJson<RolesListResponse>(
            `https://admin.googleapis.com/admin/directory/v1/customer/my_customer/roles`,
          ).catch(() => ({ items: [] })),
        ],
      );

      const isSuperAdmin = userResult.isSuperAdmin || false;

      // --- DYNAMIC ROLE LOOKUP ---
      // The specific permission bit that grants access to Chrome management.
      const CHROME_ADMIN_PRIVILEGE = 'chrome.management.admin.access';

      // Find the role that contains the required privilege
      const cepAdminRole = allRolesResult.items?.find((role: Role) =>
        role.privileges?.some(
          (privilege: Privilege) =>
            privilege.privilegeName === CHROME_ADMIN_PRIVILEGE,
        ),
      );
      const cepAdminRoleId = cepAdminRole ? cepAdminRole.roleId : null;

      // Check if the user is assigned to the role we just found
      let isCepAdmin = false;
      if (cepAdminRoleId) {
        isCepAdmin =
          assignmentsResult.items?.some(
            (assignment: RoleAssignment) =>
              assignment.roleId === cepAdminRoleId,
          ) || false;
      }

      console.log('Dynamically determined roles:', {
        isSuperAdmin,
        isCepAdmin,
        foundCepRoleId: cepAdminRoleId,
      });

      this.roles.set({ isSuperAdmin, isCepAdmin });
    } catch (error) {
      console.error('API Error checking admin roles:', error);
      this.roles.set({ isSuperAdmin: false, isCepAdmin: false });
    }
  }
}
