import { defineConfig, devices } from '@playwright/test';
const puppeteer = require('puppeteer');

export default defineConfig({
  testDir: './e2e',
  timeout: 10000, // Reduced from 30000
  expect: {
    timeout: 2000, // Reduced from 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries during development
  workers: process.env.CI ? 2 : 4, // More parallel workers
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'off', // Disable tracing for speed
    screenshot: 'off', // Disable screenshots for speed
    video: 'off', // Disable video for speed
    actionTimeout: 5000, // Fail fast on actions
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: puppeteer.executablePath(),
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process'
          ],
          headless: true // Ensure headless mode
        }
      },
    },
  ],

  webServer: {
    command: 'npm start',
    port: 4200,
    reuseExistingServer: true, // Reuse if already running
    timeout: 30000, // Give app time to start
    stdout: 'ignore', // Less output
    stderr: 'ignore'
  },
});
