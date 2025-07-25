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
  private functions: Functions = inject(Functions);

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
        await this.updateAvailableRoles();
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
      this.availableRoles.set({ isSuperAdmin: false, isCepAdmin: false });
    }
  }
}
