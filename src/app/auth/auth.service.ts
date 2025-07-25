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

export type SelectedRole = 'superAdmin' | 'cepAdmin' | null;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Inject the AngularFire Auth service
  private auth: Auth = inject(Auth);

  // 1. Get user state as an observable from AngularFire's `authState`.
  // 2. Convert that observable to a Signal using `toSignal`.
  public readonly user = toSignal(authState(this.auth), { initialValue: null });

  // This signal holds the roles the user is *allowed* to assume.
  public readonly availableRoles = signal<UserRoles>({
    isSuperAdmin: false,
    isCepAdmin: false,
  });

  // This signal holds the role the user has *chosen* for the session.
  public readonly selectedRole = signal<SelectedRole>(null);

  constructor() {
    // This effect reacts to user login/logout.
    effect(async () => {
      const currentUser = this.user();
      if (currentUser) {
        // If a user is logged in, check what roles they are eligible for.
        await this.updateAvailableRoles(currentUser);
      } else {
        // If logged out, reset everything.
        this.availableRoles.set({ isSuperAdmin: false, isCepAdmin: false });
        this.selectedRole.set(null);
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
      this.availableRoles.set({ isSuperAdmin: false, isCepAdmin: false });
      throw error;
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  /**
   * Sets the user's role for the current session.
   * @param role The role to select.
   */
  selectRole(role: SelectedRole): void {
    if (role === 'superAdmin' && !this.availableRoles().isSuperAdmin) {
      throw new Error('Cannot select Super Admin role: Not available.');
    }
    if (role === 'cepAdmin' && !this.availableRoles().isCepAdmin) {
      throw new Error('Cannot select CEP Admin role: Not available.');
    }
    this.selectedRole.set(role);
  }

  /**
   * Checks roles dynamically by finding the CEP Admin role based on its permissions.
   * This method updates the `availableRoles` signal.
   */
  private async updateAvailableRoles(user: User): Promise<void> {
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

      this.availableRoles.set({ isSuperAdmin, isCepAdmin });
    } catch (error) {
      console.error('API Error checking admin roles:', error);
      this.availableRoles.set({ isSuperAdmin: false, isCepAdmin: false });
    }
  }
}
