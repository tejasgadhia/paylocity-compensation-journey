# Resume E2E Test Fixes - Next Session

**Context at 10% - Wrapping up for next session**

## What We Fixed This Session ✅

1. **Chart.js CDN wait** - Added `waitForFunction(() => window.Chart !== undefined)`
2. **Fixture format** - Updated all fixtures to have `$` on per-check AND annual: `$2,500.00$65,000.0031.25`
3. **Salary range fixtures** - Added 2nd record to pass record count validation

## Current Blocker 🚨

**Chart.js NOT LOADING in tests!**
- Error: `TimeoutError: page.waitForFunction: Timeout 10000ms exceeded`
- Location: `tests/e2e/helpers/actions.js:18`
- Issue: `window.Chart` never becomes defined

### Possible Causes:
1. CSP blocking Chart.js CDN in test environment
2. Script tag not in index.html (check if Chart.js is dynamically loaded)
3. Test server not serving external scripts
4. Network issue in Playwright browser context

### Debug Steps:
```bash
# Check if Chart.js script tag exists in index.html
grep -n "chart.js\|Chart.js" index.html

# Check if Chart.js is loaded dynamically
grep -n "loadChartJS\|createElement.*script" app.js | head -20

# Run test with trace to see network requests
npm run test:e2e -- tests/e2e/01-data-import.spec.js:35 --project=chromium --trace on
```

## Test Status

**1/7 passing** (XSS test)

Failures:
1. ❌ Valid import - Chart.js timeout
2. ⚠️ Empty input - A11y violations (landing page)
3. ❌ Malformed - #validationMessage not visible
4. ❌ Salary too low - #validationMessage not visible
5. ❌ Salary too high - #validationMessage not visible
6. ⚠️ 2+ records - A11y violations (landing page)

## Files Modified

- `tests/e2e/helpers/actions.js` - Added Chart.js wait
- `tests/e2e/helpers/fixtures.js` - Fixed all fixture formats (added $ signs)
- `tests/e2e/01-data-import.spec.js` - Updated validation test logic

## Correct Paylocity Format (Confirmed)

From screenshot:
```
10/01/2021   Merit Increase   $2,239.58   25.8413 / Hour   $53,750.00
```

When copied (spaces collapse):
```
10/01/2021   Merit Increase   $2,239.58$53,750.0025.8413
```

Parser regex `/\$([0-9,]+\.\d{2})/g` matches:
- ✅ `$2,239.58` (per check)
- ✅ `$53,750.00` (annual)
- Hourly extracted separately (no $ needed)

## Next Actions (Priority)

1. **Fix Chart.js loading** - Check if script is dynamically loaded, add await
2. **#validationMessage visibility** - Tests 3-5 need investigation
3. **A11y landing page** - Skip a11y check when dashboard hidden (Tests 2, 6)

## Commands

```bash
# Check Chart.js loading
grep -A 5 "loadChartJS\|chart.js" index.html app.js

# Run single test with debug
npm run test:e2e -- tests/e2e/01-data-import.spec.js:35 --project=chromium --debug

# Full suite
npm run test:e2e -- tests/e2e/01-data-import.spec.js --project=chromium
```

**Resume with**: Debug why Chart.js isn't loading in test environment!
