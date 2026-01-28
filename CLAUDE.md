# Paylocity Compensation Journey - Project Guidelines

## Project Overview

Paylocity Compensation Journey transforms raw Paylocity pay history data into a comprehensive financial dashboard with visualizations, analytics, and benchmark comparisons. This single-file web app provides employees with insights that Paylocity's native interface doesn't offer.

**Live Demo**: https://tejasgadhia.github.io/paylocity-compensation-journey/

## Tech Stack

- **Core**: `index.html` (HTML + CSS) + modular JavaScript
- **JavaScript Modules**:
  - `app.js` - Main application logic
  - `js/calculations.js` - Financial calculation helpers
  - `js/constants.js` - Named constants (magic numbers eliminated)
  - `js/parser.js` - Paylocity data parser
- **Chart.js**: Self-hosted with SRI (`assets/js/chart.umd.min.js`)
- **Fonts**: Self-hosted JetBrains Mono, Space Grotesk
- **LocalStorage**: Theme preference persistence
- **Deployment**: GitHub Pages

## Architecture Principles

### Modular Application
- `index.html` contains HTML structure and inline CSS
- JavaScript split into focused modules (`app.js`, `js/*.js`)
- Self-hosted dependencies (Chart.js, fonts) with SRI
- No build process required
- Works completely offline after initial load

### State Management
```javascript
const state = {
  theme: 'tactical|artistic',
  showDollars: true,  // vs. indexed values
  currentTab: 'home',
  chartTypes: {...},  // Chart type per visualization
  projectionYears: 5,
  customRate: 6,
  currentScenarioIndex: 0
};
```

## Code Conventions

### JavaScript

**Global Objects**:
- `state` - UI state and preferences
- `employeeData` - Parsed compensation records
- `charts` - Chart.js instance storage
- `benchmarks` - Industry standards (B2B SaaS)

**Naming**:
- camelCase for functions: `calculateCAGR()`, `parsePaylocityData()`
- PascalCase for constants: `CPI_DATA`, `BENCHMARKS`
- Descriptive names: `buildMainChart()`, `updateStory()`

**Key Functions**:
- `parsePaylocityData(rawText)` - Main parser with regex
- `calculateCAGR(start, end, years)` - Compound annual growth
- `calculateRealGrowth(nominal, inflation)` - Inflation-adjusted growth
- `buildMainChart()` - Salary timeline visualization
- `updateMarket()` - Benchmark comparison rendering

### Data Structures

**Employee Record**:
```javascript
{
  date: '2023-01-15',
  reason: 'Merit Increase',
  perCheck: 2500.00,
  annual: 65000.00,
  hourlyRate: 31.25,
  change: 5000.00,
  changePercent: 8.33
}
```

**CPI Data (Inflation)**:
```javascript
const CPI_DATA = {
  2023: 4.1,
  2024: 3.4,
  // Annual inflation rates (%)
};
```

### CSS

**Theme System**:
- Tactical (dark): #0a0a0b background, gold/green/blue accents
- Artistic (light): #faf8f5 background, orange/teal/purple accents

**CSS Variables**:
```css
--primary-bg, --secondary-bg, --text-primary, --accent-color, etc.
```

**Layout**:
- Three-column dashboard layout
- CSS Grid for KPI cards
- Flexbox for charts and tables

## Parser Logic

### Paylocity Data Format

**Expected Input** (from Paylocity "Rates" tab):
```
01/15/2023   Merit Increase   $2,500.0065,000.0031.25
```

**Challenges**:
- Concatenated values without spaces
- Variable decimal places
- Inconsistent formatting
- Hourly rate sometimes missing

### Parsing Strategy

1. **Split by Lines**: Process each line individually
2. **Extract Date**: Regex for MM/DD/YYYY pattern
3. **Extract Values**: Multiple strategies:
   - Look for dollar amounts with regex
   - Handle concatenated values (split by decimal patterns)
   - Parse hourly rate (last number after last decimal)

**Validation**:
- Require 2+ records
- At least one adjustment (not just "New Hire")
- Valid date formats
- Realistic salary ranges

## Calculations

### CAGR (Compound Annual Growth Rate)
```javascript
function calculateCAGR(start, end, years) {
  return Math.pow(end / start, 1 / years) - 1;
}
```

### Real Growth (Inflation-Adjusted)
```javascript
function calculateRealGrowth(nominalGrowth, inflationRate) {
  return ((1 + nominalGrowth) / (1 + inflationRate)) - 1;
}
```

