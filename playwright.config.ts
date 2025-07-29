import { defineConfig, devices } from '@playwright/test';

// Get Puppeteer Chrome path for unified browser usage
let executablePath: string | undefined;
try {
  executablePath = require('puppeteer').executablePath();
} catch (error) {
  console.warn('Puppeteer not found, using default Chrome');
  executablePath = undefined;
}

export default defineConfig({
  testDir: './e2e',
  timeout: 10000,
  expect: {
    timeout: 2000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: undefined,
        ...(executablePath && { executablePath }),
      },
    },
  ],

  webServer: {
    command: 'npm start',
    port: 4200,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
