import { chromium, FullConfig } from '@playwright/test';

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
async function setupRealAuth(page: any, baseURL: string, email: string, password: string) {
  // Navigate to the application
  await page.goto(baseURL);
  
  // Check if already on login page or redirected there
  await page.waitForLoadState('networkidle');
  
  // Look for and click the Google Sign In button
  const signInButton = page.locator('button:has-text("Sign in with Google")');
  
  if (await signInButton.isVisible()) {
    // Click the sign in button - this should open Google OAuth popup
    await signInButton.click();
    
    // Handle the Google OAuth popup
    await handleGoogleOAuth(page, email, password);
    
    // Wait for redirect back to application
    await page.waitForURL(/dashboard|select-role/, { timeout: 30000 });
    
    // If on role selection page, select the first available role
    if (page.url().includes('select-role')) {
      await page.waitForSelector('[data-testid="role-option"]', { timeout: 10000 });
      await page.click('[data-testid="role-option"]:first-child');
      await page.waitForURL(/dashboard/, { timeout: 10000 });
    }
  }
}

/**
 * Handles Google OAuth authentication flow
 */
async function handleGoogleOAuth(page: any, email: string, password: string) {
  try {
    // Wait for Google login form
    await page.waitForSelector('#identifierId', { timeout: 15000 });
    
    // Enter email
    await page.fill('#identifierId', email);
    await page.click('#identifierNext');
    
    // Wait for password field and enter password
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.fill('input[name="password"]', password);
    await page.click('#passwordNext');
    
    // Handle any additional consent screens
    await page.waitForLoadState('networkidle');
    
    // Look for and click consent/allow button if present
    const allowButton = page.locator('button:has-text("Allow"), button:has-text("Continue"), button:has-text("Authorize")');
    if (await allowButton.first().isVisible()) {
      await allowButton.first().click();
    }
    
  } catch (error) {
    console.warn('OAuth flow encountered an issue:', error);
    // Don't throw - let the calling function handle the final state
  }
}

export default globalSetup;
