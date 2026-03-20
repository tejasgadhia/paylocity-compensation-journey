# Test Suite Documentation

Comprehensive testing for Paylocity Compensation Journey covering unit tests, E2E flows, and accessibility validation.

---

## Test Overview

**Coverage Areas**:
- Unit tests (Vitest) for parser, calculations, charts, security, performance, tables, and utilities
- Functional E2E tests (Playwright) for import, dashboard rendering, themes, charts, projections, export/import, and error handling
- Accessibility scans (axe-core) embedded in functional E2E coverage

---

## Quick Start

### Run All Tests

```bash
# Unit tests (Vitest)
npm test

# E2E tests (Playwright)
npm run test:e2e

# Both in sequence
npm test && npm run test:e2e
```

### Development Workflow

```bash
# Unit tests in watch mode (TDD)
npm run test:watch

# E2E tests in UI mode (interactive debugging)
npm run test:e2e:ui

# E2E tests in headed mode (see browser)
npm run test:e2e:headed

# E2E tests with debugger
npm run test:e2e:debug
```

### View Test Reports

```bash
# Unit test coverage report
npm run test:coverage
open coverage/index.html

# E2E test HTML report
npm run test:e2e:report
```

---

## Test Structure

### Unit Tests (`tests/`)

**Vitest** tests for core business logic:

```
tests/
├── parser.test.js            # 37 tests - parsePaylocityData(), parseRecord(), validateSalaryRange(), escapeHTML()
├── calculations.test.js      # 72 tests - CAGR, inflation, benchmarks, date formatting
├── charts.test.js            # 42 tests - chart config, theme colors, tooltips, updaters
├── security.test.js          # 38 tests - XSS prevention, input sanitization
├── security-extended.test.js # 20 tests - advanced security edge cases
├── tables.test.js            #  8 tests - getBadgeClass(), history table rendering
├── performance.test.js       # 15 tests - large dataset handling, memoization
└── utils.test.js             #  7 tests - debounce utility
```

**Run**: `npm test` (239 tests total)

### E2E Tests (`tests/e2e/`)

**Playwright** tests for user flows:

```
tests/e2e/
├── 01-data-import.spec.js         # 6 tests + 6 a11y - Data parsing, validation, errors
├── 02-dashboard-rendering.spec.js # 5 tests + 5 a11y - Tabs, KPIs, charts, tables
├── 03-theme-privacy.spec.js       # 4 tests + 4 a11y - Theme switching, privacy mode
├── 04-charts-interaction.spec.js  # 6 tests + 6 a11y - Chart types, legends, tooltips
├── 05-projections-demo.spec.js    # 5 tests + 5 a11y - Projections, demo scenarios
├── 06-export-import.spec.js       # Export/import flow coverage
├── 08-performance.spec.js         # Frontend performance checks
└── 10-error-handling.spec.js      # Recovery and resilience checks

helpers/
├── fixtures.js     # Test data constants (valid input, XSS attempts, demo scenarios)
├── actions.js      # Reusable actions (importData, switchTheme, switchTab)
├── assertions.js   # Custom assertions (assertKPIsVisible, assertChartRendered)
└── a11y.js         # Accessibility testing (axe-core integration)
```

**Run**: `npm run test:e2e`

**Browsers**: Chromium, Firefox, WebKit (desktop viewport: 1440×900)

---

## Test Categories

### 1. Data Import & Validation (6 tests)

**File**: `01-data-import.spec.js`

- ✅ Valid input → dashboard renders
- ✅ Empty input → error message
- ✅ Malformed input → graceful error
- ✅ XSS attempt → escapeHTML prevents injection
- ✅ Out-of-range salary → validation error
- ✅ Single record → "need 2+ records" error

**Key Verifications**:
- `parsePaylocityData()` called successfully
- Dashboard transitions from landing to data view
- Error messages user-friendly and actionable
- XSS attacks sanitized

---

### 2. Dashboard Rendering (5 tests)

**File**: `02-dashboard-rendering.spec.js`

- ✅ All 7 tabs present and clickable
- ✅ 6 KPI cards visible with values
- ✅ 3 charts rendered (main, YoY, projection)
- ✅ History table populated with records
- ✅ Initial state correct (Home tab active)

**Key Verifications**:
- All tabs accessible
- KPIs calculate correctly
- Chart.js canvases have non-zero dimensions
- Table rows match imported record count

---

### 3. Theme & Privacy (4 tests)

**File**: `03-theme-privacy.spec.js`

- ✅ Switch tactical → artistic (colors update)
- ✅ Switch artistic → tactical (colors update)
- ✅ Theme persists after reload (localStorage)
- ✅ Privacy mode toggles (dollars ↔ indexed)

