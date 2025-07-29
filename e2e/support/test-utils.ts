import { Page } from '@playwright/test';

export async function waitForAngular(page: Page) {
  await page.waitForFunction(() => {
    return (window as any).getAllAngularTestabilities?.()
      .every((testability: any) => testability.isStable());
  }, { timeout: 5000 });
}

export async function waitForApp(page: Page) {
  await page.waitForSelector('app-root', { timeout: 10000 });
  await waitForAngular(page);
}

export async function fastLogin(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('cep_selected_role', 'superAdmin');
    sessionStorage.setItem('cep_oauth_token', 'mock-token');
  });
}
