# API Reference

Centralized documentation for all JavaScript modules in Paylocity Compensation Journey.

## Table of Contents

- [Parser Module](#parser-module-jsparserjs)
- [Calculations Module](#calculations-module-jscalculationsjs)
- [Charts Module](#charts-module-jschartsjs)
- [Constants Module](#constants-module-jsconstantsjs)
- [Security Module](#security-module-jssecurityjs)

---

## Parser Module (`js/parser.js`)

Handles parsing of raw Paylocity compensation data into structured records.

### parsePaylocityData(rawText)

Parses raw Paylocity compensation history data into structured records.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `rawText` | `string` | Raw text copied from Paylocity "Rates" tab |

**Returns:**
```javascript
{
  hireDate: string,      // Earliest record date (YYYY-MM-DD)
  currentDate: string,   // Most recent record date (YYYY-MM-DD)
  records: Array<{
    date: string,        // Record date (YYYY-MM-DD)
    reason: string,      // 'Merit Increase', 'Promotion', 'New Hire', etc.
    perCheck: number,    // Per-paycheck amount (bi-weekly)
    annual: number,      // Annual salary
    hourlyRate: number,  // Hourly rate (may be null)
    change: number,      // Dollar change from previous
    changePercent: number // Percentage change
  }>
}
```

**Throws:**
- `Error` - If no valid dates found in input
- `Error` - If no records could be parsed
- `Error` - If salary values outside valid range

**Example:**
```javascript
import { parsePaylocityData } from './js/parser.js';

const rawText = `01/15/2023   Merit Increase   $2,500.0065,000.0031.25
06/01/2022   New Hire         $2,307.6960,000.0028.85`;

const data = parsePaylocityData(rawText);
console.log(data.records[0].annual); // 65000
console.log(data.hireDate);          // "2022-06-01"
```

---

### parseRecord(dateStr, text)

Parses a single Paylocity compensation record from raw text.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `dateStr` | `string` | Date string in MM/DD/YYYY format |
| `text` | `string` | Raw record text containing reason and amounts |

**Returns:**
- `Object` - Parsed record with date, reason, perCheck, annual, hourlyRate, change, changePercent
- `null` - If record cannot be parsed (missing annual salary)

**Example:**
```javascript
import { parseRecord } from './js/parser.js';

const record = parseRecord("01/15/2023", "Merit Increase   $2,500.0065,000.0031.25");
// { date: "2023-01-15", reason: "Merit Increase",
//   perCheck: 2500, annual: 65000, hourlyRate: 31.25, ... }
```

---

### validateSalaryRange(value, fieldName)

Validates salary values are within reasonable ranges.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `value` | `number` | Salary value to validate |
| `fieldName` | `string` | Field type: `'annual'`, `'perCheck'`, `'hourlyRate'`, or `'change'` |

**Validation Ranges:**
| Field | Min | Max |
|-------|-----|-----|
| `annual` | $1,000 | $10,000,000 |
| `perCheck` | $50 | $400,000 |
| `hourlyRate` | $1 | $5,000 |
| `change` | $0 | $5,000,000 |

**Returns:** `number` - The validated value (unchanged)

**Throws:** `Error` - If value is outside valid range or not finite

**Example:**
```javascript
import { validateSalaryRange } from './js/parser.js';

validateSalaryRange(65000, 'annual');    // Returns 65000
validateSalaryRange(999999999, 'annual'); // Throws Error
```

---

## Calculations Module (`js/calculations.js`)

Financial calculation helpers for compensation analysis.

### calculateCAGR(employeeData)

Calculates Compound Annual Growth Rate for total compensation.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `employeeData` | `Object` | Parsed employee data from `parsePaylocityData()` |

**Returns:** `number` - CAGR as percentage (e.g., `8.5` for 8.5%)

**Edge Cases:**
- Returns `0` for invalid inputs (zero tenure, negative salaries)
- Uses simple percentage for very short tenure (<36 days)
- Caches result on `employeeData._cachedCAGR` for performance

**Example:**
```javascript
import { calculateCAGR } from './js/calculations.js';

// Starting: $60,000, Current: $100,000, Years: 5
const cagr = calculateCAGR(employeeData);
console.log(cagr); // ~10.8
```

---

### calculateRealGrowth(nominalGrowthPercent, inflationPercent)

Calculates inflation-adjusted (real) growth rate.

**Formula:** `Real Growth = ((1 + Nominal) / (1 + Inflation)) - 1`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `nominalGrowthPercent` | `number` | Nominal growth as percentage (e.g., `5` for 5%) |
| `inflationPercent` | `number` | Inflation rate as percentage (e.g., `3` for 3%) |

**Returns:** `number` - Real growth rate as percentage

**Example:**
```javascript
import { calculateRealGrowth } from './js/calculations.js';

const real = calculateRealGrowth(5, 3);
console.log(real); // ~1.94 (5% raise with 3% inflation)
```

---

### calculateInflationOverPeriod(startYear, endYear, startMonth?, endMonth?)

Calculates cumulative inflation over a specific time period.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `startYear` | `number` | - | Starting year (e.g., 2020) |
| `endYear` | `number` | - | Ending year (e.g., 2023) |
| `startMonth` | `number` | `0` | Starting month (0-indexed) |
| `endMonth` | `number` | `11` | Ending month (0-indexed) |

**Returns:** `number` - Cumulative inflation as percentage

**Example:**
```javascript
import { calculateInflationOverPeriod } from './js/calculations.js';

// Full years 2020-2023
const inflation = calculateInflationOverPeriod(2020, 2023);
console.log(inflation); // ~19.5%

// Partial year (March-October 2023)
const partial = calculateInflationOverPeriod(2023, 2023, 2, 9);
console.log(partial); // ~2.73%
```

---

### calculateInflationAdjustedSalary(salary, fromYear, toYear)

Applies cumulative CPI inflation to adjust a salary forward in time.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `salary` | `number` | Starting salary amount |
| `fromYear` | `number` | Year to adjust from |
| `toYear` | `number` | Year to adjust to |

**Returns:** `number` - Inflation-adjusted salary

**Example:**
```javascript
import { calculateInflationAdjustedSalary } from './js/calculations.js';

const adjusted = calculateInflationAdjustedSalary(65000, 2020, 2023);
console.log(adjusted); // ~$77,675
```

---

### getBenchmarkComparisons(employeeData, benchmarks)

Calculates comprehensive benchmark comparisons against industry standards.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `employeeData` | `Object` | Parsed employee data |
| `benchmarks` | `Object` | Industry benchmark data (from `js/constants.js`) |

**Returns:** `Object | null` - Benchmark comparison metrics, or `null` if no data

```javascript
{
  // User metrics
  avgRaise: number,           // Average raise percentage
  userCagr: number,           // User's CAGR
  avgMonthsBetween: number,   // Average months between raises
  totalRaises: number,        // Count of raises

  // Growth comparisons
  nominalGrowth: number,      // Total nominal growth %
  totalInflation: number,     // Total inflation over period
  realGrowth: number,         // Inflation-adjusted growth %
  purchasingPowerGain: number, // Dollar gain above inflation

  // Industry comparisons
  industryProjectedSalary: number, // Expected salary at industry CAGR
  vsIndustrySalary: number,        // Difference from industry projection
  cagrVsIndustry: number,          // CAGR difference from industry

  // Performance tier
  performanceTier: 'high' | 'solid' | 'below'
}
```

---

### getStartingSalary(employeeData)

Gets the starting salary from employee data.

**Returns:** `number` - Starting annual salary (earliest record)

---

### getCurrentSalary(employeeData)

Gets the current salary from employee data.

**Returns:** `number` - Current annual salary (most recent record)

---

### calculateYearsOfService(employeeData)

Calculates years of service from hire date to current date.

**Returns:** `number` - Years of service as decimal (e.g., `3.5`)

---

### calculateAverageMonthsBetweenDates(records, defaultValue?)

Calculates average months between adjustment dates.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `records` | `Array` | - | Records with `date` field (exclude "New Hire") |
| `defaultValue` | `number` | `12` | Default if insufficient records |

**Returns:** `number` - Average months between adjustments

---

## Charts Module (`js/charts.js`)

Chart.js wrapper functions for building and updating visualizations.

### initCharts(deps)

**Required:** Call once before using any chart functions.

**Parameters:**
```javascript
initCharts({
  state: Object,              // UI state object
  charts: Object,             // Chart.js instances storage
  getEmployeeData: Function,  // Returns current employee data
  showUserMessage: Function   // Displays user messages
});
```

---

### buildMainChart()

Builds the main compensation timeline chart.

**Chart Types:** Line, Bar, Area, Step (via `state.mainChartType`)
**View Modes:** Dollars or Index (via `state.showDollars`)

---

### buildYoyChart()

Builds the year-over-year salary growth chart.

**Chart Types:** Bar or Line (via `state.yoyChartType`)

---

### buildCategoryChart()

Builds the category breakdown doughnut chart.

Groups salary adjustments by reason (Merit, Promotion, etc.)

---

### buildProjectionChart()

Builds the salary projection chart with 4 scenarios:
- Historical CAGR
- Conservative (5%)
- Custom (user-adjustable)
- Optimistic (12%)

---

### updateMainChartType()

Efficiently updates main chart type without full rebuild.

**Performance:** ~5-10ms vs 20-40ms for full rebuild

---

### updateYoyChartType()

Efficiently updates YoY chart type without full rebuild.

---

### updateProjectionChartData()

Updates projection chart data (years, custom rate) without full rebuild.

---

### updateChartTheme(chart)

Updates chart colors to match current theme without rebuilding.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `chart` | `Chart` | Chart.js instance to update |

---

### getThemeColors()

Gets theme-aware colors from CSS custom properties.

**Returns:**
```javascript
{
  line1: string,   // Primary line color
  line2: string,   // Secondary line color
  fill1: string,   // Primary fill color
  fill2: string,   // Secondary fill color
  grid: string,    // Grid line color
  text: string,    // Text color
  accent: string   // Accent color
}
```

---

### getChartContext(canvasId, chartName)

Gets canvas 2D context with validation and error handling.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `canvasId` | `string` | DOM ID of the canvas element |
| `chartName` | `string` | Human-readable name for error messages |

**Returns:** `CanvasRenderingContext2D | null`

---

### getTooltipConfig(options?)

Factory function for Chart.js tooltip configuration.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `options.labelCallback` | `Function` | Identity | Custom label formatter |
| `options.padding` | `number` | `12` | Tooltip padding |
| `options.displayColors` | `boolean` | `false` | Show dataset colors |

**Returns:** Chart.js tooltip configuration object

---

## Constants Module (`js/constants.js`)

Configuration values and reference data.

### CONSTANTS

Application-wide configuration values.

| Key | Type | Value | Description |
|-----|------|-------|-------------|
| `MIN_REALISTIC_SALARY` | `number` | `1000` | Minimum salary for validation |
| `MAX_REALISTIC_SALARY` | `number` | `10000000` | Maximum salary for validation |
| `MS_PER_DAY` | `number` | `86400000` | Milliseconds per day |
| `MS_PER_YEAR` | `number` | `31557600000` | Milliseconds per year |
| `DEFAULT_CPI_RATE` | `number` | `2.5` | Default inflation when data missing |
| `PROJECTION_RATE_CONSERVATIVE` | `number` | `0.05` | 5% conservative growth |
| `PROJECTION_RATE_OPTIMISTIC` | `number` | `0.12` | 12% optimistic growth |
| `CHART_ANIMATION_DURATION` | `number` | `300` | Chart animation ms |
| `MOBILE_BREAKPOINT` | `number` | `900` | Mobile splash breakpoint |

---

### cpiData

US CPI-U Annual Inflation Rates (%).

```javascript
{
  2010: 1.6, 2011: 3.2, 2012: 2.1, 2013: 1.5, 2014: 1.6,
  2015: 0.1, 2016: 1.3, 2017: 2.1, 2018: 2.4, 2019: 1.8,
  2020: 1.2, 2021: 4.7, 2022: 8.0, 2023: 4.1, 2024: 2.9,
  2025: 2.5 // Projected
}
```

**Source:** Bureau of Labor Statistics

---

### benchmarks

Industry benchmark data for B2B SaaS compensation.

```javascript
{
  typicalRaise: { min: 3, max: 5, avg: 4 },
  highPerformerRaise: { min: 6, max: 10, avg: 8 },
  promotionBump: { min: 10, max: 20, avg: 15 },
  industryCagr: 6,
  avgMonthsBetweenRaises: 12,
  lastUpdated: '2025'
}
```

**Sources:** Radford, Mercer, Levels.fyi, Glassdoor

---

## Security Module (`js/security.js`)

Security utilities for XSS prevention.

### validateTemplateData(data)

Validates template data for XSS patterns before innerHTML usage.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `data` | `Object` | Key-value pairs to validate |

**Checks:**
- Unsafe types (objects, functions, symbols)
- Script injection (`<script`, `javascript:`)
- Event handlers (`onclick=`, `onerror=`)
- Iframe injection (`<iframe`)

**Throws:** `Error` - If unsafe data type or suspicious pattern detected

**Example:**
```javascript
import { validateTemplateData } from './js/security.js';

// Valid - passes silently
validateTemplateData({ name: 'John', amount: 65000 });

// Invalid - throws Error
validateTemplateData({ bio: '<script>alert(1)</script>' });
// Error: Suspicious pattern in template data: bio contains /<script/i
```

---

## Usage Patterns

### Parsing Flow

```javascript
import { parsePaylocityData } from './js/parser.js';
import { calculateCAGR, getBenchmarkComparisons } from './js/calculations.js';
import { benchmarks } from './js/constants.js';

// 1. Parse raw data
const employeeData = parsePaylocityData(rawText);

// 2. Calculate metrics
const cagr = calculateCAGR(employeeData);
const comparisons = getBenchmarkComparisons(employeeData, benchmarks);

// 3. Use in UI
console.log(`Your CAGR: ${cagr.toFixed(1)}%`);
console.log(`vs Industry: ${comparisons.cagrVsIndustry > 0 ? '+' : ''}${comparisons.cagrVsIndustry.toFixed(1)}%`);
```

### Chart Initialization

```javascript
import { initCharts, buildMainChart, buildYoyChart } from './js/charts.js';

// 1. Initialize with dependencies
initCharts({
  state: appState,
  charts: chartInstances,
  getEmployeeData: () => employeeData,
  showUserMessage: (msg, type) => { /* display message */ }
});

// 2. Build charts
buildMainChart();
buildYoyChart();
```

### Theme Updates

```javascript
import { updateChartTheme } from './js/charts.js';

// Update all charts on theme change
Object.values(charts).forEach(chart => {
  if (chart) updateChartTheme(chart);
});
```