**Key Verifications**:
- CSS custom properties change
- Charts rebuild with new theme colors
- localStorage contains correct theme key
- Currency formatting switches correctly

---

### 4. Chart Interactions (6 tests)

**File**: `04-charts-interaction.spec.js`

- ✅ Main chart type: line → bar → area → step
- ✅ YoY chart type: bar → line
- ✅ Chart data correctness (salary values realistic)
- ✅ Legend click toggles dataset visibility
- ✅ Tooltip displays on hover
- ✅ Chart rebuild on theme switch

**Key Verifications**:
- Chart type selector updates chart instance
- Data arrays match expected values
- Chart.js destroy/rebuild pattern works
- Visual regression: screenshot comparisons

---

### 5. Projections & Demo (5 tests)

**File**: `05-projections-demo.spec.js`

- ✅ Select year ranges (3, 5, 10 years)
- ✅ Custom raise rate input (3-8%)
- ✅ Projection chart updates
- ✅ Projection table shows correct values
- ✅ Demo scenarios cycle (1 → 2 → 3 → 4)

**Key Verifications**:
- Projection calculator recalculates on input change
- Chart displays future salary trajectory
- Table shows year-by-year projections
- Demo scenarios load correctly

---

### 6. Export/Import (4 tests - skipped if not implemented)

**File**: `06-export-import.spec.js`

- ✅ Export data as JSON (download triggered)
- ✅ Warning modal shows before export
- ✅ Import JSON restores data (all tabs)
- ✅ Invalid JSON shows error

**Key Verifications**:
- Download event fired
- Modal displays privacy warning
- Imported data matches exported data
- Error handling for malformed JSON

**Note**: Tests are skipped if export/import features not yet implemented.

---

## Accessibility Testing

**Every functional test includes WCAG 2.1 AA scan** using axe-core:

- 30 functional tests = 30 accessibility scans
- Validates: color contrast, ARIA labels, keyboard navigation, semantic HTML
- Standards: WCAG 2.0 A, WCAG 2.0 AA, WCAG 2.1 AA

**Example Output**:
```
❌ Accessibility violations found:
color-contrast (serious): Elements must have sufficient color contrast
  Ensure the contrast ratio of text is at least 4.5:1
  Affected nodes:
  <p class="kpi-label">Starting Salary</p>
```

**Fix violations** before merging PRs.

---

## Helper Functions

### Test Data Fixtures (`helpers/fixtures.js`)

```javascript
import { VALID_PAYLOCITY_INPUT, XSS_ATTEMPT, DEMO_SCENARIOS } from './helpers/fixtures.js';
```

**Available Fixtures**:
- `VALID_PAYLOCITY_INPUT` - 5-record sample
- `EMPTY_INPUT`, `MALFORMED_INPUT` - Error cases
- `XSS_ATTEMPT` - Security testing
- `SALARY_TOO_LOW`, `SALARY_TOO_HIGH` - Validation errors
- `DEMO_SCENARIO_JSON` - Export/import testing
- `THEME_COLORS` - Theme verification
- `TABS`, `KPI_LABELS` - UI constants

### Reusable Actions (`helpers/actions.js`)

```javascript
import { importData, switchTheme, switchTab } from './helpers/actions.js';

// Example usage
await importData(page, VALID_PAYLOCITY_INPUT);
await switchTheme(page, 'artistic');
await switchTab(page, 'home');
```

**Available Actions**:
- `importData(page, dataText)` - Paste and import
- `switchTheme(page, theme)` - Toggle theme
- `switchTab(page, tabName)` - Navigate to tab
- `togglePrivacyMode(page)` - Toggle dollars/indexed
- `loadDemoScenario(page, index)` - Cycle demo scenarios
- `setProjectionParams(page, { years, raiseRate })` - Set projection

### Custom Assertions (`helpers/assertions.js`)

```javascript
import { assertKPIsVisible, assertChartRendered } from './helpers/assertions.js';

// Example usage
await assertKPIsVisible(page);
await assertChartRendered(page, 'main-chart');
```

**Available Assertions**:
- `assertKPIsVisible(page)` - Verify 6 KPI cards
- `assertChartRendered(page, chartId)` - Verify canvas + Chart.js instance
- `assertTabsPresent(page)` - Verify all 7 tabs
- `assertThemeColors(page, theme)` - Verify CSS colors
- `assertDashboardVisible(page)` - Verify main view loaded
- `assertErrorMessage(page, text)` - Verify error displayed
- `assertHistoryTableRows(page, count)` - Verify table rows
- `assertModalVisible(page, modalId)` - Verify modal shown
- `assertPrivacyMode(page, showDollars)` - Verify privacy state
- `assertLocalStorage(page, key, value)` - Verify localStorage

