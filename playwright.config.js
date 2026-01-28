import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Comprehensive test suite for Compensation Journey web app covering:
 * - 30 functional tests across 6 spec files
 * - 14 visual regression tests (7 tabs × 2 themes)
 * - 30 accessibility scans (WCAG AA validation)
 * - 3 browsers: Chromium, Firefox, WebKit
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Timeout Configuration */
  timeout: 30 * 1000, // 30s per test (charts can take time to render)
  expect: {
    timeout: 5000, // 5s for assertions
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only (flaky chart animations) */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI (stability) */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    process.env.CI ? ['github'] : ['line'],
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:8000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure and first retry */
    screenshot: 'only-on-failure',

    /* Video on retry (for debugging flaky tests) */
    video: 'retain-on-failure',

    /* Maximum time for navigation actions */
    navigationTimeout: 10000,

    /* Maximum time for all actions */
    actionTimeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }, // Desktop-only app
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 900 },
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'python3 -m http.server 8000',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start server
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
