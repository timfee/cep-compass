import { Page, expect } from '@playwright/test';

/** Angular-specific test utilities for faster E2E testing */
export class TestUtils {
  constructor(private page: Page) {}

  /** Wait for Angular to be ready and stabilize */
  async waitForAngularReady(): Promise<void> {
    await this.page.waitForFunction(() => {
      return (window as any).getAllAngularTestabilities?.()?.every?.((testability: any) => 
        testability.isStable()
      ) ?? true;
    }, { timeout: 5000 });
  }

  /** Wait for Angular router to complete navigation */
  async waitForRouterIdle(): Promise<void> {
    await this.page.waitForFunction(() => {
      const ng = (window as any).ng;
      if (!ng) return true;
      
      const appRef = ng.getInjector?.(document.body)?.get?.(ng.core?.ApplicationRef);
      return appRef?.isStable ?? true;
    }, { timeout: 3000 });
  }

  /** Fast navigation with Angular optimization */
  async navigateAndWait(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.waitForAngularReady();
  }

  /** Wait for material components to be ready */
  async waitForMaterialReady(): Promise<void> {
    await this.page.waitForFunction(() => {
      // Check if material components are finished loading
      const matElements = document.querySelectorAll('[mat-]');
      return Array.from(matElements).every(el => 
        !el.classList.contains('mat-mdc-progress-spinner') &&
        !el.classList.contains('ng-animating')
      );
    }, { timeout: 3000 });
  }

  /** Click and wait for Angular to stabilize */
  async clickAndWait(selector: string): Promise<void> {
    await this.page.click(selector);
    await this.waitForAngularReady();
  }

  /** Type and wait for Angular to stabilize */
  async typeAndWait(selector: string, text: string): Promise<void> {
    await this.page.fill(selector, text);
    await this.waitForAngularReady();
  }

  /** Verify element exists without waiting long periods */
  async expectElementExists(selector: string): Promise<void> {
    await expect(this.page.locator(selector).first()).toBeVisible({ timeout: 2000 });
  }

  /** Fast form submission with Angular optimization */
  async submitFormAndWait(formSelector: string): Promise<void> {
    await this.page.locator(formSelector).press('Enter');
    await this.waitForAngularReady();
  }

  /** Disable Angular animations for faster testing */
  async disableAnimations(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-delay: 0.01ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0.01ms !important;
        }
      `
    });
  }

  /** Mock slow network requests for faster tests */
  async mockSlowRequests(): Promise<void> {
    await this.page.route('**/*.{png,jpg,jpeg,gif,svg,woff,woff2}', route => {
      route.fulfill({
        status: 200,
        body: '',
        headers: { 'content-type': 'text/plain' }
      });
    });
  }

  /** Get Angular component state for debugging */
  async getComponentState(selector: string): Promise<any> {
    return this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      
      const ng = (window as any).ng;
      if (!ng) return null;
      
      return ng.getComponent?.(element) || null;
    }, selector);
  }
}

/** Create test utilities instance */
export function createTestUtils(page: Page): TestUtils {
  return new TestUtils(page);
}

/** Fast fixture for test utilities */
export function withTestUtils() {
  return async ({ page }: { page: Page }, use: any) => {
    const testUtils = createTestUtils(page);
    await testUtils.disableAnimations();
    await use(testUtils);
  };
}