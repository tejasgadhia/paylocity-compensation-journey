// ========================================
// CALCULATION FUNCTIONS
// ========================================

import { CONSTANTS, cpiData } from './constants.js';

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
    return (cumulativeInflation - 1) * 100; // Return as percentage
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
