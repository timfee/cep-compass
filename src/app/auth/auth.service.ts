import { Injectable, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  authState,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from '@angular/fire/auth';
import { Functions, httpsCallable } from '@angular/fire/functions';

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
  private functions: Functions = inject(Functions);
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
      'https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly',
    );
    provider.addScope(
      'https://www.googleapis.com/auth/admin.directory.orgunit.readonly',
    );

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

    // If no stored token, re-authenticate to get a fresh one
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope(
        'https://www.googleapis.com/auth/admin.directory.user.readonly',
      );
      provider.addScope(
        'https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly',
      );
      provider.addScope(
        'https://www.googleapis.com/auth/admin.directory.orgunit.readonly',
      );

      const result = await signInWithPopup(this.auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        this.accessToken = credential.accessToken;
        return credential.accessToken;
      } else {
        console.error('Failed to retrieve OAuth access token.');
        return null;
      }
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  private async updateAvailableRoles(): Promise<void> {
    try {
      const getRoles = httpsCallable<void, UserRoles>(
        this.functions,
        'getRoles',
      );
      const roles = await getRoles();
      this.availableRoles.set(roles.data);
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
