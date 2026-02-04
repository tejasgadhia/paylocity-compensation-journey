// ========================================
// CALCULATION FUNCTIONS
// ========================================

import { CONSTANTS, cpiData } from './constants.js';

// ========================================
// MEMOIZATION CACHE (#P1-4 Performance)
// ========================================

/**
 * Cache for inflation calculations to avoid redundant computations.
 * Key format: "startYear-startMonth-endYear-endMonth"
 * Value: calculated cumulative inflation percentage
 */
const inflationCache = new Map();

/**
 * Clears the inflation calculation cache.
 * Call this if CPI data is updated at runtime (e.g., new year's data added).
 */
export function clearInflationCache() {
    inflationCache.clear();
}

/**
 * Calculates cumulative inflation over a specific time period.
 *
 * Supports partial-year calculations with month-level precision using CPI data.
 * Handles three scenarios: same year (partial), multi-year with partial start/end,
 * and full years. Uses compounding to accurately reflect cumulative inflation.
 *
 * @param {number} startYear - Starting year (e.g., 2020)
 * @param {number} endYear - Ending year (e.g., 2023)
 * @param {number} [startMonth=0] - Starting month (0-indexed: 0=January, 11=December)
 * @param {number} [endMonth=11] - Ending month (0-indexed: 0=January, 11=December)
 * @returns {number} Cumulative inflation as percentage (e.g., 12.5 for 12.5%)
 *
 * @example
 * // Full year inflation (2020 to 2023)
 * const inflation = calculateInflationOverPeriod(2020, 2023);
 * console.log(inflation); // ~19.5% (cumulative over 4 years)
 *
 * @example
 * // Partial year (March 2023 to October 2023)
 * const inflation = calculateInflationOverPeriod(2023, 2023, 2, 9);
 * console.log(inflation); // ~2.73% (8 months of 2023's 4.1% annual rate)
 *
 * @example
 * // Multi-year with partial start and end
 * const inflation = calculateInflationOverPeriod(2021, 2023, 6, 5);
 * // July 2021 through May 2023
 */
export function calculateInflationOverPeriod(startYear, endYear, startMonth = 0, endMonth = 11) {
    // Check memoization cache first (#P1-4 Performance)
    const cacheKey = `${startYear}-${startMonth}-${endYear}-${endMonth}`;
    if (inflationCache.has(cacheKey)) {
        return inflationCache.get(cacheKey);
    }

    // Supports partial years - months are 0-indexed (0 = January, 11 = December)
    let cumulativeInflation = 1;

    for (let year = startYear; year <= endYear; year++) {
        const rate = cpiData[year] || CONSTANTS.DEFAULT_CPI_RATE; // Default to 2.5% if year not found

        if (year === startYear && year === endYear) {
            // Same year - calculate partial
            const monthsInPeriod = endMonth - startMonth + 1;
            const partialRate = (rate / 12) * monthsInPeriod;
            cumulativeInflation *= (1 + partialRate / 100);
        } else if (year === startYear) {
            // First year - partial from startMonth to December
            const monthsRemaining = 12 - startMonth;
            const partialRate = (rate / 12) * monthsRemaining;
            cumulativeInflation *= (1 + partialRate / 100);
        } else if (year === endYear) {
            // Last year - partial from January to endMonth
            const monthsElapsed = endMonth + 1;
            const partialRate = (rate / 12) * monthsElapsed;
            cumulativeInflation *= (1 + partialRate / 100);
        } else {
            // Full year
            cumulativeInflation *= (1 + rate / 100);
        }
    }
    const result = (cumulativeInflation - 1) * 100; // Return as percentage

    // Store in cache for future calls (#P1-4 Performance)
    inflationCache.set(cacheKey, result);
    return result;
}

/**
 * Calculates inflation-adjusted (real) growth rate.
 *
 * Uses the formula: Real Growth = ((1 + Nominal) / (1 + Inflation)) - 1
 *
 * This shows how much purchasing power actually increased after accounting
 * for inflation. A 5% nominal raise with 3% inflation = 1.94% real growth.
 *
 * @param {number} nominalGrowthPercent - Nominal growth rate as percentage (e.g., 5 for 5%)
 * @param {number} inflationPercent - Inflation rate as percentage (e.g., 3 for 3%)
 * @returns {number} Real growth rate as percentage
 *
 * @example
 * const realGrowth = calculateRealGrowth(5, 3);
 * console.log(realGrowth); // 1.94 (approximately)
 */
export function calculateRealGrowth(nominalGrowthPercent, inflationPercent) {
    // Real growth = ((1 + nominal) / (1 + inflation)) - 1
    const nominal = nominalGrowthPercent / 100;
    const inflation = inflationPercent / 100;
    return ((1 + nominal) / (1 + inflation) - 1) * 100;
}