### Inflation-Adjusted Salary
- Year-by-year compounding with CPI data
- Supports partial years
- Forward and backward calculations

## Chart Management

### Chart Lifecycle
```javascript
// Always destroy before recreating
if (charts.main) {
  charts.main.destroy();
}

// Create new chart
charts.main = new Chart(ctx, config);
```

### Chart Types
- **Main Timeline**: Line/Bar/Area/Step (user-selectable)
- **YoY Comparison**: Bar chart with color coding
- **Category Breakdown**: Doughnut chart
- **Projection**: Line chart with forecast scenarios

### Theme Integration
- Charts inherit colors from CSS variables
- Rebuild charts on theme change (setTimeout 100ms)
- Tooltips styled to match theme

## Demo System

### Demo Scenarios
1. **Early Career**: $60K→$75K over 2 years
2. **Growth Phase**: $60K→$100K over 5 years
3. **Established**: $60K→$130K over 8 years
4. **Senior Tenure**: $60K→$190K over 12 years

### Regenerate Logic
- Cycle through 4 scenarios
- Reset to first scenario after reaching end
- Update all visualizations on change

## Tab System

### Tab Management
```javascript
function setTab(tabId) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

  // Show selected tab
  document.getElementById(tabId).classList.add('active');

  // Update URL hash
  window.location.hash = tabId;

  // Update specific content if needed
  if (tabId === 'market') updateMarket();
}
```

### Keyboard Shortcuts
- Keys 1-7: Switch tabs directly
- Cmd/Ctrl + K: Focus search/input

## Best Practices

### DO

- Parse with multiple fallback strategies (handle inconsistent formats)
- Validate data before rendering
- Destroy charts before recreation (prevent memory leaks)
- Use inflation data for real growth calculations
- Follow existing naming conventions
- Preserve privacy mode (indexed values option)

### DON'T

- Assume consistent Paylocity formatting
- Skip inflation adjustment in analyses
- Hardcode benchmark values (use `BENCHMARKS` constant)
- Create charts without destroying old instances
- Add external dependencies (keep it self-contained)
- Remove desktop-only restriction (mobile intentionally blocked)

## Common Tasks

### Adding a New Tab

1. Add HTML:
```html
<div class="tab-content" id="new-tab">
  <!-- Content -->
</div>
```

2. Add tab button:
```html
<button class="tab-btn" data-tab="new-tab">New Tab</button>
```

3. Add update logic in `setTab()`

### Adding a New Chart

1. Create canvas in HTML
2. Add build function:
```javascript
function buildNewChart() {
  if (charts.newChart) charts.newChart.destroy();

  const ctx = document.getElementById('new-chart').getContext('2d');
  charts.newChart = new Chart(ctx, config);
}
```

3. Call in appropriate tab's update function

### Updating Benchmarks

Modify `BENCHMARKS` object:
```javascript
const BENCHMARKS = {
  typicalRaise: { min: 3, max: 5, avg: 4 },
  // Update with latest industry data
};
```

## Deployment

**GitHub Pages**:
- Single file deployment
- No build process
- Push to `main` branch
- Automatic deployment

**Local Testing**:
```bash
open index.html
# or
python -m http.server 8000
```

## Privacy & Security

- **100% Client-Side**: No server communication
- **No Tracking**: No analytics, cookies, or external calls
- **Privacy Mode**: Toggle between actual dollars and indexed values
- **LocalStorage Only**: Theme preference only (no salary data stored)

## Performance

### Optimization Techniques
- Debounced input handling
- Efficient DOM updates (innerHTML on containers)
- Chart reuse with destroy/rebuild pattern
- Minimal re-renders (only on tab switch or data change)

### File Sizes
- `index.html`: ~120KB (HTML + CSS)
- `app.js`: ~25KB (main logic)
- Chart.js: ~200KB (self-hosted)
- Fonts: ~100KB (self-hosted TTF files)
- Fast load time with proper caching

## Error Handling

- Try-catch on parser with console.warn fallback
- Validation before parsing (progressive feedback)
- Graceful handling of missing CPI data (2.5% default)
- User-friendly error messages in UI

## Questions?

- Review `parsePaylocityData()` for parsing logic
- Check `buildMainChart()` for Chart.js usage
- See `calculateCAGR()` for calculation examples
- Examine `updateMarket()` for benchmark comparisons

Keep it self-contained, performant, and privacy-first!
