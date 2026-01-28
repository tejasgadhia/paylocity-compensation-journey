/**
 * Visual Regression Tests
 *
 * Comprehensive visual testing for all 7 tabs × 2 themes = 14 screenshots
 *
 * Tests ensure UI consistency across:
 * - Theme switches (tactical vs artistic)
 * - All tabs (home, story, breakdown, yoy, market, projection, about)
 * - Chart rendering
 * - Layout stability
 */

import { test, expect } from '@playwright/test';
import { VALID_PAYLOCITY_INPUT, TABS } from './helpers/fixtures.js';
import { importData, switchTheme, switchTab } from './helpers/actions.js';

test.describe('Visual Regression - All Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await importData(page, VALID_PAYLOCITY_INPUT);
  });

  // Tactical Theme Screenshots (7 tabs)
  for (const tabName of TABS) {
    test(`visual: ${tabName} tab - tactical theme`, async ({ page }) => {
      await switchTheme(page, 'tactical');
      await switchTab(page, tabName);

      // Wait for animations to stabilize
      await page.waitForTimeout(1000);

      // Take screenshot
      await expect(page).toHaveScreenshot(`${tabName}-tactical.png`, {
        maxDiffPixels: 100,
        animations: 'disabled',
      });
    });
  }

  // Artistic Theme Screenshots (7 tabs)
  for (const tabName of TABS) {
    test(`visual: ${tabName} tab - artistic theme`, async ({ page }) => {
      await switchTheme(page, 'artistic');
      await switchTab(page, tabName);

      // Wait for animations to stabilize
      await page.waitForTimeout(1000);

      // Take screenshot
      await expect(page).toHaveScreenshot(`${tabName}-artistic.png`, {
        maxDiffPixels: 100,
        animations: 'disabled',
      });
    });
  }
});

test.describe('Visual Regression - Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await importData(page, VALID_PAYLOCITY_INPUT);
  });

  test('visual: theme toggle button states', async ({ page }) => {
    // Tactical theme
    await switchTheme(page, 'tactical');
    await page.waitForTimeout(500);

    const themeButton = page.getByRole('button', { name: /tactical|artistic/i });
    await expect(themeButton).toHaveScreenshot('theme-button-tactical.png', {
      maxDiffPixels: 10,
    });

    // Artistic theme
    await switchTheme(page, 'artistic');
    await page.waitForTimeout(500);

    await expect(themeButton).toHaveScreenshot('theme-button-artistic.png', {
      maxDiffPixels: 10,
    });
  });
});

test.describe('Visual Regression - Chart Types', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await importData(page, VALID_PAYLOCITY_INPUT);
    await switchTab(page, 'home');
  });

  test('visual: main chart - line type', async ({ page }) => {
    await page.locator('button.chart-type-btn[data-chart="line"]').click();
    await page.waitForTimeout(1000);

    await expect(page.locator('#mainChart')).toHaveScreenshot('main-chart-line.png', {
      maxDiffPixels: 200,
    });
  });

  test('visual: main chart - bar type', async ({ page }) => {
    await page.locator('button.chart-type-btn[data-chart="bar"]').click();
    await page.waitForTimeout(1000);

    await expect(page.locator('#mainChart')).toHaveScreenshot('main-chart-bar.png', {
      maxDiffPixels: 200,
    });
  });

  test('visual: main chart - area type', async ({ page }) => {
    await page.locator('button.chart-type-btn[data-chart="area"]').click();
    await page.waitForTimeout(1000);

    await expect(page.locator('#mainChart')).toHaveScreenshot('main-chart-area.png', {
      maxDiffPixels: 200,
    });
  });
});