---

## Debugging Tests

### UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

**Benefits**:
- Interactive test explorer
- Time-travel debugging (before/after each step)
- Visual step-through
- DOM snapshots
- Network activity

### Headed Mode

```bash
npm run test:e2e:headed
```

**Benefits**:
- See browser in real-time
- Useful for chart animations
- Visual debugging

### Debug Mode

```bash
npm run test:e2e:debug
```

**Benefits**:
- Breakpoints in tests
- Step through code
- Inspect page state

### Trace Viewer

```bash
# After test failure, view trace
npx playwright show-trace test-results/.../trace.zip
```

**Benefits**:
- Replay test execution
- See screenshots at each step
- Inspect network requests
- View console logs

---

## CI/CD Integration

**GitHub Actions** workflow runs on:
- Push to `main` branch
- Pull requests to `main`
- Manual workflow dispatch

**Workflow Jobs**:
1. **E2E Tests**: Run all Playwright tests (3 browsers)
2. **Unit Tests**: Run all Vitest tests

**Artifacts Uploaded**:
- Playwright HTML report (30 days retention)
- Test results with screenshots/videos (30 days)
- Coverage report (30 days)

**View Results**:
- GitHub Actions tab → Workflow run → Artifacts
- Download `playwright-report.zip` → Open `index.html`

---

## Writing New Tests

### 1. Add Test Data to Fixtures

```javascript
// tests/e2e/helpers/fixtures.js
export const NEW_TEST_DATA = `...`;
```

### 2. Create or Update Spec File

```javascript
// tests/e2e/08-new-feature.spec.js
import { test, expect } from '@playwright/test';
import { NEW_TEST_DATA } from './helpers/fixtures.js';
import { importData } from './helpers/actions.js';
import { checkA11y } from './helpers/a11y.js';

test.describe('New Feature', () => {
  test('does something awesome', async ({ page }) => {
    await page.goto('/');
    await importData(page, NEW_TEST_DATA);

    // Test logic here

    // Always include a11y check
    await checkA11y(page);
  });
});
```

### 3. Add Helper Functions if Needed

```javascript
// tests/e2e/helpers/actions.js
export async function newAction(page, params) {
  // Reusable action logic
}
```

### 4. Run and Verify

```bash
# Run new test file
npm run test:e2e -- 08-new-feature

# Run in UI mode for debugging
npm run test:e2e:ui
```

---

## Best Practices

### ✅ DO

- Use semantic selectors (`getByRole`, `getByLabel`) over `data-testid`
- Include accessibility checks in every test
- Wait for animations to stabilize before screenshots
- Write descriptive test names
- Use helper functions for reusable actions
- Test error states and edge cases

### ❌ DON'T

- Use fixed `waitForTimeout` unless for animations (prefer auto-wait)
- Skip accessibility tests (they're fast and critical)
- Hardcode URLs or data (use fixtures)
- Test implementation details (test user behavior)
- Ignore flaky tests (fix root cause or add retry logic)
- Let test docs drift away from the actual spec files

---

## Troubleshooting

### Flaky Tests

**Symptom**: Test passes sometimes, fails other times

**Causes**:
- Chart animations not settled
- Network timing
- Race conditions

**Solutions**:
```javascript
// Add explicit waits for animations
await page.waitForTimeout(1000); // Only for animations

// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for specific element
await page.locator('#main-chart').waitFor({ state: 'visible' });
```

### Accessibility Violations

**Symptom**: axe-core reports WCAG violations

**Causes**:
- Insufficient color contrast
- Missing ARIA labels
- Invalid HTML structure

**Solutions**:
1. Read violation details (includes CSS selector)
2. Fix HTML/CSS
3. Re-run tests
4. If violation is non-critical, exclude specific element:
```javascript
await checkA11y(page, { exclude: '#known-issue' });
```

---

## Performance

**Test Execution Times** (approximate):

- Unit tests: ~5 seconds (239 tests)
- E2E tests (1 browser): ~3 minutes
- E2E tests (3 browsers): ~9 minutes

**CI Total**: ~15 minutes (E2E + unit tests in parallel)

---

## Coverage Metrics

**Unit Test Coverage**:
- parser.js: 95%+
- calculations.js: 98%+
- constants.js: 100%

**E2E Test Coverage**:
- 10 critical user flows: 100%
- All 7 tabs: 100%
- Both themes: 100%
- Accessibility: 100% (WCAG AA scans on all tests)

**Grand Total**: 80%+ of user-facing functionality validated

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Questions?

- Review existing tests for patterns
- Check helper functions (`tests/e2e/helpers/`)
- Run tests in UI mode for visual debugging
- See AGENTS.md and docs/API.md for project architecture context

Happy testing! 🎉
