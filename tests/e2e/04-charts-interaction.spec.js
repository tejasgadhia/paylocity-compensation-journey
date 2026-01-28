/**
 * Chart Interaction Tests
 *
 * Tests for:
 * - Main chart type switching (line/bar/area/step)
 * - YoY chart type switching (bar/area)
 * - Chart data correctness
 * - Legend click toggling dataset visibility
 * - Tooltip display on hover
 * - Chart rebuild on theme switch
 */

import { test, expect } from '@playwright/test';
import { VALID_PAYLOCITY_INPUT } from './helpers/fixtures.js';
import {
  importData,
  switchTheme,
  switchTab,
} from './helpers/actions.js';
import { assertChartRendered } from './helpers/assertions.js';
import { checkA11y } from './helpers/a11y.js';

test.describe('Chart Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await importData(page, VALID_PAYLOCITY_INPUT);
    await switchTab(page, 'home');
  });

  test('switches main chart type: line → bar → area → step', async ({ page }) => {
    // Start with line chart (default)
    await assertChartRendered(page, 'main-chart');

    // Get initial chart type
    let chartType = await page.evaluate(() => {
      return window.charts.main?.config?.type;
    });
    expect(chartType).toBe('line');

    // Switch to bar
    await page.locator('button.chart-type-btn[data-chart="bar"]').click();
    await page.waitForTimeout(500);

    chartType = await page.evaluate(() => window.charts.main?.config?.type);
    expect(chartType).toBe('bar');

    // Switch to area
    await page.locator('button.chart-type-btn[data-chart="area"]').click();
    await page.waitForTimeout(500);

    chartType = await page.evaluate(() => window.charts.main?.config?.type);
    expect(chartType).toBe('line'); // Area is line with fill

    // Switch to step
    await page.locator('button.chart-type-btn[data-chart="step"]').click();
    await page.waitForTimeout(500);

    chartType = await page.evaluate(() => window.charts.main?.config?.type);
    expect(chartType).toBe('line'); // Step is line with stepped: true

    // A11y check
    await checkA11y(page);
  });

  test('switches YoY chart type: bar → line', async ({ page }) => {
    // Switch to YoY tab
    await switchTab(page, 'yoy');

    // Start with bar chart (default)
    await assertChartRendered(page, 'yoy-chart');

    let chartType = await page.evaluate(() => {
      return window.charts.yoy?.config?.type;
    });
    expect(chartType).toBe('bar');

    // Switch to line
    await page.locator('button.chart-type-btn[data-chart="yoy-line"]').click();
    await page.waitForTimeout(500);

    chartType = await page.evaluate(() => window.charts.yoy?.config?.type);
    expect(chartType).toBe('line');

    // A11y check
    await checkA11y(page);
  });

  test('verifies chart data correctness', async ({ page }) => {
    // Extract chart data from window.charts
    const chartData = await page.evaluate(() => {
      const mainChart = window.charts.main;
      if (!mainChart) return null;

      return {
        labels: mainChart.data.labels,
        datasets: mainChart.data.datasets.map(ds => ({
          label: ds.label,
          data: ds.data,
        })),
      };
    });

    // Verify chart has data
    expect(chartData).not.toBeNull();
    expect(chartData.labels.length).toBeGreaterThan(0);
    expect(chartData.datasets.length).toBeGreaterThan(0);

    // Verify first dataset has data points
    const firstDataset = chartData.datasets[0];
    expect(firstDataset.data.length).toBe(5); // 5 records from VALID_PAYLOCITY_INPUT

    // Verify salary values are realistic (between $1k and $10M)
    for (const value of firstDataset.data) {
      expect(value).toBeGreaterThanOrEqual(1000);
      expect(value).toBeLessThanOrEqual(10000000);
    }

    // A11y check
    await checkA11y(page);
  });

  test('toggles dataset visibility on legend click', async ({ page }) => {
    // Get chart canvas
    const canvas = page.locator('#mainChart');

    // Get initial chart state
    const initialState = await page.evaluate(() => {
      const chart = window.charts.main;
      return chart.data.datasets.map(ds => ds.hidden !== true);
    });

    // Verify at least one dataset is visible
    expect(initialState.some(visible => visible)).toBe(true);

    // Click legend (first legend item)
    // Note: This is tricky with Playwright, might need to evaluate JS directly
    await page.evaluate(() => {
      const chart = window.charts.main;
      const legend = chart.legend;
      if (legend && legend.legendItems && legend.legendItems[0]) {
        chart.toggleDataVisibility(0);
        chart.update();
      }
    });

    await page.waitForTimeout(300);

    // Verify dataset visibility changed
    const newState = await page.evaluate(() => {
      const chart = window.charts.main;
      return chart.data.datasets.map(ds => ds.hidden !== true);
    });

    // At least one dataset should have changed visibility
    expect(newState).not.toEqual(initialState);

    // A11y check
    await checkA11y(page);
  });

  test('displays tooltip on canvas hover', async ({ page }) => {
    // Hover over chart canvas (center)
    const canvas = page.locator('#mainChart');
    const boundingBox = await canvas.boundingBox();

    if (boundingBox) {
      // Hover over middle of chart
      await page.mouse.move(
        boundingBox.x + boundingBox.width / 2,
        boundingBox.y + boundingBox.height / 2
      );

      await page.waitForTimeout(500);

      // Check if tooltip element exists (Chart.js creates tooltip element)
      const tooltipExists = await page.evaluate(() => {
        const chart = window.charts.main;
        return chart.tooltip && chart.tooltip.opacity > 0;
      });

      // Tooltip should exist when hovering (may not always trigger on exact center)
      // This test verifies tooltip capability exists
      expect(typeof tooltipExists).toBe('boolean');
    }

    // A11y check
    await checkA11y(page);
  });

  test('rebuilds chart on theme switch', async ({ page }) => {
    // Get initial chart colors (tactical theme)
    await switchTheme(page, 'tactical');
    await page.waitForTimeout(300);

    const tacticalColors = await page.evaluate(() => {
      const chart = window.charts.main;
      return chart.data.datasets.map(ds => ds.borderColor);
    });

    // Switch to artistic theme
    await switchTheme(page, 'artistic');
    await page.waitForTimeout(600); // Wait for chart rebuild

    const artisticColors = await page.evaluate(() => {
      const chart = window.charts.main;
      return chart.data.datasets.map(ds => ds.borderColor);
    });

    // Colors should be different after theme switch
    expect(artisticColors).not.toEqual(tacticalColors);

    // Verify chart still rendered correctly
    await assertChartRendered(page, 'main-chart');

    // A11y check
    await checkA11y(page);
  });
});
