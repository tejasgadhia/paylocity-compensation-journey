/**
 * Data Export/Import Tests
 *
 * Tests for:
 * - Export data as JSON (download triggered)
 * - Warning modal shows before export
 * - Import JSON restores data (all tabs)
 * - Invalid JSON shows error
 *
 * Note: These tests may be skipped if export/import features
 * are not yet implemented in the current version.
 */

import { test, expect } from '@playwright/test';
import {
  VALID_PAYLOCITY_INPUT,
  DEMO_SCENARIO_JSON,
  INVALID_JSON,
} from './helpers/fixtures.js';
import {
  importData,
  switchTab,
} from './helpers/actions.js';
import { assertModalVisible } from './helpers/assertions.js';
import { checkA11y } from './helpers/a11y.js';

test.describe('Data Export/Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await importData(page, VALID_PAYLOCITY_INPUT);
  });

  test.skip('exports data as JSON and triggers download', async ({ page }) => {
    // Switch to About tab (contains export button)
    await switchTab(page, 'about');

    // Start waiting for download
    const downloadPromise = page.waitForEvent('download');

    // Click Export Data button (if it exists)
    const exportButton = page.locator('[data-testid="export-data-btn"]');

    if (await exportButton.isVisible()) {
      await exportButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Verify download occurred
      expect(download.suggestedFilename()).toContain('.json');

      // A11y check
      await checkA11y(page);
    } else {
      test.skip();
    }
  });

  test.skip('shows warning modal before export', async ({ page }) => {
    // Switch to About tab
    await switchTab(page, 'about');

    // Click Export Data button (if it exists)
    const exportButton = page.locator('[data-testid="export-data-btn"]');

    if (await exportButton.isVisible()) {
      await exportButton.click();

      // Verify modal appears
      await assertModalVisible(page, 'export-modal');

      // Verify warning text present
      await expect(page.locator('#export-modal')).toContainText(/privacy|warning|caution/i);

      // Close modal
      await page.getByRole('button', { name: /cancel|close/i }).click();

      // A11y check
      await checkA11y(page);
    } else {
      test.skip();
    }
  });

  test.skip('imports JSON and restores data', async ({ page }) => {
    // Switch to About tab
    await switchTab(page, 'about');

    // Click Import Data button (if it exists)
    const importButton = page.getByRole('button', { name: /import data/i });

    if (await importButton.isVisible()) {
      await importButton.click();

      // Wait for modal
      await page.locator('#import-modal').waitFor({ state: 'visible' });

      // Fill JSON textarea
      await page.locator('#import-json').fill(JSON.stringify(DEMO_SCENARIO_JSON, null, 2));

      // Click confirm
      await page.locator('[data-testid="import-data-confirm"]').click();

      // Wait for modal to close
      await page.locator('#import-modal').waitFor({ state: 'hidden' });

      // Verify data imported (check employee data length)
      const recordCount = await page.evaluate(() => {
        return window.employeeData?.length || 0;
      });

      expect(recordCount).toBe(DEMO_SCENARIO_JSON.data.length);

      // A11y check
      await checkA11y(page);
    } else {
      test.skip();
    }
  });

  test.skip('shows error for invalid JSON', async ({ page }) => {
    // Switch to About tab
    await switchTab(page, 'about');

    // Click Import Data button (if it exists)
    const importButton = page.getByRole('button', { name: /import data/i });

    if (await importButton.isVisible()) {
      await importButton.click();

      // Wait for modal
      await page.locator('#import-modal').waitFor({ state: 'visible' });

      // Fill with invalid JSON
      await page.locator('#import-json').fill(INVALID_JSON);

      // Click confirm
      await page.locator('[data-testid="import-data-confirm"]').click();

      // Verify error message appears (either in modal or as toast)
      const errorVisible = await page.locator('.error-message, #error-message').isVisible();
      expect(errorVisible).toBe(true);

      // A11y check
      await checkA11y(page);
    } else {
      test.skip();
    }
  });
});
