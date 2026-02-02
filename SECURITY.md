# Security Policy

## Security Architecture

Paylocity Compensation Journey implements defense-in-depth security with multiple protection layers.

## Threat Model

### In Scope
- **XSS (Cross-Site Scripting)**: User-provided data from Paylocity paste
- **Data Injection**: Malicious values in salary/date fields
- **Code Injection**: Attempts to inject JavaScript via data fields

### Out of Scope
- **Server-side attacks**: Tool is 100% client-side (no server)
- **Data exfiltration**: No network requests (CSP blocks all connections)
- **Persistent attacks**: No server storage or databases

## Security Controls

### 1. Content Security Policy (CSP)

**Location**: `index.html:6-16`

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  img-src 'self' data:;
  connect-src 'none';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
```

**Protection**:
- ✅ Blocks inline JavaScript (except external scripts)
- ✅ Blocks external script sources
- ✅ Blocks all network connections (`connect-src 'none'`)
- ✅ Prevents framing attacks
- ⚠️ Allows inline styles (`'unsafe-inline'` for `style-src`)

**Known Limitation**: `'unsafe-inline'` for styles is required for dynamic theme switching and Chart.js styling. This is an acceptable risk because:
1. No user input is used to generate `<style>` tags
2. All dynamic styles use CSS custom properties
3. Chart.js requires inline styles for canvas rendering

### 2. Input Validation (Parser)

**Location**: `js/parser.js`

#### Whitelist Approach (Lines 96-106)
```javascript
// Only allow specific reason strings
const reasons = ['Merit Increase', 'Promotion', 'Market Adjustment', 'Equity', 'New Hire'];
```

**Protection**:
- ✅ Only predefined strings allowed for reason field
- ✅ HTML tags stripped: `.replace(/<[^>]*>/g, '')`
- ✅ Rejects any unexpected input patterns

#### Range Validation (Lines 25-56)
```javascript
const ranges = {
  annual: { min: 1000, max: 10000000 },      // $1K - $10M
  perCheck: { min: 50, max: 400000 },        // $50 - $400K
  hourlyRate: { min: 1, max: 5000 },         // $1 - $5K
  change: { min: 0, max: 5000000 }           // $0 - $5M
};
```

**Protection**:
- ✅ Prevents extreme values that could break visualizations
- ✅ Validates numeric types (rejects NaN, Infinity)
- ✅ Throws errors on invalid data (fails safe)

### 3. Output Escaping

**Location**: `app.js:175-184`

```javascript
function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

**Usage**:
- ✅ `app.js:720` - User messages (banner display)
- ✅ `app.js:1151-1152` - Milestone titles and icons
- ✅ `app.js:1419` - History table reason field (user-controlled)

**Protection**:
- ✅ Escapes all HTML special characters
- ✅ Applied to all user-controlled strings before innerHTML insertion
- ✅ Prevents JavaScript execution via HTML injection

### 4. innerHTML Usage Audit

All `innerHTML` usages have been audited for XSS safety:

| Line | Location | Safety | Notes |
|------|----------|--------|-------|
| 173 | Example | ✅ Safe | Documentation only |
| 720 | `showMessage()` | ✅ Safe | Uses `escapeHTML()` |
| 1035 | `updateStory()` | ✅ Safe | Template contains only numeric values from `.toFixed()` |
| 1088 | `updateMarket()` | ✅ Safe | Only `<strong>` tags around numeric values |
| 1103 | `buildMarketComparison()` | ✅ Safe | All values numeric (toFixed, formatCurrency) |
| 1149 | `buildMilestones()` | ✅ Safe | Uses `escapeHTML()` on icon and title |
| 1164 | `buildMarketComparison()` error | ✅ Safe | Hardcoded string literal |
| 1228 | `buildMarketComparison()` cards | ✅ Safe | All values numeric or hardcoded strings |
| 1414 | `updateHistory()` table | ✅ Safe | Uses `escapeHTML(r.reason)` on user input |
| 1451 | `updateAnalytics()` intervals | ✅ Safe | All values numeric |

**Conclusion**: All innerHTML usages are safe. User-controlled strings are either:
1. Escaped with `escapeHTML()` before insertion, or
2. Validated/whitelisted by parser before storage

### 5. Template Validation

**Location**: `js/security.js`

```javascript
export function validateTemplateData(data) {
  // Validates all template interpolation values
  // Rejects functions, objects with methods, and suspicious types
}
```

**Protection**:
- ✅ Type checking on template data
- ✅ Rejects executable code
- ✅ Additional safety layer for template strings

## Verification

### XSS Test Cases

Test the following malicious payloads (all should be blocked):

1. **Script injection in reason field**:
   ```
   <script>alert('XSS')</script>
   ```
   Result: HTML tags stripped by parser (line 99), then escaped by escapeHTML()

2. **Event handler injection**:
   ```
   <img src=x onerror=alert(1)>
   ```
   Result: HTML tags stripped, `<` and `>` escaped

3. **JavaScript URL**:
   ```
   javascript:alert(1)
   ```
   Result: Treated as plain text, no URL context in app

4. **HTML entity injection**:
   ```
   &#60;script&#62;alert('XSS')&#60;/script&#62;
   ```
   Result: Entities not decoded, rendered as text

### Manual Testing

1. Paste data with `<script>alert(1)</script>` in reason field
2. Verify dashboard renders without executing script
3. Inspect rendered HTML → verify `&lt;script&gt;` escaping
4. Check browser console → no CSP violations
5. Try other payloads from test cases above

## Reporting Security Issues

**Do not open public GitHub issues for security vulnerabilities.**

Instead:
1. Email security concerns to the maintainer (see README for contact)
2. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

Response time: Within 48 hours for acknowledgment

## Security Best Practices

### For Users
- ✅ Only paste data from legitimate Paylocity exports
- ✅ Review data before parsing (no unexpected content)
- ✅ Use latest version (check GitHub releases)
- ✅ Report suspicious behavior immediately

### For Contributors
- ✅ Never use `innerHTML` without escaping user input
- ✅ Always use `escapeHTML()` for user-controlled strings
- ✅ Test XSS payloads before merging PRs
- ✅ Update this document when adding new features
- ✅ Run security tests: `npm test -- --grep "XSS|security"`

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-02 | Initial security documentation (Phase 1) |

## License

This security policy is part of the Paylocity Compensation Journey project.
See LICENSE.md for licensing terms.
