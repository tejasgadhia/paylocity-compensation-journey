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
  // Verify all 6 KPI cards exist
  for (const label of KPI_LABELS) {
    const kpiCard = page.locator('.kpi-card', { hasText: label });
    await expect(kpiCard).toBeVisible();

    // Verify each KPI has a value (not empty)
    const valueElement = kpiCard.locator('.kpi-value');
    await expect(valueElement).not.toBeEmpty();
  }
}

/**
 * Assert a chart has been rendered (canvas exists and has dimensions)
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} chartId - Canvas element ID (e.g., 'main-chart')
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

  // Verify Chart.js instance exists in window.charts
  const chartExists = await page.evaluate((id) => {
    const chartKey = id.replace('-chart', ''); // 'main-chart' → 'main'
    return window.charts && window.charts[chartKey] instanceof Chart;
  }, chartId);

  expect(chartExists).toBe(true);
}

/**
 * Assert all tabs are present and clickable
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function assertTabsPresent(page) {
  for (const tabName of TABS) {
    const tabButton = page.locator(`[data-tab="${tabName}"]`);
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
  // Get computed CSS custom property values
  const bgPrimary = await page.evaluate(() => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-primary')
      .trim();
  });

  const textPrimary = await page.evaluate(() => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--text-primary')
      .trim();
  });

  // Verify HTML has correct data-theme attribute
  const htmlTheme = await page.locator('html').getAttribute('data-theme');
  expect(htmlTheme).toBe(theme);

  // Verify colors are set (exact RGB values may vary slightly)
  expect(bgPrimary).toBeTruthy();
  expect(textPrimary).toBeTruthy();

  // Verify contrast (dark theme has dark bg, light theme has light bg)
  if (theme === 'tactical') {
    // Tactical is dark theme
    const isDark = await page.evaluate((bg) => {
      const rgb = bg.match(/\d+/g);
      const brightness = rgb ? (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3 : 255;
      return brightness < 50; // Dark if average RGB < 50
    }, bgPrimary);
    expect(isDark).toBe(true);
  } else {
    // Artistic is light theme
    const isLight = await page.evaluate((bg) => {
      const rgb = bg.match(/\d+/g);
      const brightness = rgb ? (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3 : 0;
      return brightness > 200; // Light if average RGB > 200
    }, bgPrimary);
    expect(isLight).toBe(true);
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
  // Switch to Breakdown tab (contains history table)
  const breakdownTab = page.locator('[data-tab="breakdown"]');
  if (!(await breakdownTab.isVisible())) {
    await breakdownTab.click();
    await page.waitForTimeout(300);
  }

  // Count rows in history table (tbody rows)
  const rows = page.locator('#history-table tbody tr');
  await expect(rows).toHaveCount(expectedRows);
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

  // Verify UI reflects state (check KPI values for $ symbol)
  const kpiValue = page.locator('.kpi-value').first();
  const text = await kpiValue.textContent();

  if (showDollars) {
    expect(text).toContain('$');
  } else {
    expect(text).toContain('x'); // Indexed values use multiplier notation (e.g., "1.5x")
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