/**
 * Calculates inflation-adjusted salary for a given time period.
 *
 * Applies cumulative CPI inflation rate year-by-year to adjust a salary
 * forward or backward in time. Uses compounding to accurately reflect
 * the impact of inflation across multiple years.
 *
 * @param {number} salary - Starting salary amount
 * @param {number} fromYear - Year to adjust from
 * @param {number} toYear - Year to adjust to
 * @returns {number} Inflation-adjusted salary
 *
 * @example
 * // Adjust $65,000 from 2020 to 2023
 * const adjusted = calculateInflationAdjustedSalary(65000, 2020, 2023);
 * console.log(adjusted); // ~$77,675 (accounting for cumulative inflation)
 */
export function calculateInflationAdjustedSalary(salary, fromYear, toYear) {
    let adjustedSalary = salary;
    for (let year = fromYear; year < toYear; year++) {
        const rate = cpiData[year] || CONSTANTS.DEFAULT_CPI_RATE;
        adjustedSalary *= (1 + rate / 100);
    }
    return adjustedSalary;
}

/**
 * Gets the starting salary from employee data.
 *
 * @param {Object} employeeData - Employee compensation data
 * @returns {number} Starting annual salary
 */
export function getStartingSalary(employeeData) {
    return employeeData.records[employeeData.records.length - 1].annual;
}

/**
 * Gets the current salary from employee data.
 *
 * @param {Object} employeeData - Employee compensation data
 * @returns {number} Current annual salary
 */
export function getCurrentSalary(employeeData) {
    return employeeData.records[0].annual;
}

/**
 * Calculates years of service from hire date to current date.
 *
 * @param {Object} employeeData - Employee compensation data
 * @returns {number} Years of service as decimal (e.g., 3.5 years)
 */
export function calculateYearsOfService(employeeData) {
    const hire = new Date(employeeData.hireDate);
    const current = new Date(employeeData.currentDate);
    return (current - hire) / CONSTANTS.MS_PER_YEAR;
}

/**
 * Calculates Compound Annual Growth Rate (CAGR) for total compensation.
 *
 * CAGR represents the mean annual growth rate over the entire tenure,
 * smoothing out year-to-year variations. Formula: ((End / Start)^(1/Years)) - 1
 *
 * **Security/Stability Protection:**
 * - Guards against division by zero (years = 0, start = 0)
 * - Returns 0 for invalid inputs (negative salaries, zero tenure)
 * - Uses simple percentage for very short tenure (<36 days)
 * - Prevents NaN/Infinity propagation that would crash UI
 *
 * @param {Object} employeeData - Employee compensation data
 * @returns {number} CAGR as percentage (e.g., 8.5 for 8.5%)
 *
 * @example
 * // Starting salary: $60,000, Current: $100,000, Years: 5
 * const cagr = calculateCAGR(employeeData);
 * console.log(cagr); // ~10.8% annual growth
 *
 * @example
 * // Edge case: Same-day hire and export (years = 0)
 * const cagr = calculateCAGR(employeeData);
 * console.log(cagr); // 0 (graceful fallback)
 */
export function calculateCAGR(employeeData) {
    // Return cached value if available (performance optimization - #47)
    if (employeeData._cachedCAGR !== undefined) {
        return employeeData._cachedCAGR;
    }

    const start = getStartingSalary(employeeData);
    const end = getCurrentSalary(employeeData);
    const years = calculateYearsOfService(employeeData);

    // Validation: Prevent division by zero and NaN propagation
    if (years <= 0 || start <= 0 || end <= 0) {
        console.warn('calculateCAGR: Invalid inputs, returning 0', { start, end, years });
        employeeData._cachedCAGR = 0;
        return 0;
    }

    // For very short tenure (<~36 days), use simple percentage instead of CAGR
    // This avoids extreme CAGR values from compounding over very short periods
    let result;
    if (years < CONSTANTS.CAGR_MIN_YEARS_THRESHOLD) {
        result = ((end - start) / start) * 100;
    } else {
        result = (Math.pow(end / start, 1 / years) - 1) * 100;
    }

    // Cache the result on the employeeData object
    employeeData._cachedCAGR = result;
    return result;
}

/**
 * Calculates comprehensive benchmark comparisons against industry standards.
 *
 * Computes user metrics (CAGR, raise frequency, average raise) and compares them
 * to B2B SaaS industry benchmarks. Includes inflation-adjusted analysis and
 * purchasing power calculations.
 *
 * @param {Object} employeeData - Employee compensation data
 * @param {Object} benchmarks - Industry benchmark data (industryCagr, typicalRaise, etc.)
 * @returns {Object|null} Benchmark comparison metrics, or null if no employee data
 *
 * @example
 * const bench = getBenchmarkComparisons(employeeData, benchmarks);
 * console.log(bench.userCagr); // 10.5 (user's CAGR)
 * console.log(bench.cagrVsIndustry); // 2.5 (difference from industry avg)
 */
