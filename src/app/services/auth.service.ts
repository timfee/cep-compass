import { Injectable, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  GoogleAuthProvider,
  authState,
  signInWithPopup,
  signOut,
} from '@angular/fire/auth';

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

export const TOKEN_STORAGE_KEY = 'cep_oauth_token';
const ROLE_STORAGE_KEY = 'cep_selected_role';
const REAUTHENTICATION_REQUIRED = 'REAUTHENTICATION_REQUIRED';

/**
 * Service for handling authentication and user role management
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private accessToken: string | null = null;
  private isChangingRole = false;

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
        // Only update available roles if we're not in the middle of changing roles
        if (!this.isChangingRole) {
          await this.updateAvailableRoles();
        }
      } else {
        // If logged out, reset everything and clear storage.
        this.accessToken = null;
        this.isChangingRole = false;
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
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
        // Reset the changing role flag once a role is selected
        this.isChangingRole = false;
      } else {
        localStorage.removeItem(ROLE_STORAGE_KEY);
      }
    });
  }

  /**
   * Authenticates user with Google OAuth and required admin scopes
   */
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
        // OAuth tokens are short-lived (1 hour) and stored in sessionStorage
        // which is cleared when the browser closes. HTTPS protects in transit.
        sessionStorage.setItem(TOKEN_STORAGE_KEY, credential.accessToken);
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

  /**
   * Signs out the current user and clears session data
   */
  async logout(): Promise<void> {
    this.accessToken = null;
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    await signOut(this.auth);
  }

  /**
   * Selects a role for the current session
   */
  selectRole(role: SelectedRole): void {
    // Set the changing role flag when the role is explicitly null (indicating no role selected)
    if (role === null) {
      this.isChangingRole = true;
    }

    if (role === 'superAdmin' && !this.availableRoles().isSuperAdmin) {
      throw new Error('Cannot select Super Admin role: Not available.');
    }
    if (role === 'cepAdmin' && !this.availableRoles().isCepAdmin) {
      throw new Error('Cannot select CEP Admin role: Not available.');
    }
    this.selectedRole.set(role);
  }

  /**
   * Manually refresh available roles (useful when changing roles)
   */
  async refreshAvailableRoles(): Promise<void> {
    await this.updateAvailableRoles();
  }

  /**
   * Retrieves the current OAuth access token
   */
  async getAccessToken(): Promise<string | null> {
    const currentUser = this.user();
    if (!currentUser) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }

    // Check memory first
    if (this.accessToken) {
      return this.accessToken;
    }

    // Check session storage
    const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      this.accessToken = stored;
      return this.accessToken;
    }

    return null;
  }

  /**
   * Attempts to refresh the OAuth access token
   */
  async refreshAccessToken(): Promise<string | null> {
    const currentUser = this.user();
    if (!currentUser) {
      return null;
    }

    try {
      // Force refresh the Firebase ID token first
      await currentUser.getIdTokenResult(true);

      // Re-authenticate with Google to get a fresh OAuth access token
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

      // First attempt: try silent refresh with prompt: 'none'
      // This may fail due to popup blockers but worth trying
      provider.setCustomParameters({
        access_type: 'offline',
        prompt: 'none', // Silent refresh attempt
      });

      try {
        const result = await signInWithPopup(this.auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);

        if (credential?.accessToken) {
          this.accessToken = credential.accessToken;
          // OAuth tokens are short-lived (1 hour) and stored in sessionStorage
          // which is cleared when the browser closes. HTTPS protects in transit.
          sessionStorage.setItem(TOKEN_STORAGE_KEY, credential.accessToken);
          return credential.accessToken;
        }
      } catch (silentError) {
        console.log(
          'Silent refresh failed, this is expected if popup is blocked:',
          silentError,
        );

        // Fallback: interactive refresh with user consent
        // Reset provider to remove prompt: 'none'
        provider.setCustomParameters({
          access_type: 'offline',
          prompt: 'consent', // Force user interaction
        });

        const result = await signInWithPopup(this.auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);

        if (credential?.accessToken) {
          this.accessToken = credential.accessToken;
          // OAuth tokens are short-lived (1 hour) and stored in sessionStorage
          // which is cleared when the browser closes. HTTPS protects in transit.
          sessionStorage.setItem(TOKEN_STORAGE_KEY, credential.accessToken);
          return credential.accessToken;
        }
      }

      return null;
    } catch (error) {
      console.warn('Token refresh failed:', error);
      return null;
    }
  }

  private async updateAvailableRoles(): Promise<void> {
    try {
      const token = await this.getAccessToken();
      if (!token) {
        console.warn(
          'No access token available for role enumeration. User may need to re-authenticate.',
        );
        // Set minimal permissions instead of throwing error
        this.availableRoles.set({
          isSuperAdmin: false,
          isCepAdmin: false,
          missingPrivileges: [
            { privilegeName: REAUTHENTICATION_REQUIRED, serviceId: 'auth' },
          ],
        });
        return;
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
