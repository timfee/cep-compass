import { Page } from '@playwright/test';
import { 
  DEFAULT_TIMEOUT, 
  AUTH_TIMEOUT, 
  ROLE_SELECTION_TIMEOUT, 
  SHORT_TIMEOUT,
  LOCAL_STORAGE_USER_KEY,
  SELECTORS,
  URL_PATTERNS 
} from '../constants';

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
    const signInButton = this.page.locator(SELECTORS.GOOGLE_SIGN_IN);
    await signInButton.waitFor({ state: 'visible' });
    await signInButton.click();

    // Handle the Google OAuth popup/redirect
    await this.handleGoogleOAuth(email, password);

    // Wait for successful authentication and redirect
    await this.page.waitForURL(URL_PATTERNS.DASHBOARD_OR_ROLE, { timeout: DEFAULT_TIMEOUT });
  }

  /**
   * Handles the Google OAuth authentication flow
   */
  private async handleGoogleOAuth(email: string, password: string): Promise<void> {
    try {
      // Wait for either Google login form or potential redirect back to app
      await Promise.race([
        this.page.waitForSelector(SELECTORS.GOOGLE_EMAIL_INPUT, { timeout: AUTH_TIMEOUT }),
        this.page.waitForURL(URL_PATTERNS.DASHBOARD_OR_ROLE, { timeout: AUTH_TIMEOUT })
      ]);
      
      // If we're already back at the app, authentication succeeded
      if (this.page.url().includes('dashboard') || this.page.url().includes('select-role')) {
        console.log('Authentication completed without manual OAuth flow');
        return;
      }
      
      // Continue with manual OAuth if still on Google login
      if (await this.page.locator(SELECTORS.GOOGLE_EMAIL_INPUT).isVisible()) {
        // Enter email
        await this.page.fill(SELECTORS.GOOGLE_EMAIL_INPUT, email);
        await this.page.click(SELECTORS.GOOGLE_EMAIL_NEXT);
        
        // Wait for password field and enter password
        await this.page.waitForSelector(SELECTORS.GOOGLE_PASSWORD_INPUT, { timeout: ROLE_SELECTION_TIMEOUT });
        await this.page.fill(SELECTORS.GOOGLE_PASSWORD_INPUT, password);
        await this.page.click(SELECTORS.GOOGLE_PASSWORD_NEXT);
        
        // Handle any additional consent screens
        await this.page.waitForLoadState('networkidle');
        
        // Look for and click consent/allow button if present
        const allowButton = this.page.locator(SELECTORS.CONSENT_BUTTONS);
        if (await allowButton.first().isVisible()) {
          await allowButton.first().click();
        }
      }
      
    } catch (error) {
      console.warn('OAuth flow encountered an issue:', error);
      // Check if we ended up authenticated anyway
      if (this.page.url().includes('dashboard') || this.page.url().includes('select-role')) {
        console.log('Authentication succeeded despite OAuth flow issues');
        return;
      }
      // Don't throw - let the calling function handle the final state
    }
  }

  /**
   * Selects a role if on the role selection page
   */
  async selectRole(roleType: 'superAdmin' | 'cepAdmin' | 'participant'): Promise<void> {
    // Check if we're on the role selection page
    if (this.page.url().includes('select-role')) {
      // Wait for role selection page to load
      await this.page.waitForSelector('mat-card', { timeout: ROLE_SELECTION_TIMEOUT });
      
      // Map role types to selectors based on the actual page object
      let roleSelector: string;
      switch (roleType) {
        case 'superAdmin':
          roleSelector = 'mat-card:has-text("Super Admin") button:has-text("Select")';
          break;
        case 'cepAdmin':
          roleSelector = 'mat-card:has-text("CEP Admin") button:has-text("Select")';
          break;
        case 'participant':
          roleSelector = 'mat-card:has-text("Participant") button:has-text("Select")';
          break;
        default:
          // Fallback to first available role
          roleSelector = 'button:has-text("Select")';
      }
      
      try {
        await this.page.waitForSelector(roleSelector, { timeout: SHORT_TIMEOUT });
        await this.page.click(roleSelector);
        await this.page.waitForURL(URL_PATTERNS.DASHBOARD, { timeout: ROLE_SELECTION_TIMEOUT });
      } catch (error) {
        console.warn(`Could not select role ${roleType}, trying fallback`);
        // Try selecting any available role as fallback
        const fallbackSelector = 'button:has-text("Select")';
        if (await this.page.locator(fallbackSelector).first().isVisible()) {
          await this.page.locator(fallbackSelector).first().click();
          await this.page.waitForURL(URL_PATTERNS.DASHBOARD, { timeout: ROLE_SELECTION_TIMEOUT });
        }
      }
    }
  }

  /**
   * Logs out the current user
   */
  async logout(): Promise<void> {
    // Look for logout button in the UI (typically in user menu or header)
    const logoutButton = this.page.locator(SELECTORS.LOGOUT_BUTTONS);
    
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
    await this.page.waitForURL(URL_PATTERNS.LOGIN, { timeout: ROLE_SELECTION_TIMEOUT });
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
        const user = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
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
      const emailElement = this.page.locator(SELECTORS.USER_EMAIL);
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