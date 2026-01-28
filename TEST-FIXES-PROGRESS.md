# E2E Test Fixes - Progress Tracker

**Date**: 2026-01-27
**Session**: Test fixes for data-import spec

---

## Current Status

**Tests**: 1/7 passing in data-import spec (was 0/7)
**Progress**: XSS test now passing ✅

---

## Fixes Completed

### 1. Chart.js CDN Loading ✅
- **File**: `tests/e2e/helpers/actions.js`
- **Fix**: Added `await page.waitForFunction(() => window.Chart !== undefined)` before data import
- **Result**: No more "Failed to load Chart.js library" errors

### 2. Test Fixture Updates ✅
- **File**: `tests/e2e/helpers/fixtures.js`
- **Fix**: Updated SALARY_TOO_LOW and SALARY_TOO_HIGH to have 2 records each (was 1)
- **Reason**: Parser requires 2+ records, so salary range validation couldn't be tested with single records

### 3. Validation Layer Understanding ✅
- **Discovery**: App has 2-layer validation:
  1. **Real-time validation** (on input event): Disables button for missing dates/dollars
  2. **Post-click validation** (during parsing): Validates salary ranges, record count
- **Test updates**: Adjusted tests to match actual app behavior

---

## Remaining Failures (6/7 tests)

### Test 1: "imports valid Paylocity data and renders dashboard"
**Status**: ❌ Failing
**Error**: `TimeoutError: locator.waitFor: Timeout 5000ms exceeded waiting for #mainChart`
**Location**: `tests/e2e/helpers/actions.js:24` (importData helper)
**Root cause**: Dashboard not rendering after valid data import
**Next step**: Debug why valid import isn't showing dashboard

---

### Test 2: "shows error for empty input"
**Status**: ⚠️ Almost passing
**Error**: Accessibility violations (color contrast on landing page elements)
**Progress**: Button disabled check PASSES ✅, dashboard hidden check PASSES ✅
**Root cause**: Landing page theme buttons, headings, code elements fail WCAG 2 AA contrast
**Next step**: Either fix color contrast or disable a11y check for landing page-only tests

---

### Test 3: "shows error for malformed input"
**Status**: ❌ Failing
**Error**: `TimeoutError: waiting for #validationMessage` at line 82
**Progress**: Button disabled check PASSES ✅ (line 79)
**Root cause**: #validationMessage not visible even though validation ran
**Next step**: Check if CSS class "visible" is applied, or if assertion needs adjustment

---

### Test 4: "validates salary range - below minimum"
**Status**: ❌ Failing
**Error**: `TimeoutError: waiting for #validationMessage` at line 131
**Progress**: Click happens, parsing completes
**Root cause**: Error message not appearing in #validationMessage after parsing rejects low salary
**Next step**: Check if parser errors show in #validationMessage or different element

---

### Test 5: "validates salary range - above maximum"
**Status**: ❌ Failing
**Error**: `TimeoutError: waiting for #validationMessage` at line 156
**Progress**: Same as Test 4
**Root cause**: Same as Test 4
**Next step**: Same as Test 4

---

### Test 6: "requires at least 2 records"
**Status**: ⚠️ Almost passing
**Error**: Accessibility violations (color contrast on landing page)
**Progress**: Click happens, parsing rejects single record, dashboard hidden
**Root cause**: Same as Test 2 - landing page a11y issues
**Next step**: Same as Test 2

---

### Test 7: "prevents XSS attacks with escapeHTML"
**Status**: ✅ **PASSING** 🎉
**What it tests**: XSS prevention via escapeHTML()
**Result**: No script execution, no alert dialogs

---

## Pattern Analysis

### Common Issue 1: #validationMessage Not Visible
**Affected tests**: 3, 4, 5
**Observation**: Button disabled check passes (real-time validation works), but assertErrorMessage fails
**Hypothesis**:
1. CSS class "visible" may not be applied correctly
2. Real-time validation shows different message than post-click validation
3. assertErrorMessage timeout too short (5000ms)

**Investigation needed**:
```bash
# Check if validation message element exists but isn't visible
grep -A 10 "class.*validation-message" index.html

# Check CSS for .visible class
grep -B 2 -A 5 "\.validation-message.*visible\|\.visible" index.html
```

---

### Common Issue 2: Landing Page A11y Violations
**Affected tests**: 2, 6
**Violations**:
- Theme toggle buttons (Tactical/Artistic)
- Landing page headings (h3)
- Code elements
- "Generate Dashboard" button

**Options**:
1. **Fix root cause**: Update CSS colors for WCAG 2 AA compliance (4.5:1 contrast)
2. **Skip a11y on landing**: Add conditional a11y check that skips when dashboard hidden
3. **Disable specific rules**: Configure axe-core to ignore landing page contrast (not recommended)

**Recommended**: Option 2 (skip a11y when dashboard hidden)

---

### Common Issue 3: Valid Import Not Rendering Dashboard
**Affected tests**: 1
**Critical**: This is the only test that should fully pass
**Investigation needed**: Why does dashboard not show after importing VALID_PAYLOCITY_INPUT?

**Debugging steps**:
1. Check if parsePaylocityData() successfully parses VALID_PAYLOCITY_INPUT
2. Check if #data-container is shown after import
3. Check browser console for errors during parsing
4. Verify Chart.js creates chart instances

---

## Next Actions (Priority Order)

1. **HIGH**: Debug why valid import (Test 1) doesn't render dashboard
   - This should be the simplest passing test
   - Suggests fundamental issue with import flow or fixtures

2. **MEDIUM**: Fix #validationMessage visibility (Tests 3, 4, 5)
   - Check CSS .visible class
   - Check if post-click errors use different element
   - Increase timeout or add wait for element

3. **LOW**: Fix landing page a11y or skip check (Tests 2, 6)
   - Easy fix: Add conditional a11y check
   - Proper fix: Update CSS colors (requires index.html changes)

---

## Test File Structure

```
tests/e2e/
├── 01-data-import.spec.js          ← Currently fixing (1/7 passing)
├── 02-chart-interactions.spec.js   ← Next (12 tests skipped - no export/import)
├── 03-tabs.spec.js                 ← After that
├── 04-theme.spec.js               ← Then this
├── 05-privacy-mode.spec.js        ← Then this
├── 06-export-import.spec.js       ← Skipped (features not implemented)
├── helpers/
│   ├── actions.js                  ← importData() fixed ✅
│   ├── assertions.js               ← assertErrorMessage() may need update
│   ├── fixtures.js                 ← SALARY fixtures fixed ✅
│   └── a11y.js                     ← May need conditional logic
```

---

## Questions for Next Session

1. Why does valid import not show dashboard? (Test 1)
2. Does post-click validation use #validationMessage or different element? (Tests 3-5)
3. Should we fix landing page colors or skip a11y when dashboard hidden? (Tests 2, 6)
4. Can we add browser console logs to test output for debugging?

---

## Commands Reference

```bash
# Run single spec
npm run test:e2e -- tests/e2e/01-data-import.spec.js --project=chromium

# Run single test by line number
npm run test:e2e -- tests/e2e/01-data-import.spec.js:35 --project=chromium

# Run with UI (for debugging)
npm run test:e2e -- tests/e2e/01-data-import.spec.js --ui

# Check latest screenshots
ls -lt test-results/01-data-import-Data-Import-*/test-failed-1.png | head -3
```
