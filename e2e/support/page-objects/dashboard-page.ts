import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class DashboardPage extends BasePage {
  readonly pageTitle: Locator;
  readonly dashboardCards: Locator;
  readonly enrollBrowsersCard: Locator;
  readonly oneClickProtectionCard: Locator;
  readonly getStartedButtons: Locator;
  readonly userToolbar: Locator;
  readonly logoutButton: Locator;
  readonly sideNav: Locator;
  readonly navMenuButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('h1');
    this.dashboardCards = page.locator('mat-card');
    this.enrollBrowsersCard = page.locator('mat-card:has-text("Enroll Browsers")');
    this.oneClickProtectionCard = page.locator('mat-card:has-text("Activate One-Click Protection")');
    this.getStartedButtons = page.locator('button:has-text("Get Started")');
    this.userToolbar = page.locator('mat-toolbar');
    this.logoutButton = page.locator('button:has-text("Logout")');
    this.sideNav = page.locator('mat-sidenav');
    this.navMenuButton = page.locator('button[aria-label="Menu"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible' });
    await this.dashboardCards.first().waitFor({ state: 'visible' });
  }

  async getDashboardTitle(): Promise<string> {
    return await this.pageTitle.textContent() ?? '';
  }

  async clickFirstGetStartedButton(): Promise<void> {
    await this.getStartedButtons.first().click();
  }

  async getVisibleCards(): Promise<string[]> {
    const cards = await this.dashboardCards.all();
    const cardTexts: string[] = [];
    for (const card of cards) {
      const text = await card.textContent();
      if (text) cardTexts.push(text.trim());
    }
    return cardTexts;
  }

  async openSideNav(): Promise<void> {
    if (await this.navMenuButton.isVisible()) {
      await this.navMenuButton.click();
      await this.sideNav.waitFor({ state: 'visible' });
    }
  }

  async logout(): Promise<void> {
    if (await this.logoutButton.isVisible()) {
      await this.logoutButton.click();
    }
  }

  async navigateToOrgUnits(): Promise<void> {
    await this.openSideNav();
    await this.page.locator('a[routerLink="/org-units"]').click();
  }

  async navigateToEmailTemplates(): Promise<void> {
    await this.openSideNav();
    await this.page.locator('a[routerLink="/email-templates"]').click();
  }

  async navigateToAdmin(): Promise<void> {
    await this.openSideNav();
    await this.page.locator('a[routerLink="/admin"]').click();
  }

  /** Check if we're on the dashboard page */
  async isDashboardPage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/dashboard');
  }
}