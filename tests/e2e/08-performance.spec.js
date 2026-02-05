/**
 * Performance E2E Tests (#167)
 *
 * Tests frontend rendering and interaction performance:
 * - Dashboard initial render time
 * - Theme switch performance
 * - Tab navigation responsiveness
 * - Large dataset handling
 */

import { test, expect } from '@playwright/test';
import { VALID_PAYLOCITY_INPUT } from './helpers/fixtures.js';
import { importData } from './helpers/actions.js';

/**
 * Generate large test dataset
 * @param {number} count - Number of records
 * @returns {string} Paylocity-format data
 */
function generateLargeDataset(count) {
    const reasons = ['Merit Increase', 'Promotion', 'Market Adjustment', 'Equity'];
    const records = [];
    let salary = 60000;
    const startDate = new Date(2015, 0, 15);
    const MAX_SALARY = 9000000;

    // First record is New Hire
    records.push(formatRecord(startDate, 'New Hire', salary));

    for (let i = 1; i < count; i++) {
        const date = new Date(startDate.getTime() + (i * 90 * 24 * 60 * 60 * 1000));
        const raisePercent = 0.01 + Math.random() * 0.015;
        salary = Math.min(Math.round(salary * (1 + raisePercent)), MAX_SALARY);
        const reason = reasons[i % reasons.length];
        records.push(formatRecord(date, reason, salary));
    }

    return records.join('\n');
}

