import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Navigate to the page URL */
  abstract goto(): Promise<void>;

  /** Wait for the page to be fully loaded */
  abstract waitForLoad(): Promise<void>;

  /** Get the page title */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /** Wait for navigation to complete */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /** Take a screenshot of the current page */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }

  /** Check if an element is visible */
  async isVisible(selector: string): Promise<boolean> {
    try {
      await this.page
        .locator(selector)
        .waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /** Wait for an element to be visible */
  async waitForSelector(selector: string, timeout = 5000): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  }

  /** Click an element with retry logic */
  async clickWithRetry(selector: string, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.page.locator(selector).click();
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /** Fill input with retry logic */
  async fillWithRetry(
    selector: string,
    value: string,
    retries = 3,
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.page.locator(selector).fill(value);
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }
}
