import { Page } from '@playwright/test';
import { TestUser } from '../types/test-types';

export class AuthMock {
  constructor(private page: Page) {}

  /** Setup basic authentication mocks */
  async setupBasicAuth(): Promise<void> {
    // Mock Firebase auth state
    await this.page.addInitScript(() => {
      localStorage.setItem('test-auth', 'true');
      
      // Mock Google API
      (window as any).gapi = {
        load: () => {},
        auth2: {
          getAuthInstance: () => ({
            isSignedIn: { get: () => true },
            currentUser: {
              get: () => ({
                getBasicProfile: () => ({ 
                  getEmail: () => 'test@example.com',
                  getName: () => 'Test User',
                }),
                getAuthResponse: () => ({
                  access_token: 'mock-access-token',
                }),
              }),
            },
          }),
        },
      };
    });

    // Mock API routes
    await this.page.route('**/api/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          uid: 'test-user',
          email: 'test@example.com',
          displayName: 'Test User',
        }),
      });
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

  /** Setup authentication for a specific user */
  async setupUserAuth(user: TestUser): Promise<void> {
    // First navigate to the page to ensure localStorage is available
    await this.page.goto('/');
    
    await this.page.addInitScript((userData) => {
      localStorage.setItem('test-auth', 'true');
      localStorage.setItem('test-user', JSON.stringify(userData));

      // Mock Firebase auth state with specific user
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

    // Mock user-specific API responses
    await this.page.route('**/api/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(user),
      });
    });

    // Mock admin API responses for role checks
    await this.page.route('**/admin.googleapis.com/**', (route) => {
      const url = route.request().url();
      
      if (url.includes('/users/')) {
        // Mock user admin status based on roles
        const isAdmin = user.roles.some(role => role.type === 'superAdmin');
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
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      }
    });
  }

  /** Setup role selection for authenticated user */
  async setupRoleSelection(selectedRole: string): Promise<void> {
    // Ensure page is loaded first
    await this.page.goto('/');
    
    await this.page.addInitScript((role) => {
      localStorage.setItem('cep_selected_role', role);
    }, selectedRole);
  }

  /** Clear all authentication state */
  async clearAuth(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /** Mock OAuth popup flow */
  async mockOAuthFlow(user: TestUser): Promise<void> {
    await this.page.route('**/accounts.google.com/**', (route) => {
      // Instead of actually opening OAuth popup, simulate successful auth
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <script>
            window.opener.postMessage({
              type: 'oauth-success',
              user: ${JSON.stringify(user)},
              accessToken: 'mock-access-token'
            }, '*');
            window.close();
          </script>
        `,
      });
    });
  }
}