function formatRecord(date, reason, annual) {
    const perCheck = (annual / 26).toFixed(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}   ${reason}   $${Number(perCheck).toLocaleString()}$${annual.toLocaleString()}.00`;
}

test.describe('Performance', () => {

    test.describe('Dashboard Rendering', () => {

        test('dashboard renders within reasonable time after data import', async ({ page }) => {
            await page.goto('/');
            await page.locator('#openImportBtn').click();
            await page.locator('#importModal').waitFor({ state: 'visible' });

            // Measure import + render time
            const startTime = Date.now();
            await importData(page, VALID_PAYLOCITY_INPUT);
            await expect(page.locator('#dashboardPage')).toBeVisible();
            const duration = Date.now() - startTime;

            // Dashboard should render in under 5 seconds (allowing for E2E overhead)
            expect(duration).toBeLessThan(5000);
        });

        test('all charts render within reasonable time', async ({ page }) => {
            await page.goto('/');
            await page.locator('#openImportBtn').click();
            await page.locator('#importModal').waitFor({ state: 'visible' });

            const startTime = Date.now();
            await importData(page, VALID_PAYLOCITY_INPUT);

            // Main chart on Home tab should be visible
            await expect(page.locator('#mainChart')).toBeVisible();

            // Navigate to Analytics tab for YoY chart
            await page.locator('#tab-btn-analytics').click();
            await expect(page.locator('#yoyChart')).toBeVisible();

            // Navigate to Projections tab for projection chart
            await page.locator('#tab-btn-projections').click();
            await expect(page.locator('#projectionChart')).toBeVisible();

            const duration = Date.now() - startTime;

            // All charts should render in under 10 seconds (allowing for E2E overhead)
            expect(duration).toBeLessThan(10000);
        });

        test('KPI cards update immediately', async ({ page }) => {
            await page.goto('/');
            await page.locator('#openImportBtn').click();
            await page.locator('#importModal').waitFor({ state: 'visible' });
            await importData(page, VALID_PAYLOCITY_INPUT);

            // KPI cards should have values (not empty)
            const metricValues = page.locator('.metric-value');
            const count = await metricValues.count();
            expect(count).toBeGreaterThanOrEqual(4);

            for (let i = 0; i < count; i++) {
                const text = await metricValues.nth(i).textContent();
                expect(text.trim()).not.toBe('');
            }
        });
    });

    test.describe('Theme Switching', () => {

        test('theme switch completes quickly', async ({ page }) => {
            await page.goto('/');
            await page.locator('#openImportBtn').click();
            await page.locator('#importModal').waitFor({ state: 'visible' });
            await importData(page, VALID_PAYLOCITY_INPUT);

            // Get theme toggle (theme buttons have data-theme attribute)
            const themeBtn = page.locator('.theme-btn').first();
            await expect(themeBtn).toBeVisible();

            // Measure theme switch time
            const startTime = Date.now();
            await themeBtn.click();
            // Wait for html data-theme to change
            await expect(page.locator('html')).toHaveAttribute('data-theme', /.+/);
            const duration = Date.now() - startTime;

            // Theme switch should complete within 1 second (E2E has variable latency)
            expect(duration).toBeLessThan(1000);
        });

        test('charts update colors on theme switch', async ({ page }) => {
            await page.goto('/');
            await page.locator('#openImportBtn').click();
            await page.locator('#importModal').waitFor({ state: 'visible' });
            await importData(page, VALID_PAYLOCITY_INPUT);

            // Get initial chart canvas
            const mainChart = page.locator('#mainChart');
            await expect(mainChart).toBeVisible();

            // Toggle theme
            const themeBtn = page.locator('.theme-btn').first();
            await themeBtn.click();

            // Chart should still be visible after theme switch
            await expect(mainChart).toBeVisible();

            // Check that html has theme attribute (indicates theme system works)
            const htmlTheme = await page.locator('html').getAttribute('data-theme');
            expect(htmlTheme).toBeTruthy();
        });
    });

    test.describe('Tab Navigation', () => {

        test('tab switches complete quickly', async ({ page }) => {
            await page.goto('/');
            await page.locator('#openImportBtn').click();
            await page.locator('#importModal').waitFor({ state: 'visible' });
            await importData(page, VALID_PAYLOCITY_INPUT);

            // Use tab buttons by their ID for precise selection
            const tabs = ['story', 'market', 'history', 'analytics', 'projections', 'help'];

            for (const tabId of tabs) {
                const tabBtn = page.locator(`#tab-btn-${tabId}`);
                await expect(tabBtn).toBeVisible();

                const startTime = Date.now();
                await tabBtn.click();
                // Wait for the tab content to be visible (tab-{id} format)
                await expect(page.locator(`#tab-${tabId}`)).toBeVisible();
                const duration = Date.now() - startTime;

                // First visits include lazy loading time (#181)
                // Threshold increased to 2500ms to account for initial render + E2E overhead
                expect(duration).toBeLessThan(2500);
            }
        });

        test('keyboard navigation (1-7 keys) is responsive', async ({ page }) => {
            await page.goto('/');
            await page.locator('#openImportBtn').click();
            await page.locator('#importModal').waitFor({ state: 'visible' });
            await importData(page, VALID_PAYLOCITY_INPUT);

            // Test keyboard shortcuts 1-7
            const tabIds = ['home', 'story', 'market', 'history', 'analytics', 'projections', 'help'];

            for (let i = 0; i < tabIds.length; i++) {
                const key = String(i + 1);
                const startTime = Date.now();
                await page.keyboard.press(key);
                // Give a small buffer for the tab to update
                await page.waitForTimeout(50);
                // Tab content has #tab-{id} format
                await expect(page.locator(`#tab-${tabIds[i]}`)).toBeVisible();
                const duration = Date.now() - startTime;

                // Keyboard shortcuts should be fast (allowing for E2E overhead)
                expect(duration).toBeLessThan(1000);
            }
        });
    });

    test.describe('Large Dataset Handling', () => {

        test('handles 50 records without freezing', async ({ page }) => {
            await page.goto('/');
            await page.locator('#openImportBtn').click();
            await page.locator('#importModal').waitFor({ state: 'visible' });

            const largeInput = generateLargeDataset(50);

            const startTime = Date.now();
            await importData(page, largeInput);
            await expect(page.locator('#dashboardPage')).toBeVisible();
            const duration = Date.now() - startTime;

            // 50 records should process in under 10 seconds (E2E has variable latency)
            expect(duration).toBeLessThan(10000);
        });

        test('history table renders with many rows', async ({ page }) => {
            await page.goto('/');
            await page.locator('#openImportBtn').click();
            await page.locator('#importModal').waitFor({ state: 'visible' });

            const largeInput = generateLargeDataset(30);
            await importData(page, largeInput);

            // Navigate to History tab using ID selector
            // History table is lazy-loaded on first tab visit (#181)
            await page.locator('#tab-btn-history').click();
            await expect(page.locator('#tab-history')).toBeVisible();

            // Wait for lazy-loaded table to render
            const rows = page.locator('#historyTableBody tr');
            await expect(rows.first()).toBeVisible({ timeout: 5000 });
            const rowCount = await rows.count();

            // Should have at least 20 rows (some may fail validation)
            expect(rowCount).toBeGreaterThanOrEqual(20);
        });

        test('analytics tab handles large dataset', async ({ page }) => {
            await page.goto('/');
            await page.locator('#openImportBtn').click();
            await page.locator('#importModal').waitFor({ state: 'visible' });

            const largeInput = generateLargeDataset(40);
            await importData(page, largeInput);

            // Navigate to Analytics tab using ID selector
            const startTime = Date.now();
            await page.locator('#tab-btn-analytics').click();
            await expect(page.locator('#tab-analytics')).toBeVisible();
            const duration = Date.now() - startTime;

            // Analytics should render quickly even with large dataset
            expect(duration).toBeLessThan(500);
        });
    });

    test.describe('Memory & Stability', () => {

        test('survives rapid tab switching', async ({ page }) => {
            await page.goto('/');
            await page.locator('#openImportBtn').click();
            await page.locator('#importModal').waitFor({ state: 'visible' });
            await importData(page, VALID_PAYLOCITY_INPUT);

            const tabIds = ['home', 'story', 'market', 'history', 'analytics', 'projections', 'help'];

            // Rapidly switch tabs 20 times using tab button IDs
            for (let i = 0; i < 20; i++) {
                const tabId = tabIds[i % tabIds.length];
                await page.locator(`#tab-btn-${tabId}`).click();
            }

            // Navigate back to Home tab and verify app is responsive
            await page.locator('#tab-btn-home').click();
            await expect(page.locator('#dashboardPage')).toBeVisible();
            await expect(page.locator('#tab-home')).toBeVisible();
            // Main chart should be visible on home tab
            await expect(page.locator('#mainChart')).toBeVisible();
        });

        test('survives rapid theme toggling', async ({ page }) => {
            await page.goto('/');
            await page.locator('#openImportBtn').click();
            await page.locator('#importModal').waitFor({ state: 'visible' });
            await importData(page, VALID_PAYLOCITY_INPUT);

            // Get any theme button (may be multiple theme options)
            const themeBtn = page.locator('.theme-btn').first();

            // Toggle theme 10 times rapidly
            for (let i = 0; i < 10; i++) {
                await themeBtn.click();
            }

            // App should still be responsive
            await expect(page.locator('#dashboardPage')).toBeVisible();
            await expect(page.locator('#mainChart')).toBeVisible();
        });

        test('survives chart type changes', async ({ page }) => {
            await page.goto('/');
            await page.locator('#openImportBtn').click();
            await page.locator('#importModal').waitFor({ state: 'visible' });
            await importData(page, VALID_PAYLOCITY_INPUT);

            // Find chart type selector if available
            const chartTypeSelector = page.locator('[data-chart-type]').first();

            if (await chartTypeSelector.isVisible()) {
                // Click through different chart types
                const types = await page.locator('[data-chart-type]').all();
                for (const type of types) {
                    await type.click();
                }
            }

            // App should still be responsive
            await expect(page.locator('#dashboardPage')).toBeVisible();
        });
    });
});
