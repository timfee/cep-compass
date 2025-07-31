import { chromium, FullConfig, Page } from '@playwright/test';
import { DEFAULT_TIMEOUT, SELECTORS, URL_PATTERNS } from './support/constants';

/**
 * Global setup for Playwright tests
 * Performs real authentication using provided credentials
 */
async function globalSetup(config: FullConfig) {
  // Only run auth setup if we have test credentials
  if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD || 
      !process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD) {
    console.log('Test credentials not fully provided, skipping auth setup');
    console.log('Required: TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD');
    return;
  }

  const browser = await chromium.launch();
  
  try {
    // Setup admin user authentication
    console.log('Setting up admin user authentication...');
    const adminPage = await browser.newPage();
    await setupRealAuth(adminPage, config.projects[0].use.baseURL!, 
                       process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_PASSWORD!);
    await adminPage.context().storageState({ path: 'admin-auth-state.json' });
    await adminPage.close();

    // Setup regular user authentication
    console.log('Setting up regular user authentication...');
    const userPage = await browser.newPage();
    await setupRealAuth(userPage, config.projects[0].use.baseURL!, 
                       process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!);
    await userPage.context().storageState({ path: 'user-auth-state.json' });
    await userPage.close();

    console.log('Authentication setup completed successfully');
  } catch (error) {
    console.error('Error during global auth setup:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Performs real Google OAuth authentication
 */
async function setupRealAuth(page: Page, baseURL: string, email: string, password: string) {
  // Navigate to the application
  await page.goto(baseURL);
  
  // Check if already on login page or redirected there
  await page.waitForLoadState('networkidle');
  
  // Look for and click the Google Sign In button
  const signInButton = page.locator(SELECTORS.GOOGLE_SIGN_IN);
  
  if (await signInButton.isVisible()) {
    // Click the sign in button - this should open Google OAuth popup
    await signInButton.click();
    
    // Handle the Google OAuth popup
    await handleGoogleOAuth(page, email, password);
    
    // Wait for redirect back to application
    await page.waitForURL(URL_PATTERNS.DASHBOARD_OR_ROLE, { timeout: DEFAULT_TIMEOUT });
    
    // If on role selection page, select the first available role
    if (page.url().includes('select-role')) {
      await page.waitForSelector(SELECTORS.ROLE_OPTION, { timeout: ROLE_SELECTION_TIMEOUT });
      await page.click(`${SELECTORS.ROLE_OPTION}:first-child`);
      await page.waitForURL(URL_PATTERNS.DASHBOARD, { timeout: ROLE_SELECTION_TIMEOUT });
    }
  }
}

/**
 * Handles Google OAuth authentication flow
 */
async function handleGoogleOAuth(page: Page, email: string, password: string) {
  try {
    // Wait for either Google login form or potential redirect back to app
    await Promise.race([
      page.waitForSelector(SELECTORS.GOOGLE_EMAIL_INPUT, { timeout: AUTH_TIMEOUT }),
      page.waitForURL(URL_PATTERNS.DASHBOARD_OR_ROLE, { timeout: AUTH_TIMEOUT })
    ]);
    
    // If we're already back at the app, authentication succeeded
    if (page.url().includes('dashboard') || page.url().includes('select-role')) {
      console.log('Authentication completed without manual OAuth flow');
      return;
    }
    
    // Continue with manual OAuth if still on Google login
    if (await page.locator(SELECTORS.GOOGLE_EMAIL_INPUT).isVisible()) {
      // Enter email
      await page.fill(SELECTORS.GOOGLE_EMAIL_INPUT, email);
      await page.click(SELECTORS.GOOGLE_EMAIL_NEXT);
      
      // Wait for password field and enter password
      await page.waitForSelector(SELECTORS.GOOGLE_PASSWORD_INPUT, { timeout: ROLE_SELECTION_TIMEOUT });
      await page.fill(SELECTORS.GOOGLE_PASSWORD_INPUT, password);
      await page.click(SELECTORS.GOOGLE_PASSWORD_NEXT);
      
      // Handle any additional consent screens
      await page.waitForLoadState('networkidle');
      
      // Look for and click consent/allow button if present
      const allowButton = page.locator(SELECTORS.CONSENT_BUTTONS);
      if (await allowButton.first().isVisible()) {
        await allowButton.first().click();
      }
    }
    
  } catch (error) {
    console.warn('OAuth flow encountered an issue:', error);
    // Check if we ended up authenticated anyway
    if (page.url().includes('dashboard') || page.url().includes('select-role')) {
      console.log('Authentication succeeded despite OAuth flow issues');
      return;
    }
    throw error;
  }
}

export default globalSetup;
