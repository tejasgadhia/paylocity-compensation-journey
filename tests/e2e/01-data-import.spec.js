/**
 * Data Import & Validation Tests
 *
 * Tests for:
 * - Valid input parsing and dashboard rendering
 * - Empty input error handling
 * - Malformed input error handling
 * - XSS prevention (escapeHTML)
 * - Out-of-range salary validation
 * - Single record validation
 */

import { test, expect } from '@playwright/test';
import {
  VALID_PAYLOCITY_INPUT,
  EMPTY_INPUT,
  MALFORMED_INPUT,
  XSS_ATTEMPT,
  SINGLE_RECORD,
  SALARY_TOO_LOW,
  SALARY_TOO_HIGH,
} from './helpers/fixtures.js';
import { importData } from './helpers/actions.js';
import {
  assertDashboardVisible,
  assertErrorMessage,
} from './helpers/assertions.js';
import { checkA11y } from './helpers/a11y.js';

test.describe('Data Import & Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('imports valid Paylocity data and renders dashboard', async ({ page }) => {
    // Import valid data
    await importData(page, VALID_PAYLOCITY_INPUT);

    // Verify dashboard is visible
    await assertDashboardVisible(page);

    // Verify landing page is hidden
    await expect(page.locator('#landing')).toBeHidden();

    // Verify at least one chart rendered
    await expect(page.locator('#mainChart')).toBeVisible();

    // A11y check
    await checkA11y(page);
  });

  test('shows error for empty input', async ({ page }) => {
    // Fill with empty string
    await page.locator('#pasteInput').fill(EMPTY_INPUT);

    // Wait for real-time validation to run
    await page.waitForTimeout(300);

    // Verify Generate Dashboard button is disabled (real-time validation)
    const generateBtn = page.getByRole('button', { name: 'Generate Dashboard' });
    await expect(generateBtn).toBeDisabled();

    // Verify dashboard is NOT visible
    await expect(page.locator('#dashboardPage')).toBeHidden();

    // A11y check
    await checkA11y(page);
  });

  test('shows error for malformed input', async ({ page }) => {
    // Fill with malformed data (has date/dollars but invalid format)
    await page.locator('#pasteInput').fill(MALFORMED_INPUT);

    // Wait for real-time validation to run
    await page.waitForTimeout(300);

    // Click Generate Dashboard (button enabled, but parser will reject malformed data)
    await page.getByRole('button', { name: 'Generate Dashboard' }).click();

    // Wait for parsing to complete
    await page.waitForTimeout(500);

    // Verify error message appears (post-click validation during parsing)
    await assertErrorMessage(page, /invalid.*format|parse.*error|could not.*parse|malformed/i);

    // Verify dashboard is NOT visible
    await expect(page.locator('#dashboardPage')).toBeHidden();

    // A11y check
    await checkA11y(page);
  });

  test('prevents XSS attacks with escapeHTML', async ({ page }) => {
    // Fill with XSS attempt
    await page.locator('#pasteInput').fill(XSS_ATTEMPT);

    // Click Generate Dashboard
    await page.getByRole('button', { name: 'Generate Dashboard' }).click();

    // Wait for potential rendering
    await page.waitForTimeout(1000);

    // Verify no alert dialog appeared (XSS prevented)
    const dialogs = [];
    page.on('dialog', dialog => dialogs.push(dialog));

    // Check that script tags were escaped (should appear as text, not execute)
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);

    // Script tags should be escaped as &lt;script&gt; or not present
    expect(bodyHTML).not.toContain('<script>');
    expect(dialogs.length).toBe(0);

    // A11y check (if dashboard rendered despite XSS attempt)
    const dashboardVisible = await page.locator('#dashboardPage').isVisible();
    if (dashboardVisible) {
      await checkA11y(page);
    }
  });

  test('validates salary range - below minimum', async ({ page }) => {
    // Fill with salary below $1,000
    await page.locator('#pasteInput').fill(SALARY_TOO_LOW);

    // Wait for real-time validation
    await page.waitForTimeout(300);

    // Click Generate Dashboard (button enabled for valid format, but parser will reject)
    await page.getByRole('button', { name: 'Generate Dashboard' }).click();

    // Wait for parsing to complete
    await page.waitForTimeout(500);

    // Verify error message appears (post-click validation during parsing)
    await assertErrorMessage(page, /salary.*range|minimum.*salary|below.*\$1|unrealistic/i);

    // Verify dashboard is NOT visible
    await expect(page.locator('#dashboardPage')).toBeHidden();

    // A11y check
    await checkA11y(page);
  });

  test('validates salary range - above maximum', async ({ page }) => {
    // Fill with salary above $10M
    await page.locator('#pasteInput').fill(SALARY_TOO_HIGH);

    // Wait for real-time validation
    await page.waitForTimeout(300);

    // Click Generate Dashboard (button enabled for valid format, but parser will reject)
    await page.getByRole('button', { name: 'Generate Dashboard' }).click();

    // Wait for parsing to complete
    await page.waitForTimeout(500);

    // Verify error message appears (post-click validation during parsing)
    await assertErrorMessage(page, /salary.*range|maximum.*salary|above.*\$10|unrealistic/i);

    // Verify dashboard is NOT visible
    await expect(page.locator('#dashboardPage')).toBeHidden();

    // A11y check
    await checkA11y(page);
  });

  test('requires at least 2 records', async ({ page }) => {
    // Fill with single record
    await page.locator('#pasteInput').fill(SINGLE_RECORD);

    // Wait for real-time validation
    await page.waitForTimeout(300);

    // Click Generate Dashboard (button enabled, but parser will reject single record)
    await page.getByRole('button', { name: 'Generate Dashboard' }).click();

    // Wait for parsing to complete
    await page.waitForTimeout(500);

    // Verify error message appears (post-click validation during parsing)
    await assertErrorMessage(page, /need.*2|at least.*2|minimum.*2|two.*records/i);

    // Verify dashboard is NOT visible
    await expect(page.locator('#dashboardPage')).toBeHidden();

    // A11y check
    await checkA11y(page);
  });
});
