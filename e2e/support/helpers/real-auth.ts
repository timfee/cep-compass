import { Page } from '@playwright/test';

export interface AuthUser {
  email: string;
  password: string;
  role: 'admin' | 'user';
}

/**
 * Real authentication helper that uses actual Google OAuth flows
 * instead of mocks and fixtures
 */
export class RealAuth {
  constructor(private page: Page) {}

  /**
   * Performs real Google OAuth login
   */
  async loginWithGoogle(email: string, password: string): Promise<void> {
    // Navigate to login page
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    // Click the Google Sign In button
    const signInButton = this.page.locator('button:has-text("Sign in with Google")');
    await signInButton.waitFor({ state: 'visible' });
    await signInButton.click();

    // Handle the Google OAuth popup/redirect
    await this.handleGoogleOAuth(email, password);

    // Wait for successful authentication and redirect
    await this.page.waitForURL(/dashboard|select-role/, { timeout: 30000 });
  }

  /**
   * Handles the Google OAuth authentication flow
   */
  private async handleGoogleOAuth(email: string, password: string): Promise<void> {
    try {
      // Wait for Google login form
      await this.page.waitForSelector('#identifierId', { timeout: 15000 });
      
      // Enter email
      await this.page.fill('#identifierId', email);
      await this.page.click('#identifierNext');
      
      // Wait for password field and enter password
      await this.page.waitForSelector('input[name="password"]', { timeout: 10000 });
      await this.page.fill('input[name="password"]', password);
      await this.page.click('#passwordNext');
      
      // Handle any additional consent screens
      await this.page.waitForLoadState('networkidle');
      
      // Look for and click consent/allow button if present
      const allowButton = this.page.locator('button:has-text("Allow"), button:has-text("Continue"), button:has-text("Authorize")');
      if (await allowButton.first().isVisible()) {
        await allowButton.first().click();
      }
      
    } catch (error) {
      console.warn('OAuth flow encountered an issue:', error);
      // Don't throw - let the calling function handle the final state
    }
  }

  /**
   * Selects a role if on the role selection page
   */
  async selectRole(roleType: 'superAdmin' | 'cepAdmin' | 'participant'): Promise<void> {
    // Check if we're on the role selection page
    if (this.page.url().includes('select-role')) {
      const roleSelector = `[data-testid="role-${roleType}"], button:has-text("${roleType}")`;
      await this.page.waitForSelector(roleSelector, { timeout: 10000 });
      await this.page.click(roleSelector);
      await this.page.waitForURL(/dashboard/, { timeout: 10000 });
    }
  }

  /**
   * Logs out the current user
   */
  async logout(): Promise<void> {
    // Look for logout button in the UI (typically in user menu or header)
    const logoutButton = this.page.locator('[data-testid="logout"], button:has-text("Logout"), button:has-text("Sign out")');
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Alternative: clear auth state manually
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await this.page.goto('/login');
    }
    
    // Wait for redirect to login page
    await this.page.waitForURL(/login/, { timeout: 10000 });
  }

  /**
   * Checks if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const url = this.page.url();
    return !url.includes('/login') && (url.includes('/dashboard') || url.includes('/select-role'));
  }

  /**
   * Gets the current user's email from the UI or storage
   */
  async getCurrentUserEmail(): Promise<string | null> {
    try {
      // Try to get from localStorage first
      const userEmail = await this.page.evaluate(() => {
        // Check various possible storage locations
        const user = localStorage.getItem('cep_user');
        if (user) {
          const userData = JSON.parse(user);
          return userData.email;
        }
        return null;
      });

      if (userEmail) {
        return userEmail;
      }

      // Try to get from UI elements
      const emailElement = this.page.locator('[data-testid="user-email"], .user-email');
      if (await emailElement.isVisible()) {
        return await emailElement.textContent();
      }

      return null;
    } catch (error) {
      console.warn('Could not determine current user email:', error);
      return null;
    }
  }

  /**
   * Gets admin credentials from environment
   */
  static getAdminCredentials(): AuthUser | null {
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;
    
    if (!email || !password) {
      return null;
    }
    
    return { email, password, role: 'admin' };
  }

  /**
   * Gets user credentials from environment  
   */
  static getUserCredentials(): AuthUser | null {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    
    if (!email || !password) {
      return null;
    }
    
    return { email, password, role: 'user' };
  }
}