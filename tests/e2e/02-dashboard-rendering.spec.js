/**
 * Dashboard Rendering Tests
 *
 * Tests for:
 * - All 7 tabs present and clickable
 * - 6 KPI cards visible with values
 * - 4 main charts rendered (main, YoY, category, projection)
 * - History table populated with correct row count
 * - Initial state correct (Home tab active)
 */

import { test, expect } from '@playwright/test';
import { VALID_PAYLOCITY_INPUT } from './helpers/fixtures.js';
import { importData, switchTab } from './helpers/actions.js';
import {
  assertKPIsVisible,
  assertChartRendered,
  assertTabsPresent,
  assertHistoryTableRows,
} from './helpers/assertions.js';
import { checkA11y } from './helpers/a11y.js';

test.describe('Dashboard Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await importData(page, VALID_PAYLOCITY_INPUT);
  });

  test('displays all 7 tabs as clickable', async ({ page }) => {
    // Verify all tabs are present
    await assertTabsPresent(page);

    // A11y check
    await checkA11y(page);
  });

  test('displays all 6 KPI cards with values', async ({ page }) => {
    // Switch to Home tab (should be default, but ensure)
    await switchTab(page, 'home');

    // Verify all KPIs visible
    await assertKPIsVisible(page);

    // A11y check
    await checkA11y(page);
  });

  test('renders all 4 main charts', async ({ page }) => {
    // Verify main chart on Home tab
    await switchTab(page, 'home');
    await assertChartRendered(page, 'main-chart');

    // Verify YoY chart on YoY tab
    await switchTab(page, 'yoy');
    await assertChartRendered(page, 'yoy-chart');

    // Verify category chart on Breakdown tab
    await switchTab(page, 'breakdown');
    await assertChartRendered(page, 'category-chart');

    // Verify projection chart on Projection tab
    await switchTab(page, 'projection');
    await assertChartRendered(page, 'projection-chart');

    // A11y check on final tab
    await checkA11y(page);
  });

  test('populates history table with correct number of rows', async ({ page }) => {
    // Expected rows from VALID_PAYLOCITY_INPUT (5 records)
    const expectedRows = 5;

    // Verify history table rows
    await assertHistoryTableRows(page, expectedRows);

    // A11y check
    await checkA11y(page);
  });

  test('starts with Home tab active', async ({ page }) => {
    // Verify Home tab content is visible
    const homeTab = page.locator('#home.tab-content.active');
    await expect(homeTab).toBeVisible();

    // Verify URL hash is correct (or empty)
    const hash = await page.evaluate(() => window.location.hash);
    expect(['', '#home']).toContain(hash);

    // A11y check
    await checkA11y(page);
  });
});
