/**
 * Test Data Fixtures
 *
 * Reusable test data constants for E2E tests
 */

/**
 * Valid Paylocity input - 5 records spanning 4 years
 * Simulates realistic salary progression for a software engineer
 * Format matches actual Paylocity "Rates" tab output (concatenated values)
 */
export const VALID_PAYLOCITY_INPUT = `01/15/2021   New Hire   $2,500.00$65,000.0031.25
07/01/2021   Merit Increase   $2,692.30$70,000.0033.65
01/01/2022   Promotion   $3,076.92$80,000.0038.46
07/01/2023   Merit Increase   $3,365.38$87,500.0042.07
01/01/2024   Market Adjustment   $3,846.15$100,000.0048.08`;

/**
 * Malformed input - missing dates, inconsistent format
 * Should trigger "Invalid format" error
 */
export const MALFORMED_INPUT = `Invalid line without date
Merit Increase $2,500.00
07/01/2021   Merit Increase   Invalid amount`;

/**
 * XSS attempt - script tags in reason field
 * Should be sanitized by escapeHTML()
 */
export const XSS_ATTEMPT = `01/15/2021   <script>alert('xss')</script>   $2,500.00$65,000.0031.25
07/01/2021   Merit<img src=x onerror=alert('xss')>   $2,692.30$70,000.0033.65`;

/**
 * Single record - insufficient for dashboard
 * Should trigger "Need 2+ records" error
 */
export const SINGLE_RECORD = `01/15/2021   New Hire   $2,500.00$65,000.0031.25`;

/**
 * Out-of-range salary - below $1,000 minimum
 * Should trigger validation error
 * Needs 2 records to pass record count check
 * Format: $30.77 per-check, $800.00 annual, 0.38 hourly (concatenated)
 */
export const SALARY_TOO_LOW = `01/15/2021   New Hire   $30.77$800.000.38
07/01/2021   Merit Increase   $32.31$840.000.40`;

/**
 * Out-of-range salary - above $10M maximum
 * Should trigger validation error
 * Needs 2 records to pass record count check
 */
export const SALARY_TOO_HIGH = `01/15/2021   New Hire   $500,000.00$13,000,000.006,250.00
07/01/2021   Merit Increase   $550,000.00$14,300,000.006,875.00`;

/**
 * Empty input - blank textarea
 * Should trigger "Paste your data" error
 */
export const EMPTY_INPUT = '';

/**
 * Demo scenario data - exported JSON format
 * Used for testing import functionality
 */
export const DEMO_SCENARIO_JSON = {
  version: '1.0',
  exportDate: '2024-01-15T10:30:00.000Z',
  data: [
    {
      date: '2021-01-15',
      reason: 'New Hire',
      perCheck: 2500.00,
      annual: 65000.00,
      hourlyRate: 31.25,
      change: 0,
      changePercent: 0,
    },
    {
      date: '2021-07-01',
      reason: 'Merit Increase',
      perCheck: 2692.30,
      annual: 70000.00,
      hourlyRate: 33.65,
      change: 5000.00,
      changePercent: 7.69,
    },
    {
      date: '2022-01-01',
      reason: 'Promotion',
      perCheck: 3076.92,
      annual: 80000.00,
      hourlyRate: 38.46,
      change: 10000.00,
      changePercent: 14.29,
    },
  ],
};

/**
 * Invalid JSON - malformed structure
 * Should trigger "Invalid JSON" error
 */
export const INVALID_JSON = `{
  "version": "1.0",
  "data": [
    { "date": "2021-01-15" // Missing closing brace
  ]
`;

/**
 * Expected demo scenario starting salaries
 * Used for verifying demo scenario loading
 */
export const DEMO_SCENARIOS = {
  earlyCareer: {
    startingSalary: 60000,
    endingSalary: 75000,
    years: 2,
  },
  growthPhase: {
    startingSalary: 60000,
    endingSalary: 100000,
    years: 5,
  },
  established: {
    startingSalary: 60000,
    endingSalary: 130000,
    years: 8,
  },
  seniorTenure: {
    startingSalary: 60000,
    endingSalary: 190000,
    years: 12,
  },
};

/**
 * Theme color values for verification
 * Extracted from CSS custom properties
 */
export const THEME_COLORS = {
  tactical: {
    bgPrimary: 'rgb(10, 10, 11)', // #0a0a0b
    textPrimary: 'rgb(238, 238, 238)', // #eeeeee
    accent: 'rgb(212, 175, 55)', // gold #d4af37
  },
  artistic: {
    bgPrimary: 'rgb(250, 248, 245)', // #faf8f5
    textPrimary: 'rgb(51, 51, 51)', // #333333
    accent: 'rgb(255, 87, 51)', // orange #ff5733
  },
};

/**
 * Tab names for navigation testing
 */
export const TABS = [
  'home',
  'story',
  'market',
  'history',
  'analytics',
  'projections',
  'help',
];

/**
 * KPI card labels for verification
 */
export const KPI_LABELS = [
  'Current Compensation',
  'Total Growth',
  'Years of Service',
  'Total Adjustments',
];
