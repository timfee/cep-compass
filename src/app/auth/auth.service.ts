import { Injectable, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  GoogleAuthProvider,
  authState,
  signInWithPopup,
  signOut,
} from '@angular/fire/auth';

// --- TYPE DEFINITIONS ---
export interface Privilege {
  privilegeName: string;
  serviceId: string;
}

export interface UserRoles {
  isSuperAdmin: boolean;
  isCepAdmin: boolean;
  missingPrivileges?: Privilege[];
}

export type SelectedRole = 'superAdmin' | 'cepAdmin' | null;

const ROLE_STORAGE_KEY = 'cep_selected_role';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private accessToken: string | null = null;

  public readonly user = toSignal(authState(this.auth), { initialValue: null });

  // This signal holds the roles the user is *allowed* to assume.
  public readonly availableRoles = signal<UserRoles>({
    isSuperAdmin: false,
    isCepAdmin: false,
    missingPrivileges: [],
  });

  // This signal holds the role the user has *chosen* for the session.
  public readonly selectedRole = signal<SelectedRole>(
    (localStorage.getItem(ROLE_STORAGE_KEY) as SelectedRole) ?? null,
  );

  constructor() {
    // This effect reacts to user login/logout.
    effect(async () => {
      const currentUser = this.user();
      if (currentUser) {
        await this.updateAvailableRoles();
      } else {
        // If logged out, reset everything and clear storage.
        this.accessToken = null;
        this.availableRoles.set({
          isSuperAdmin: false,
          isCepAdmin: false,
          missingPrivileges: [],
        });
        this.selectedRole.set(null);
        localStorage.removeItem(ROLE_STORAGE_KEY);
      }
    });

    // This effect persists the selected role to localStorage.
    effect(() => {
      const role = this.selectedRole();
      if (role) {
        localStorage.setItem(ROLE_STORAGE_KEY, role);
      } else {
        localStorage.removeItem(ROLE_STORAGE_KEY);
      }
    });
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    provider.addScope(
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
    );
    provider.addScope(
      'https://www.googleapis.com/auth/admin.directory.group.readonly',
    );
    provider.addScope(
      'https://www.googleapis.com/auth/admin.directory.rolemanagement',
    );
    provider.addScope(
      'https://www.googleapis.com/auth/admin.directory.orgunit.readonly',
    );
    provider.addScope(
      'https://www.googleapis.com/auth/admin.directory.device.chromebrowsers',
    );

    // Add custom parameters to ensure we get a refresh token
    provider.setCustomParameters({
      access_type: 'offline',
      prompt: 'consent',
    });

    try {
      const result = await signInWithPopup(this.auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        this.accessToken = credential.accessToken;
      }
    } catch (error) {
      console.error('Login failed:', error);
      this.availableRoles.set({
        isSuperAdmin: false,
        isCepAdmin: false,
        missingPrivileges: [],
      });
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.accessToken = null;
    await signOut(this.auth);
  }

  selectRole(role: SelectedRole): void {
    if (role === 'superAdmin' && !this.availableRoles().isSuperAdmin) {
      throw new Error('Cannot select Super Admin role: Not available.');
    }
    if (role === 'cepAdmin' && !this.availableRoles().isCepAdmin) {
      throw new Error('Cannot select CEP Admin role: Not available.');
    }
    this.selectedRole.set(role);
  }

  async getAccessToken(): Promise<string | null> {
    const currentUser = this.user();
    if (!currentUser) {
      return null;
    }

    // Return stored access token if available
    if (this.accessToken) {
      return this.accessToken;
    }

    // Don't automatically re-authenticate - just return null
    // This prevents the popup spam issue
    console.warn('No OAuth access token available. User needs to sign in again.');
    return null;
  }

  private async updateAvailableRoles(): Promise<void> {
    try {
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const userEmail = this.user()?.email;
      if (!userEmail) {
        throw new Error('No user email available');
      }

      // Check if user is super admin
      const userResponse = await fetch(
        `https://admin.googleapis.com/admin/directory/v1/users/${encodeURIComponent(userEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!userResponse.ok) {
        throw new Error(`Admin API error: ${userResponse.statusText}`);
      }

      const userData = await userResponse.json();
      const isSuperAdmin = userData.isAdmin ?? false;

      if (isSuperAdmin) {
        this.availableRoles.set({
          isSuperAdmin: true,
          isCepAdmin: true,
          missingPrivileges: [],
        });
        return;
      }

      // Check role assignments
      const rolesResponse = await fetch(
        `https://admin.googleapis.com/admin/directory/v1/roleAssignments?userKey=${encodeURIComponent(userEmail)}&customer=my_customer`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!rolesResponse.ok) {
        throw new Error(
          `Role assignments API error: ${rolesResponse.statusText}`,
        );
      }

      const rolesData = await rolesResponse.json();
      const roleAssignments = rolesData.items || [];

      // Check CEP admin privileges
      let hasAllPrivileges = true;
      const missingPrivileges: Privilege[] = [];

      // Define required CEP admin privileges
      const REQUIRED_CEP_ADMIN_PRIVILEGES = [
        {
          privilegeName: 'ORGANIZATION_UNITS_RETRIEVE',
          serviceId: '00haapch16h1ysv',
        },
        { privilegeName: 'ACTIVITY_RULES', serviceId: '01egqt2p2p8gvae' },
        { privilegeName: 'APP_ADMIN', serviceId: '01egqt2p2p8gvae' },
        { privilegeName: 'MANAGE_GSC_RULE', serviceId: '01egqt2p2p8gvae' },
        { privilegeName: 'VIEW_GSC_RULE', serviceId: '01egqt2p2p8gvae' },
        {
          privilegeName: 'ACCESS_LEVEL_MANAGEMENT',
          serviceId: '01rvwp1q4axizdr',
        },
        {
          privilegeName: 'MANAGE_DEVICE_SETTINGS',
          serviceId: '03hv69ve4bjwe54',
        },
        {
          privilegeName: 'MANAGE_CHROME_INSIGHT_SETTINGS',
          serviceId: '01x0gk371sq486y',
        },
        {
          privilegeName: 'VIEW_AND_MANAGE_CHROME_OCR_SETTING',
          serviceId: '01x0gk371sq486y',
        },
        {
          privilegeName: 'VIEW_CHROME_INSIGHT_SETTINGS',
          serviceId: '01x0gk371sq486y',
        },
        { privilegeName: 'MANAGE_DEVICES', serviceId: '03hv69ve4bjwe54' },
        { privilegeName: 'APP_ADMIN', serviceId: '03hv69ve4bjwe54' },
        {
          privilegeName: 'APPS_INCIDENTS_FULL_ACCESS',
          serviceId: '02pta16n3efhw69',
        },
        { privilegeName: 'REPORTS_ACCESS', serviceId: '01fob9te2rj6rw9' },
      ];

      // Get all privileges from assigned roles
      const allPrivileges: Privilege[] = [];
      for (const assignment of roleAssignments) {
        const roleResponse = await fetch(
          `https://admin.googleapis.com/admin/directory/v1/roles/${assignment.roleId}?customer=my_customer`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          const privileges = roleData.rolePrivileges || [];
          allPrivileges.push(...privileges);
        }
      }

      // Check for missing privileges
      for (const required of REQUIRED_CEP_ADMIN_PRIVILEGES) {
        const hasPrivilege = allPrivileges.some(
          (p) =>
            p.privilegeName === required.privilegeName &&
            p.serviceId === required.serviceId,
        );
        if (!hasPrivilege) {
          hasAllPrivileges = false;
          missingPrivileges.push(required);
        }
      }

      this.availableRoles.set({
        isSuperAdmin: false,
        isCepAdmin: hasAllPrivileges,
        missingPrivileges: hasAllPrivileges ? [] : missingPrivileges,
      });
    } catch (error) {
      console.error('API Error checking admin roles:', error);
      this.availableRoles.set({
        isSuperAdmin: false,
        isCepAdmin: false,
        missingPrivileges: [],
      });
    }
  }
}
