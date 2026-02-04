/**
 * Error Handling & Recovery Tests
 *
 * Tests for fault injection and graceful error recovery:
 * - localStorage quota handling
 * - Corrupted theme preference recovery
 * - Missing chart canvas resilience
 * - Offline demo functionality
 * - Corrupted employeeData handling
 * - Accessibility during error states
 */

import { test, expect } from '@playwright/test';
import { VALID_PAYLOCITY_INPUT } from './helpers/fixtures.js';
import { importData } from './helpers/actions.js';
import { checkA11y } from './helpers/a11y.js';

test.describe('Error Handling & Recovery', () => {

  test('handles localStorage quota gracefully', async ({ page }) => {
    await page.goto('/');

    // Fill localStorage near quota (5MB of data)
    await page.evaluate(() => {
      try {
        const bigData = 'x'.repeat(5 * 1024 * 1024);
        localStorage.setItem('quota-test', bigData);
      } catch (e) {
        // Expected to fail on quota - that's the point
        console.log('localStorage quota reached as expected');
      }
    });

    // Import data - should work despite localStorage issues
    await importData(page, VALID_PAYLOCITY_INPUT);

    // Verify app still works - metric cards should be visible
    await expect(page.locator('.metric-card')).toHaveCount(4);

    // Clean up
    await page.evaluate(() => {
      localStorage.removeItem('quota-test');
    });
  });

  test('recovers from corrupted theme preference', async ({ page }) => {
    // Set invalid theme value before loading page
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('theme', 'invalid-theme-value');
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Page should load without crashing
    await expect(page.locator('body')).toBeVisible();

    // Should default to one of the valid themes (artistic is default)
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(['artistic', 'tactical']).toContain(theme);

    // Import data should still work
    await importData(page, VALID_PAYLOCITY_INPUT);
    await expect(page.locator('.metric-card')).toHaveCount(4);
  });

  test('handles missing chart canvas gracefully', async ({ page }) => {
    await page.goto('/');
    await importData(page, VALID_PAYLOCITY_INPUT);

    // Wait for chart to render
    await page.locator('#mainChart').waitFor({ state: 'visible' });

    // Remove the main chart canvas
    await page.evaluate(() => {
      const canvas = document.querySelector('#mainChart');
      if (canvas) {
        canvas.remove();
      }
    });

    // Try to switch chart type - should not crash the app
    // Find the chart type buttons and click one
    const chartTypeBtn = page.locator('.chart-type-btn').first();
    if (await chartTypeBtn.isVisible()) {
      await chartTypeBtn.click();
    }

    // App should still be functional - tabs should work
    await expect(page.locator('.tab-btn')).toHaveCount(7);

    // Other tabs should still be accessible
    await page.locator('.tab-btn[data-tab="history"]').click();
    await expect(page.locator('#tab-history.active')).toBeVisible();
  });

  test('demo works after going offline', async ({ page, context }) => {
    await page.goto('/');

    // Click View Demo button
    await page.locator('button.btn-demo').click({ force: true });

    // Wait for dashboard to appear with longer timeout
    await page.locator('#dashboardPage').waitFor({ state: 'visible', timeout: 20000 });

    // Wait for metric cards to appear (demo data loaded)
    await expect(page.locator('.metric-card').first()).toBeVisible({ timeout: 10000 });

    // Verify demo banner is visible
    await expect(page.locator('.demo-banner')).toBeVisible();

    // Verify initial metrics loaded (4 metric cards)
    await expect(page.locator('.metric-card')).toHaveCount(4);

    // Go offline
    await context.setOffline(true);

    // Click "Try Another" to cycle demo scenarios - should still work (all local)
    const regenerateBtn = page.locator('button.demo-regenerate-btn');
    if (await regenerateBtn.isVisible()) {
      await regenerateBtn.click();
      await page.waitForTimeout(500);
    }

    // App should still function - metrics still visible
    await expect(page.locator('.metric-card')).toHaveCount(4);

    // Navigate between tabs while offline (use tab button specifically, not feature chips)
    await page.locator('.tab-btn[data-tab="market"]').click();
    await expect(page.locator('#tab-market.active')).toBeVisible();

    // Restore online status
    await context.setOffline(false);
  });

  test('handles corrupted employeeData gracefully', async ({ page }) => {
    await page.goto('/');
    await importData(page, VALID_PAYLOCITY_INPUT);

    // Verify dashboard loaded correctly
    await expect(page.locator('.metric-card')).toHaveCount(4);

    // Corrupt the global employeeData
    await page.evaluate(() => {
      window.employeeData = { corrupted: true, records: null };
    });

    // Try to switch tabs - should handle gracefully (use specific tab button)
    await page.locator('.tab-btn[data-tab="analytics"]').click();

    // Page should not crash entirely (title shouldn't be "Error")
    const title = await page.title();
    expect(title.toLowerCase()).not.toContain('error');

    // The page should still be somewhat functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('maintains accessibility during invalid input error state', async ({ page }) => {
    await page.goto('/');

    // Open import modal
    await page.locator('#openImportBtn').click();
    await page.locator('#importModal').waitFor({ state: 'visible' });

    // Try to import invalid data
    await page.locator('#pasteInput').fill('invalid data that will fail parsing');
    // Button stays disabled with invalid data, so just verify modal is accessible

    // Wait a moment for error state to render
    await page.waitForTimeout(500);

    // Error state should be accessible
    await checkA11y(page);

    // Should still be able to navigate the landing page
    await expect(page.locator('body')).toBeVisible();
  });

  test('handles empty localStorage gracefully', async ({ page }) => {
    // Clear all localStorage before loading
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload and verify app works
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();

    // Import should work
    await importData(page, VALID_PAYLOCITY_INPUT);
    await expect(page.locator('.metric-card')).toHaveCount(4);
  });
});
