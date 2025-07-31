import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class SelectRolePage extends BasePage {
  readonly pageTitle: Locator;
  readonly superAdminCard: Locator;
  readonly cepAdminCard: Locator;
  readonly selectButtons: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1');
    this.superAdminCard = page.locator('mat-card:has-text("Super Admin")');
    this.cepAdminCard = page.locator('mat-card:has-text("CEP Admin")');
    this.selectButtons = page.locator('button:has-text("Select")');
  }

  async goto(): Promise<void> {
    await this.page.goto('/select-role');
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  async selectSuperAdmin(): Promise<void> {
    await this.superAdminCard.locator('button:has-text("Select")').click();
  }

  async selectCepAdmin(): Promise<void> {
    await this.cepAdminCard.locator('button:has-text("Select")').click();
  }

  async selectRole(roleName: string): Promise<void> {
    const roleCard = this.page.locator(`mat-card:has-text("${roleName}")`);
    await roleCard.locator('button:has-text("Select")').click();
  }

  async getAvailableRoles(): Promise<string[]> {
    const roles: string[] = [];
    if (await this.superAdminCard.isVisible()) {
      roles.push('Super Admin');
    }
    if (await this.cepAdminCard.isVisible()) {
      roles.push('CEP Admin');
    }
    return roles;
  }

  /** Check if we're on the select role page */
  async isSelectRolePage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/select-role');
  }
}
