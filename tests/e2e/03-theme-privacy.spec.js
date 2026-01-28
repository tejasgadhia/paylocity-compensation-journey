/**
 * Theme & Privacy Mode Tests
 *
 * Tests for:
 * - Theme switching (tactical ↔ artistic)
 * - Theme color verification
 * - Theme persistence in localStorage
 * - Privacy mode toggle (dollars ↔ indexed values)
 */

import { test, expect } from '@playwright/test';
import { VALID_PAYLOCITY_INPUT } from './helpers/fixtures.js';
import { importData, switchTheme, togglePrivacyMode } from './helpers/actions.js';
import {
  assertThemeColors,
  assertLocalStorage,
  assertPrivacyMode,
} from './helpers/assertions.js';
import { checkA11y } from './helpers/a11y.js';

test.describe('Theme & Privacy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await importData(page, VALID_PAYLOCITY_INPUT);
  });

  test('switches from tactical to artistic theme', async ({ page }) => {
    // Ensure starting in tactical theme
    await switchTheme(page, 'tactical');

    // Verify tactical theme colors
    await assertThemeColors(page, 'tactical');

    // Switch to artistic
    await switchTheme(page, 'artistic');

    // Verify artistic theme colors
    await assertThemeColors(page, 'artistic');

    // A11y check
    await checkA11y(page);
  });

  test('switches from artistic to tactical theme', async ({ page }) => {
    // Ensure starting in artistic theme
    await switchTheme(page, 'artistic');

    // Verify artistic theme colors
    await assertThemeColors(page, 'artistic');

    // Switch to tactical
    await switchTheme(page, 'tactical');

    // Verify tactical theme colors
    await assertThemeColors(page, 'tactical');

    // A11y check
    await checkA11y(page);
  });

  test('persists theme preference in localStorage', async ({ page }) => {
    // Switch to artistic theme
    await switchTheme(page, 'artistic');

    // Verify localStorage contains artistic theme
    await assertLocalStorage(page, 'theme', 'artistic');

    // Reload page
    await page.reload();

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify artistic theme is still active
    await assertThemeColors(page, 'artistic');

    // A11y check
    await checkA11y(page);
  });

  test('toggles privacy mode between dollars and indexed values', async ({ page }) => {
    // Start in dollars mode (default)
    await assertPrivacyMode(page, true);

    // Toggle to indexed mode
    await togglePrivacyMode(page);

    // Verify indexed mode
    await assertPrivacyMode(page, false);

    // Toggle back to dollars
    await togglePrivacyMode(page);

    // Verify dollars mode
    await assertPrivacyMode(page, true);

    // A11y check
    await checkA11y(page);
  });
});
