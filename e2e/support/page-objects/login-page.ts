import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  readonly loginButton: Locator;
  readonly cardTitle: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.loginButton = page.locator('button:has-text("Sign in with Google")');
    this.cardTitle = page.locator('mat-card-title');
    this.pageTitle = page.locator('h1');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async waitForLoad(): Promise<void> {
    await this.cardTitle.waitFor({ state: 'visible' });
    await this.loginButton.waitFor({ state: 'visible' });
  }

  async getCardTitle(): Promise<string> {
    return await this.cardTitle.textContent() ?? '';
  }

  async clickSignInButton(): Promise<void> {
    await this.loginButton.click();
  }

  async isLoginButtonVisible(): Promise<boolean> {
    return await this.loginButton.isVisible();
  }

  /** Check if we're on the login page */
  async isLoginPage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/login');
  }
}