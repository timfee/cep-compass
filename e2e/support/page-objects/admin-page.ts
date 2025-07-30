import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class AdminPage extends BasePage {
  readonly pageTitle: Locator;
  readonly createRoleButton: Locator;
  readonly roleManagementSection: Locator;
  readonly privilegesSection: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1');
    this.createRoleButton = page.locator('button:has-text("Create Role")');
    this.roleManagementSection = page.locator(
      '[data-testid="role-management"]',
    );
    this.privilegesSection = page.locator('[data-testid="privileges"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin');
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  async clickCreateRole(): Promise<void> {
    await this.createRoleButton.click();
  }

  /** Check if we're on the admin page */
  async isAdminPage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/admin');
  }

  /** Check if create role functionality is visible (Super Admin only) */
  async canCreateRoles(): Promise<boolean> {
    return await this.createRoleButton.isVisible();
  }
}
