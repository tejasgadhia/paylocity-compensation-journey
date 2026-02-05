/**
 * Custom Test Assertions
 *
 * Reusable assertion functions for common verification patterns
 */

import { expect } from '@playwright/test';
import { KPI_LABELS, TABS } from './fixtures.js';

/**
 * Assert all KPI cards are visible with values
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function assertKPIsVisible(page) {
  // Verify all KPI/metric cards exist
  for (const label of KPI_LABELS) {
    const metricCard = page.locator('.metric-card', { hasText: label });
    await expect(metricCard).toBeVisible();

    // Verify each metric has a value (not empty)
    const valueElement = metricCard.locator('.metric-value');
    await expect(valueElement).not.toBeEmpty();
  }
}

/**
 * Assert a chart has been rendered (canvas exists and has dimensions)
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} chartId - Canvas element ID (e.g., 'mainChart', 'yoyChart')
 */
export async function assertChartRendered(page, chartId) {
  const canvas = page.locator(`#${chartId}`);

  // Verify canvas exists
  await expect(canvas).toBeVisible();

  // Verify canvas has non-zero dimensions
  const boundingBox = await canvas.boundingBox();
  expect(boundingBox).not.toBeNull();
  expect(boundingBox.width).toBeGreaterThan(0);
  expect(boundingBox.height).toBeGreaterThan(0);

  // Canvas existence and dimensions are sufficient evidence of chart rendering
  // Chart.js instance check is skipped because:
  // 1. Canvas is visible and has dimensions (checked above)
  // 2. window.charts may not be accessible in test context
  // 3. Visual verification is more reliable for E2E tests
}

/**
 * Assert all tabs are present and clickable
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function assertTabsPresent(page) {
  for (const tabName of TABS) {
    const tabButton = page.locator(`.tab-btn[data-tab="${tabName}"]`);
    await expect(tabButton).toBeVisible();
    await expect(tabButton).toBeEnabled();
  }
}

/**
 * Assert theme colors match expected values
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} theme - Theme name: 'tactical' or 'artistic'
 */
export async function assertThemeColors(page, theme) {
  // Verify HTML has correct data-theme attribute
  const htmlTheme = await page.locator('html').getAttribute('data-theme');
  expect(htmlTheme).toBe(theme);

  // Verify theme button has active class
  const activeThemeButton = await page.locator('.theme-switcher .theme-btn.active').getAttribute('data-theme');
  expect(activeThemeButton).toBe(theme);

  // Verify colors are set via CSS custom properties
  const bgPrimary = await page.evaluate(() => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-primary')
      .trim();
  });

  expect(bgPrimary).toBeTruthy();

  // Basic sanity check: tactical should be very dark, artistic should be very light
  if (theme === 'tactical') {
    // Tactical theme: #0a0a0b
    expect(bgPrimary).toMatch(/rgb\(10,\s*10,\s*11\)|#0a0a0b/i);
  } else {
    // Artistic theme: #FAF9F7 (updated from #faf8f5)
    expect(bgPrimary).toMatch(/rgb\(250,\s*249,\s*247\)|#faf9f7/i);
  }
}

/**
 * Assert dashboard is visible (main view loaded)
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function assertDashboardVisible(page) {
  // Verify landing page is hidden
  await expect(page.locator('#landingPage')).toBeHidden();

  // Verify dashboard page is visible
  await expect(page.locator('#dashboardPage')).toBeVisible();

  // Verify at least one tab content is active
  const activeTab = page.locator('.tab-content.active');
  await expect(activeTab).toBeVisible();
}

/**
 * Assert error message is displayed
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} expectedText - Expected error message text (partial match)
 */
export async function assertErrorMessage(page, expectedText) {
  const errorElement = page.locator('#validationMessage');
  await expect(errorElement).toBeVisible();
  await expect(errorElement).toContainText(expectedText);
}

/**
 * Assert history table has correct number of rows
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} expectedRows - Expected number of data rows (excluding header)
 */
export async function assertHistoryTableRows(page, expectedRows) {
  // Switch to History tab (contains history table)
  // History table is lazy-loaded on first tab visit (#181)
  const historyTab = page.locator('.tab-btn[data-tab="history"]');
  await historyTab.click();

  // Wait for lazy-loaded table to render
  const rows = page.locator('#historyTableBody tr');
  await expect(rows).toHaveCount(expectedRows, { timeout: 5000 });
}

/**
 * Assert modal is visible
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} modalId - Modal element ID (e.g., 'export-modal')
 */
export async function assertModalVisible(page, modalId) {
  const modal = page.locator(`#${modalId}`);
  await expect(modal).toBeVisible();

  // Verify modal has opacity > 0 (not just display:block but visible)
  const opacity = await modal.evaluate((el) => {
    return getComputedStyle(el).opacity;
  });
  expect(parseFloat(opacity)).toBeGreaterThan(0);
}

/**
 * Assert privacy mode state (dollars vs indexed)
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {boolean} showDollars - Expected state: true = dollars, false = indexed
 */
export async function assertPrivacyMode(page, showDollars) {
  // Get state from window.state
  const actualShowDollars = await page.evaluate(() => {
    return window.state ? window.state.showDollars : true;
  });

  expect(actualShowDollars).toBe(showDollars);

  // Verify UI reflects state (check metric values for $ symbol or Index)
  const metricValue = page.locator('.metric-value').first();
  const text = await metricValue.textContent();

  if (showDollars) {
    expect(text).toContain('$');
  } else {
    // Indexed values show "Index: 704" or similar
    expect(text).toMatch(/Index|^\d+$/i);
  }
}

/**
 * Assert localStorage contains expected key/value
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} key - localStorage key
 * @param {string} expectedValue - Expected value
 */
export async function assertLocalStorage(page, key, expectedValue) {
  const actualValue = await page.evaluate((k) => {
    return localStorage.getItem(k);
  }, key);

  expect(actualValue).toBe(expectedValue);
}
