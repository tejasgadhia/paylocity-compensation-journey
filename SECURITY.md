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

## Privacy Audit Checklist

Follow these steps to independently verify our privacy claims:

### 1. Network Activity Audit (DevTools)

**Easiest method** — Real-time monitoring:

1. Open the app in your browser
2. Press `F12` (or `Cmd+Option+I` on Mac) to open DevTools
3. Click the **Network** tab
4. Clear existing requests (trash icon)
5. Import your Paylocity data and interact with the dashboard
6. **Expected result**: Zero new network requests after initial page load

**What you should NOT see**:
- No POST/PUT requests to external servers
- No analytics beacons (Google Analytics, Mixpanel, etc.)
- No tracking pixels
- No API calls to backend services

**What you WILL see**:
- Initial page load (HTML, CSS, JS, fonts)
- Requests to `blob:` URLs (Chart.js generated images for download)
- That's it!

### 2. Code Audit (Search for Network APIs)

**For technical users** — Verify source code contains no network calls:

1. Visit [GitHub repository](https://github.com/tejasgadhia/paylocity-compensation-journey)
2. Use GitHub's code search or clone locally
3. Search for these JavaScript network APIs:

```bash
# Commands to run in terminal (if cloned locally):
grep -r "fetch(" .
grep -r "XMLHttpRequest" .
grep -r "navigator.sendBeacon" .
grep -r "axios" .
grep -r "\.ajax" .
```

**Expected result**: Zero matches in application code (only in comments/documentation)

**Files to check**:
- `app.js` — Main application logic
- `js/parser.js` — Data parsing
- `js/charts.js` — Chart rendering
- `js/calculations.js` — Financial calculations
- `js/security.js` — Input validation

### 3. Storage Audit (What's Stored Locally)

**Check localStorage** — Only theme preference is stored:

1. Open DevTools → **Application** tab
2. Expand **Local Storage** → Select the app's origin
3. **Expected contents**:
   - `theme`: `"tactical"` or `"artistic"`
   - Nothing else (no salary data, no user info)

**Verify**:
- No cookies set (check **Cookies** section)
- No IndexedDB databases created
- No session storage used

### 4. Offline Test (Proof of Client-Side Only)

**Ultimate verification** — Works without internet:

1. Right-click the page → **Save Page As** → Save complete webpage
2. Disconnect from the internet (turn off WiFi, unplug ethernet)
3. Open the saved HTML file in your browser
4. Import your Paylocity data
5. **Expected result**: Everything works perfectly offline

**Why this matters**: If the app needed to send data anywhere, it would fail without internet. The fact that it works completely offline proves all processing is local.

### 5. Third-Party Security Scan

**Independent verification** — Use automated security tools:

**Option A: OWASP ZAP (Free)**
1. Install [OWASP ZAP](https://www.zaproxy.org/)
2. Configure ZAP as a proxy
3. Browse the app through ZAP
4. Check for unexpected network requests

**Option B: Mozilla Observatory**
1. Visit [Mozilla Observatory](https://observatory.mozilla.org/)
2. Scan the deployed URL
3. Review security headers and CSP policy

**Option C: Browser Extensions**
- **uBlock Origin**: Shows blocked requests in real-time
- **Privacy Badger**: Detects tracking attempts
- **NoScript**: See which scripts are loaded

## Network Monitoring Guide

For paranoid users who want real-time proof:

### Method 1: Browser DevTools (Easiest)

**Step-by-step**:
1. Open app in Chrome/Firefox/Edge
2. `F12` → **Network** tab
3. Filter: Click **All** to see everything
4. Clear log (trash icon)
5. Import data and use dashboard
6. **Watch**: Nothing appears except Chart.js blob URLs

**Tips**:
- Enable "Preserve log" to keep history across page reloads
- Filter by **XHR** or **Fetch** to see only AJAX requests (should be empty)
- Right-click any request → **Copy as cURL** to inspect

### Method 2: System-Level Monitoring (Advanced)

**macOS/Linux** — Monitor all network traffic from your browser:

```bash
# List all network connections (run while using app)
lsof -i -P | grep -i "chrome\|firefox"

# Monitor DNS lookups
sudo tcpdump -i any port 53

# Monitor HTTP/HTTPS traffic
sudo tcpdump -i any port 80 or port 443 -A
```

**Expected result**: No traffic after initial page load

**Windows** — Use Resource Monitor:
1. Press `Win+R` → type `resmon` → Enter
2. **Network** tab → Find your browser process
3. Watch **TCP Connections** while using the app
4. **Expected**: No new connections after page loads

### Method 3: Proxy Monitoring (Most Thorough)

**Using mitmproxy** (intercepts all HTTP/HTTPS):

```bash
# Install mitmproxy
pip install mitmproxy

# Start proxy
mitmproxy

# Configure browser to use proxy (localhost:8080)
# Install mitmproxy CA certificate
# Use the app and watch proxy logs
```

**Expected result**: Only initial page load, no subsequent requests

**Alternative**: Charles Proxy, Fiddler, Burp Suite (all free versions available)

### What You Should See

**Normal behavior**:
- Initial page load: HTML, CSS, JavaScript, fonts, Chart.js library
- Subsequent interactions: **Nothing**
- Chart downloads: `blob:` URLs (browser-generated, not network requests)

**Red flags** (if you see these, something is wrong):
- POST/PUT/PATCH requests to external domains
- Requests to analytics domains (google-analytics.com, mixpanel.com, etc.)
- Requests to CDNs after initial load
- DNS lookups for unknown domains
- WebSocket connections

### Common Questions

**Q: I see Chart.js requests on initial load. Is that okay?**
A: Yes! Chart.js is self-hosted (served from this domain with SRI hash). After initial load, no more Chart.js requests occur.

**Q: The page refreshes and makes new requests. Is data being sent?**
A: No. Browser refreshes reload the page (HTML/CSS/JS), but your imported data stays in browser memory and is NOT sent anywhere.

**Q: I see `blob:` URLs in Network tab. What are those?**
A: Blob URLs are browser-generated temporary URLs for downloads (e.g., saving charts as images). They're created locally and never sent to a server.

**Q: What about DNS lookups?**
A: Initial page load may cause DNS lookups to resolve the domain. After that, no new DNS lookups should occur because there are no network requests.

**Q: Does Content Security Policy guarantee privacy?**
A: CSP blocks unauthorized network requests at the browser level. Even if malicious code existed, the browser would block it. Check CSP header in DevTools → Network → select page → Headers tab → Look for `Content-Security-Policy`.

## Third-Party Audit Status

### Current Status
**Self-audited** — No paid third-party security audit has been commissioned.

**Why**: This is an open-source personal tool. Professional security audits cost $5,000-$20,000 and are typically commissioned by companies with budgets.

### How to Commission an Audit

If you or your organization want an independent audit:

1. **Choose a security firm**:
   - [Trail of Bits](https://www.trailofbits.com/)
   - [NCC Group](https://www.nccgroup.com/)
   - [Cure53](https://cure53.de/)
   - [Bishop Fox](https://bishopfox.com/)

2. **Scope the audit**:
   - Privacy verification (no data exfiltration)
   - XSS/injection vulnerability testing
   - CSP effectiveness
   - localStorage security
   - Supply chain analysis (Chart.js dependency)

3. **Share results publicly**:
   - If you commission an audit, please share findings via GitHub Issues
   - We'll link the report here and address any findings

### What Should Be Audited

**Privacy verification**:
- [ ] Confirm zero network requests after initial load
- [ ] Verify no data leaves browser (network monitoring)
- [ ] Test offline functionality works as claimed
- [ ] Inspect all JavaScript for hidden network calls
- [ ] Verify CSP blocks all external connections

**Security testing**:
- [ ] XSS injection attempts (user input fields)
- [ ] Template injection attacks
- [ ] localStorage manipulation attacks
- [ ] Supply chain analysis (Chart.js integrity)
- [ ] Browser compatibility security (Safari, Firefox, Chrome)

**Transparency verification**:
- [ ] Confirm source code on GitHub matches deployed version
- [ ] Verify no obfuscation or hidden functionality
- [ ] Check all external links are properly disclosed

### Invitation to Share Results

**If you perform an independent security audit** (whether formal or informal):
1. Open a GitHub Issue titled "Security Audit Results"
2. Share methodology, tools used, and findings
3. We'll link to your report in this document
4. Community benefits from independent verification

**Responsible Disclosure**: If you discover vulnerabilities, please follow our [responsible disclosure process](#reporting-a-vulnerability) before public disclosure.

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
