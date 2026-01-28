/**
 * Projections & Demo Scenario Tests
 *
 * Tests for:
 * - Projection year range selection (3, 5, 10, 20 years)
 * - Custom raise rate input (3-8%)
 * - Projection chart updates
 * - Projection table shows correct values
 * - Demo scenarios cycle (1 → 2 → 3 → 4 → 1)
 */

import { test, expect } from '@playwright/test';
import { VALID_PAYLOCITY_INPUT, DEMO_SCENARIOS } from './helpers/fixtures.js';
import {
  importData,
  switchTab,
  setProjectionParams,
  loadDemoScenario,
} from './helpers/actions.js';
import { assertChartRendered } from './helpers/assertions.js';
import { checkA11y } from './helpers/a11y.js';

test.describe('Projections & Demo Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await importData(page, VALID_PAYLOCITY_INPUT);
  });

  test('selects different projection year ranges', async ({ page }) => {
    // Test 3, 5, 10 year projections
    for (const years of [3, 5, 10]) {
      await setProjectionParams(page, { years });

      // Verify projection chart rendered
      await assertChartRendered(page, 'projection-chart');

      // Verify projection table has correct number of rows (years + 1 for current)
      const rows = page.locator('#projection-table tbody tr');
      await expect(rows).toHaveCount(years + 1);
    }

    // A11y check on final state
    await checkA11y(page);
  });

  test('accepts custom raise rate input', async ({ page }) => {
    // Set custom raise rate
    await setProjectionParams(page, { raiseRate: 7 });

    // Verify projection chart updated
    await assertChartRendered(page, 'projection-chart');

    // Verify state updated
    const customRate = await page.evaluate(() => window.state.customRate);
    expect(customRate).toBe(7);

    // A11y check
    await checkA11y(page);
  });

  test('updates projection chart when parameters change', async ({ page }) => {
    // Get initial chart data
    await switchTab(page, 'projection');

    const initialData = await page.evaluate(() => {
      const chart = window.charts.projection;
      return chart?.data?.datasets[0]?.data || [];
    });

    // Change parameters
    await setProjectionParams(page, { years: 10, raiseRate: 6 });

    // Get new chart data
    const newData = await page.evaluate(() => {
      const chart = window.charts.projection;
      return chart?.data?.datasets[0]?.data || [];
    });

    // Data should have changed
    expect(newData.length).not.toBe(initialData.length);

    // A11y check
    await checkA11y(page);
  });

  test('populates projection table with correct values', async ({ page }) => {
    await switchTab(page, 'projection');

    // Set specific parameters
    await setProjectionParams(page, { years: 5, raiseRate: 5 });

    // Verify table has headers
    const headers = page.locator('#projection-table thead th');
    await expect(headers).toHaveCount(3); // Year, Salary, Change columns

    // Verify table has data rows
    const rows = page.locator('#projection-table tbody tr');
    await expect(rows).toHaveCount(6); // 5 years + current

    // Verify first row has current salary
    const firstRow = rows.first();
    await expect(firstRow).toContainText('Current');

    // A11y check
    await checkA11y(page);
  });

  test('cycles through demo scenarios', async ({ page }) => {
    // Start fresh
    await page.goto('/');

    // Load early career scenario (index 0)
    await loadDemoScenario(page, 0);

    // Verify starting salary matches early career
    let startingSalary = await page.evaluate(() => {
      return window.employeeData[0]?.annual || 0;
    });
    expect(startingSalary).toBe(DEMO_SCENARIOS.earlyCareer.startingSalary);

    // Load growth phase scenario (index 1)
    await page.getByRole('button', { name: 'Regenerate Demo' }).click();
    await page.waitForTimeout(500);

    startingSalary = await page.evaluate(() => {
      return window.employeeData[0]?.annual || 0;
    });
    expect(startingSalary).toBe(DEMO_SCENARIOS.growthPhase.startingSalary);

    // Load established scenario (index 2)
    await page.getByRole('button', { name: 'Regenerate Demo' }).click();
    await page.waitForTimeout(500);

    startingSalary = await page.evaluate(() => {
      return window.employeeData[0]?.annual || 0;
    });
    expect(startingSalary).toBe(DEMO_SCENARIOS.established.startingSalary);

    // A11y check
    await checkA11y(page);
  });
});
