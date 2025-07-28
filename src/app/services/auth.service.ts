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
const ENCRYPTION_KEY_STORAGE = 'cep_encrypt_key';

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
        sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE);
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
        // Encrypt and store token using AES-GCM
        const encrypted = await this.encryptToken(credential.accessToken);
        sessionStorage.setItem(TOKEN_STORAGE_KEY, encrypted);
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
    sessionStorage.removeItem(ENCRYPTION_KEY_STORAGE);
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
      try {
        // First try to decrypt as encrypted token
        this.accessToken = await this.decryptToken(stored);
        return this.accessToken;
      } catch (error) {
        console.warn('Failed to decrypt stored token, attempting migration:', error);
        
        // Try to migrate from Base64 format
        const migrated = await this.migrateBase64Token(stored);
        if (migrated) {
          this.accessToken = migrated;
          return this.accessToken;
        }
        
        // If both fail, remove invalid token
        console.warn('Failed to decrypt or migrate token, removing from storage');
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
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
          // Encrypt and store token using AES-GCM
          const encrypted = await this.encryptToken(credential.accessToken);
          sessionStorage.setItem(TOKEN_STORAGE_KEY, encrypted);
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
          // Encrypt and store token using AES-GCM
          const encrypted = await this.encryptToken(credential.accessToken);
          sessionStorage.setItem(TOKEN_STORAGE_KEY, encrypted);
          return credential.accessToken;
        }
      }

      return null;
    } catch (error) {
      console.warn('Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Generates or retrieves the encryption key for token storage
   */
  private async getOrCreateEncryptionKey(): Promise<CryptoKey> {
    const stored = sessionStorage.getItem(ENCRYPTION_KEY_STORAGE);
    
    if (stored) {
      try {
        const keyData = new Uint8Array(atob(stored).split('').map(c => c.charCodeAt(0)));
        return await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      } catch (error) {
        console.warn('Failed to import stored encryption key, generating new one:', error);
      }
    }

    // Generate new key
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Export and store the key
    const exported = await crypto.subtle.exportKey('raw', key);
    const keyString = btoa(String.fromCharCode(...new Uint8Array(exported)));
    sessionStorage.setItem(ENCRYPTION_KEY_STORAGE, keyString);

    return key;
  }

  /**
   * Encrypts a token using AES-GCM encryption
   */
  private async encryptToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    
    const key = await this.getOrCreateEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypts a token that was encrypted with encryptToken
   */
  private async decryptToken(encryptedToken: string): Promise<string> {
    try {
      const combined = new Uint8Array(atob(encryptedToken).split('').map(c => c.charCodeAt(0)));
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      const key = await this.getOrCreateEncryptionKey();
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.warn('Failed to decrypt token:', error);
      throw new Error('Invalid or corrupted token');
    }
  }

  /**
   * Attempts to migrate a Base64-encoded token to encrypted format
   */
  private async migrateBase64Token(stored: string): Promise<string | null> {
    try {
      // Try to decode as Base64 first
      const decoded = atob(stored);
      
      // Simple heuristic: OAuth tokens are typically long and contain specific patterns
      if (decoded.length > 50 && (decoded.startsWith('ya29.') || decoded.includes('.'))) {
        console.log('Migrating Base64-encoded token to encrypted format');
        const encrypted = await this.encryptToken(decoded);
        sessionStorage.setItem(TOKEN_STORAGE_KEY, encrypted);
        return decoded;
      }
    } catch {
      // Not a valid Base64 string, might already be encrypted
    }
    return null;
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
