import { Page } from '@playwright/test';
import { TestUser } from '../types/test-types';

export class AuthMock {
  constructor(private page: Page) {}

  /** Setup basic authentication mocks without user data */
  async setupBasicMocks(): Promise<void> {
    // Mock Google API
    await this.page.addInitScript(() => {
      (window as any).gapi = {
        load: () => {},
        auth2: {
          getAuthInstance: () => ({
            isSignedIn: { get: () => false },
            currentUser: {
              get: () => null,
            },
          }),
        },
      };
    });

    // Mock API routes with specific endpoint handling
    await this.page.route('**/api/**', (route) => {
      const url = route.request().url();

      // Handle specific API endpoints
      if (url.includes('/api/user')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 1, name: 'Test User' }),
        });
      } else if (url.includes('/api/settings')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ theme: 'dark', notifications: true }),
        });
      } else if (url.includes('/api/templates')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ templates: [] }),
        });
      } else {
        // Default response for unhandled API endpoints
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not Found' }),
        });
      }
    });

    // Mock Google API routes
    await this.page.route('**/googleapis.com/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });
  }

  /** Setup authentication state for a specific user using localStorage */
  async setupAuthenticatedUser(
    user: TestUser,
    selectedRole?: string,
  ): Promise<void> {
    // First setup basic mocks
    await this.setupBasicMocks();

    // Navigate to ensure page context is available
    await this.page.goto('/');

    // Set up localStorage with auth state
    await this.page.evaluate(
      ({ userData, role }) => {
        // Set role selection if provided
        if (role) {
          localStorage.setItem('cep_selected_role', role);
        }

        // Mock auth token
        sessionStorage.setItem('cep_oauth_token', 'mock-token');

        // Store user data for the app to access
        localStorage.setItem('test-user-data', JSON.stringify(userData));
      },
      { userData: user, role: selectedRole },
    );

    // Mock Firebase user state
    await this.page.addInitScript((userData) => {
      // Mock Firebase auth
      (window as any).mockFirebaseUser = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        getIdToken: () => Promise.resolve('mock-id-token'),
        getIdTokenResult: () => Promise.resolve({ token: 'mock-id-token' }),
      };

      // Mock Firebase auth state
      (window as any).authStateChanged = true;

      // Mock Google API with signed in user
      (window as any).gapi = {
        load: () => {},
        auth2: {
          getAuthInstance: () => ({
            isSignedIn: { get: () => true },
            currentUser: {
              get: () => ({
                getBasicProfile: () => ({
                  getEmail: () => userData.email,
                  getName: () => userData.displayName,
                }),
                getAuthResponse: () => ({
                  access_token: 'mock-access-token',
                }),
              }),
            },
          }),
        },
      };
    }, user);

    // Mock admin API responses based on user roles
    await this.page.route('**/admin.googleapis.com/**', (route) => {
      const url = route.request().url();

      if (url.includes('/users/')) {
        // Mock user admin status based on roles
        const isAdmin = user.roles.some((role) => role.type === 'superAdmin');
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            isAdmin,
            email: user.email,
            name: user.displayName,
          }),
        });
      } else if (url.includes('/roleAssignments')) {
        // Mock role assignments
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: user.roles.map((role, index) => ({
              roleId: `role-${index}`,
              assignedTo: user.uid,
            })),
          }),
        });
      } else if (url.includes('/roles/')) {
        // Mock individual role details
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rolePrivileges: user.roles.flatMap((role) =>
              role.permissions.map((permission) => ({
                privilegeName: permission,
                serviceId: '00haapch16h1ysv',
              })),
            ),
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      }
    });
  }

  /** Clear all authentication state */
  async clearAuth(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      delete (window as any).mockFirebaseUser;
      delete (window as any).authStateChanged;
    });
  }

  /** Mock a successful OAuth login flow */
  async mockSuccessfulLogin(user: TestUser): Promise<void> {
    await this.page.addInitScript((userData) => {
      // Override the loginWithGoogle method to simulate successful login
      if ((window as any).mockAuthService) {
        (window as any).mockAuthService.loginWithGoogle = async () => {
          // Simulate successful login
          (window as any).mockFirebaseUser = {
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName,
            getIdToken: () => Promise.resolve('mock-id-token'),
            getIdTokenResult: () => Promise.resolve({ token: 'mock-id-token' }),
          };

          sessionStorage.setItem('cep_oauth_token', 'mock-access-token');

          // Trigger auth state change
          (window as any).authStateChanged = true;

          return Promise.resolve();
        };
      }
    }, user);
  }
}