export function getBenchmarkComparisons(employeeData, benchmarks) {
    if (!employeeData) return null;

    // Return cached value if available (performance optimization - #47)
    if (employeeData._cachedBenchmarks) {
        return employeeData._cachedBenchmarks;
    }

    const raises = employeeData.records.filter(r => r.changePercent > 0);
    const avgRaise = raises.length > 0
        ? raises.reduce((sum, r) => sum + r.changePercent, 0) / raises.length
        : 0;

    const userCagr = calculateCAGR(employeeData);
    const years = calculateYearsOfService(employeeData);
    const hireDate = new Date(employeeData.hireDate);
    const currentDate = new Date(employeeData.currentDate);
    const startYear = hireDate.getFullYear();
    const startMonth = hireDate.getMonth();
    const endYear = currentDate.getFullYear();
    const endMonth = currentDate.getMonth();

    // Calculate time between raises (exclude "New Hire" - it's the starting point)
    const adjustments = employeeData.records.filter(r => r.reason !== 'New Hire');
    const avgMonthsBetween = calculateAverageMonthsBetweenDates(adjustments);

    // Inflation calculations (with partial year support)
    const totalInflation = calculateInflationOverPeriod(startYear, endYear, startMonth, endMonth);
    const startSalary = getStartingSalary(employeeData);
    const currentSalary = getCurrentSalary(employeeData);
    const nominalGrowth = ((currentSalary - startSalary) / startSalary) * 100;
    const realGrowth = calculateRealGrowth(nominalGrowth, totalInflation);

    // What starting salary would be worth today (inflation-adjusted)
    const inflationAdjustedStart = calculateInflationAdjustedSalary(startSalary, startYear, endYear);
    const purchasingPowerGain = currentSalary - inflationAdjustedStart;

    // Industry comparison: what would salary be at industry CAGR?
    const industryProjectedSalary = startSalary * Math.pow(1 + benchmarks.industryCagr / 100, years);

    // Build result object
    const result = {
        // User metrics
        avgRaise,
        userCagr,
        avgMonthsBetween,
        totalRaises: raises.length,

        // Growth comparisons
        nominalGrowth,
        totalInflation,
        realGrowth,
        inflationAdjustedStart,
        purchasingPowerGain,

        // Industry comparisons
        industryProjectedSalary,
        vsIndustrySalary: currentSalary - industryProjectedSalary,
        vsIndustryPercent: ((currentSalary / industryProjectedSalary) - 1) * 100,

        // Raise comparisons
        raiseVsTypical: avgRaise - benchmarks.typicalRaise.avg,
        raiseVsHighPerformer: avgRaise - benchmarks.highPerformerRaise.avg,
        cagrVsIndustry: userCagr - benchmarks.industryCagr,

        // Timing comparisons
        raisesMoreFrequent: benchmarks.avgMonthsBetweenRaises - avgMonthsBetween,

        // Performance tier
        performanceTier: avgRaise >= benchmarks.highPerformerRaise.min ? 'high' :
                         avgRaise >= benchmarks.typicalRaise.avg ? 'solid' : 'below'
    };

    // Cache the result on the employeeData object
    employeeData._cachedBenchmarks = result;
    return result;
}

/**
 * Calculates average months between adjustment dates.
 *
 * Useful for determining raise frequency. Excludes the initial hire date
 * by accepting pre-filtered records (typically excluding "New Hire" entries).
 *
 * @param {Array<{date: string}>} records - Records with date field (should exclude New Hire)
 * @param {number} [defaultValue=12] - Default value if insufficient records
 * @returns {number} Average months between adjustments
 *
 * @example
 * const adjustments = records.filter(r => r.reason !== 'New Hire');
 * const avgMonths = calculateAverageMonthsBetweenDates(adjustments);
 * console.log(avgMonths); // 8.5 (raises every ~8.5 months)
 */
export function calculateAverageMonthsBetweenDates(records, defaultValue = 12) {
    const dates = records.map(r => new Date(r.date)).sort((a, b) => a - b);
    if (dates.length < 2) return defaultValue;

    let totalDays = 0;
    for (let i = 1; i < dates.length; i++) {
        totalDays += (dates[i] - dates[i-1]) / CONSTANTS.MS_PER_DAY;
    }
    return (totalDays / (dates.length - 1)) / 30.44;
}

// ========================================
// DATE FORMATTING UTILITIES (#86)
// ========================================

/**
 * Formats a date for summary display (full month + year).
 * Use for KPIs, milestones, and high-level summaries.
 *
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date like "January 2023"
 *
 * @example
 * formatDateSummary('2023-01-15'); // "January 2023"
 * formatDateSummary(new Date(2023, 0, 15)); // "January 2023"
 */
export function formatDateSummary(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Formats a date for detailed display (full month + day + year).
 * Use for history tables and detailed records.
 *
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date like "January 15, 2023"
 *
 * @example
 * formatDateDetail('2023-01-15'); // "January 15, 2023"
 * formatDateDetail(new Date(2023, 0, 15)); // "January 15, 2023"
 */
export function formatDateDetail(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Formats a date for compact display (short month + year).
 * Use for charts and space-constrained contexts.
 *
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date like "Jan 2023"
 *
 * @example
 * formatDateCompact('2023-01-15'); // "Jan 2023"
 */
export function formatDateCompact(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
