import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-admin',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'admin-auth-state.json',
      },
      dependencies: ['chromium'],
    },
    {
      name: 'chromium-user',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'user-auth-state.json',
      },
      dependencies: ['chromium'],
    },
  ],

  webServer: {
    command: 'npm start',
    port: 4200,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
