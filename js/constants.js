// ========================================
// CONSTANTS
// ========================================

export const CONSTANTS = {
    // Salary validation
    MIN_REALISTIC_SALARY: 1000,         // $1K minimum (sanity check)
    MAX_REALISTIC_SALARY: 10000000,     // $10M maximum (executive cap)

    // Time intervals
    TYPICAL_RAISE_INTERVAL_MONTHS: 12,  // Annual review cycle
    CAGR_MIN_YEARS_THRESHOLD: 0.1,      // ~36 days minimum for CAGR calculation
    CAGR_MIN_YEARS_WARNING: 1,          // Warn if <1 year of data

    // Inflation defaults
    DEFAULT_CPI_RATE: 2.5,              // Default CPI when data missing (%)

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
