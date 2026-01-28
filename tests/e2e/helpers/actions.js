/**
 * Reusable Test Actions
 *
 * Common actions used across multiple test specs
 */

/**
 * Import data by pasting into textarea and clicking Import button
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} dataText - Paylocity format text to import
 */
export async function importData(page, dataText) {
  // Navigate to home if not already there
  await page.goto('/');

  // Fill the paste input textarea
  await page.locator('#pasteInput').fill(dataText);

  // Click Generate Dashboard button (triggers Chart.js lazy load)
  await page.getByRole('button', { name: 'Generate Dashboard' }).click();

  // Wait for dashboard to appear (implies Chart.js loaded successfully)
  // Dashboard won't be visible unless Chart.js loads and initializes
  await page.locator('#dashboardPage').waitFor({ state: 'visible', timeout: 15000 });

  // Wait for main chart canvas to render
  await page.locator('#mainChart').waitFor({ state: 'visible', timeout: 5000 });

  // Wait for chart to fully render (animations)
  await page.waitForTimeout(500);
}

/**
 * Switch theme (tactical ↔ artistic)
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} theme - Target theme: 'tactical' or 'artistic'
 */
export async function switchTheme(page, theme) {
  // Get current theme from HTML data attribute
  const currentTheme = await page.locator('html').getAttribute('data-theme');

  // Only toggle if we need to switch
  if (currentTheme !== theme) {
    // Click the specific theme button in the dashboard (not landing page)
    await page.locator('.theme-switcher .theme-btn').filter({ hasText: new RegExp(theme, 'i') }).click();

    // Wait for theme to apply (CSS custom properties)
    await page.waitForTimeout(300);

    // Wait for charts to rebuild (setTimeout in applyTheme)
    await page.waitForTimeout(500);
  }
}

/**
 * Switch to a specific tab
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} tabName - Tab name: 'home', 'story', 'market', 'history', 'analytics', 'projections', 'help'
 */
export async function switchTab(page, tabName) {
  // Find tab button by data-tab attribute
  await page.locator(`[data-tab="${tabName}"]`).click();

  // Wait for tab content to render (IDs have 'tab-' prefix)
  await page.locator(`#tab-${tabName}.tab-content.active`).waitFor({ state: 'visible' });

  // Wait for any charts in the tab to render
  await page.waitForTimeout(300);
}

/**
 * Toggle privacy mode (dollars ↔ indexed values)
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function togglePrivacyMode(page) {
  // Get current view mode
  const currentView = await page.locator('.view-btn.active').getAttribute('data-view');

  // Click the opposite button
  const targetView = currentView === 'dollars' ? 'index' : 'dollars';
  await page.locator(`.view-btn[data-view="${targetView}"]`).click();

  // Wait for state to update and UI to re-render
  await page.waitForTimeout(500);

  // Wait for the button active class to switch
  await page.locator(`.view-btn[data-view="${targetView}"].active`).waitFor({ state: 'visible', timeout: 2000 });
}

/**
 * Load a specific demo scenario by index
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} scenarioIndex - Scenario index: 0-3
 */
export async function loadDemoScenario(page, scenarioIndex) {
  // Navigate to home
  await page.goto('/');

  // Click "Try Example Data" button to load first scenario
  await page.getByRole('button', { name: 'Try Example Data' }).click();

  // Wait for dashboard to appear
  await page.locator('#mainChart').waitFor({ state: 'visible' });

  // Click "Regenerate Demo" button (scenarioIndex - 1) times to cycle
  for (let i = 0; i < scenarioIndex; i++) {
    await page.getByRole('button', { name: 'Regenerate Demo' }).click();
    await page.waitForTimeout(500); // Wait for charts to update
  }
}

/**
 * Export data as JSON (handles download and modal)
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @returns {Promise<Object>} - Downloaded JSON data
 */
export async function exportData(page) {
  // Start waiting for download before clicking
  const downloadPromise = page.waitForEvent('download');

  // Click Export Data button
  await page.locator('[data-testid="export-data-btn"]').click();

  // Wait for warning modal to appear
  await page.locator('#export-modal').waitFor({ state: 'visible' });

  // Click "I Understand, Export" button in modal
  await page.getByRole('button', { name: /I Understand.*Export/i }).click();

  // Wait for download to complete
  const download = await downloadPromise;

  // Read file contents
  const path = await download.path();
  const fs = await import('fs');
  const fileContent = fs.readFileSync(path, 'utf-8');

  return JSON.parse(fileContent);
}

/**
 * Import data from JSON (handles file upload and modal)
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} jsonData - JSON data to import
 */
export async function importJSON(page, jsonData) {
  // Switch to About tab (contains import button)
  await switchTab(page, 'about');

  // Click Import Data button
  await page.getByRole('button', { name: 'Import Data' }).click();

  // Wait for modal to appear
  await page.locator('#import-modal').waitFor({ state: 'visible' });

  // Fill textarea with JSON
  await page.locator('#import-json').fill(JSON.stringify(jsonData, null, 2));

  // Click confirm button
  await page.locator('[data-testid="import-data-confirm"]').click();

  // Wait for modal to close and dashboard to update
  await page.locator('#import-modal').waitFor({ state: 'hidden' });
  await page.waitForTimeout(500);
}

/**
 * Select chart type for main chart
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} chartType - Chart type: 'line', 'bar', 'area', 'step'
 */
export async function selectMainChartType(page, chartType) {
  await page.locator('[data-testid="main-chart-type"]').selectOption(chartType);
  await page.waitForTimeout(500); // Wait for chart to rebuild
}

/**
 * Select chart type for YoY chart
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} chartType - Chart type: 'bar', 'area'
 */
export async function selectYoYChartType(page, chartType) {
  await page.locator('[data-testid="yoy-chart-type"]').selectOption(chartType);
  await page.waitForTimeout(500); // Wait for chart to rebuild
}

/**
 * Set projection parameters
 *
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} params - Projection parameters
 * @param {number} params.years - Number of years (3, 5, 10, 20)
 * @param {number} params.raiseRate - Custom raise rate (3-8%)
 */
export async function setProjectionParams(page, { years, raiseRate }) {
  // Switch to Projection tab
  await switchTab(page, 'projection');

  // Select year range
  if (years) {
    await page.locator('#proj-years').selectOption(years.toString());
  }

  // Set custom raise rate
  if (raiseRate) {
    await page.locator('#custom-rate').fill(raiseRate.toString());
    await page.locator('#custom-rate').press('Enter');
  }

  // Wait for projection chart to update
  await page.waitForTimeout(500);
}
