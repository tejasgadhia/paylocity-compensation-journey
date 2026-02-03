// ========================================
// CONSTANTS
// ========================================

export const CONSTANTS = {
    // Salary validation
    MIN_REALISTIC_SALARY: 1000,         // $1K minimum (sanity check)
    MAX_REALISTIC_SALARY: 10000000,     // $10M maximum (executive cap)

    // Salary milestones
    SALARY_SIX_FIGURES: 100000,         // $100K milestone
    SALARY_200K_MILESTONE: 200000,      // $200K milestone
    YEARS_DECADE_SERVICE: 10,           // 10-year service milestone

    // Time conversion constants
    MILLISECONDS_PER_SECOND: 1000,
    SECONDS_PER_MINUTE: 60,
    MINUTES_PER_HOUR: 60,
    HOURS_PER_DAY: 24,
    DAYS_PER_MONTH_AVG: 30,             // Approximate (used for rough calculations)
    DAYS_PER_YEAR: 365.25,              // Accounts for leap years

    // Derived constants (computed once, reused everywhere)
    // MS_PER_DAY = 1000 * 60 * 60 * 24 = 86,400,000
    MS_PER_DAY: 86400000,
    // MS_PER_YEAR = 86,400,000 * 365.25 = 31,557,600,000
    MS_PER_YEAR: 31557600000,

    // Paycheck calculations
    PAY_PERIODS_PER_YEAR: 24,           // Used in Paylocity data conversions

    // Time intervals
    TYPICAL_RAISE_INTERVAL_MONTHS: 12,  // Annual review cycle
    CAGR_MIN_YEARS_THRESHOLD: 0.1,      // ~36 days minimum for CAGR calculation
    CAGR_MIN_YEARS_WARNING: 1,          // Warn if <1 year of data

    // Inflation defaults
    DEFAULT_CPI_RATE: 2.5,              // Default CPI when data missing (%)

    // Projection rates
    PROJECTION_RATE_CONSERVATIVE: 0.05,  // 5% conservative growth
    PROJECTION_RATE_OPTIMISTIC: 0.12,    // 12% optimistic growth

    // Chart configuration
    CHART_ANIMATION_DURATION: 300,      // ms for smooth transitions
    CHART_UPDATE_MODE: 'none',          // No animation on theme updates
    CHART_REBUILD_DELAY: 100,           // ms delay for rebuilds (if needed)

    // UI delays
    ERROR_MESSAGE_AUTO_DISMISS: 5000,   // ms before auto-removing error banners
    THEME_SWITCH_DELAY: 100,            // ms delay after theme change

    // LocalStorage keys
    STORAGE_KEY_THEME: 'theme',
    STORAGE_KEY_DEMO_BANNER: 'demoBannerDismissed',

    // Screen size breakpoints
    MOBILE_BREAKPOINT: 900,             // px - below this shows mobile splash

    // Demo scenarios
    DEMO_SCENARIO_COUNT: 4,             // Number of demo scenarios available

    // UI display constants
    EMPTY_REASON_PLACEHOLDER: '—',      // Em-dash for missing/empty reason values
};

// ========================================
// CPI DATA (US CPI-U Annual Inflation Rates)
// ========================================

/**
 * US CPI-U Annual Inflation Rates (%)
 * Source: Bureau of Labor Statistics
 */
export const cpiData = {
    2010: 1.6, 2011: 3.2, 2012: 2.1, 2013: 1.5, 2014: 1.6,
    2015: 0.1, 2016: 1.3, 2017: 2.1, 2018: 2.4, 2019: 1.8,
    2020: 1.2, 2021: 4.7, 2022: 8.0, 2023: 4.1, 2024: 2.9,
    2025: 2.5 // Projected
};

// ========================================
// BENCHMARK DATA (B2B SaaS Industry)
// ========================================

/**
 * Industry benchmark data for B2B SaaS compensation
 * Sources: Compiled from Radford, Mercer, Levels.fyi, Glassdoor B2B SaaS data
 */
export const benchmarks = {
    // Annual raise percentages
    typicalRaise: { min: 3, max: 5, avg: 4 },
    highPerformerRaise: { min: 6, max: 10, avg: 8 },
    promotionBump: { min: 10, max: 20, avg: 15 },

    // Growth metrics
    industryCagr: 6, // ~6% average CAGR for tech compensation

    // Timing
    avgMonthsBetweenRaises: 12,

    // Metadata
    lastUpdated: '2025'
};

// ========================================
// BENCHMARK METADATA & PROVENANCE (#147)
// ========================================

/**
 * Benchmark data provenance, sources, and limitations
 * For transparency on where benchmark data comes from
 */
export const benchmarkMetadata = {
    region: 'United States',
    industry: 'B2B SaaS',

    lastUpdated: {
        salaryBenchmarks: '2024-Q4',
        inflationData: '2024-12',  // Monthly CPI updates from BLS
        industryCagr: '2024-Q3'
    },

    sources: {
        typicalRaise: {
            primary: 'Radford Global Technology Survey 2024',
            secondary: ['Mercer TRS 2024', 'Levels.fyi'],
            sampleSize: '5,000+ B2B SaaS roles',
            confidence: 'high'
        },
        highPerformerRaise: {
            primary: 'Radford Global Technology Survey 2024',
            confidence: 'high'
        },
        promotionBump: {
            primary: 'Mercer TRS 2024',
            secondary: ['Levels.fyi'],
            confidence: 'medium'
        },
        industryCagr: {
            primary: 'Industry surveys + public SaaS company SEC filings',
            confidence: 'medium'
        }
    },

    methodology: {
        typicalRaise: 'Median raises for IC roles, adjusted for inflation',
        industryCagr: 'Weighted average from public SaaS company data'
    },

    limitations: [
        'Regional: Data primarily from US markets (SF Bay, NYC, Seattle, Austin, Boston)',
        'Role scope: Individual contributor and mid-level management roles',
        'Company stage: Growth-stage B2B SaaS (Series B through public)',
        'Timeframe: 2023-2024 compensation data'
    ]
};
