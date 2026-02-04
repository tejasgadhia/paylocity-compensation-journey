/**
 * Unit Tests for Calculation Functions
 *
 * Tests critical calculation logic from app.js:
 * - calculateCAGR() - Compound Annual Growth Rate
 * - calculateInflationOverPeriod() - Cumulative inflation
 * - calculateRealGrowth() - Inflation-adjusted growth
 * - calculateInflationAdjustedSalary() - Salary adjustments
 */

import { describe, it, expect } from 'vitest';
import { CONSTANTS, benchmarks } from '../js/constants.js';
import {
    calculateInflationOverPeriod,
    calculateRealGrowth,
    calculateInflationAdjustedSalary,
    calculateCAGR,
    getBenchmarkComparisons,
    calculateAverageMonthsBetweenDates
} from '../js/calculations.js';

/**
 * Helper to create mock employeeData for testing
 */
function createMockEmployeeData(options = {}) {
    const {
        startSalary = 60000,
        endSalary = 100000,
        hireDate = '2020-01-15',
        currentDate = '2025-01-15'
    } = options;

    return {
        hireDate,
        currentDate,
        records: [
            { date: currentDate, annual: endSalary, reason: 'Merit Increase' },
            { date: hireDate, annual: startSalary, reason: 'New Hire' }
        ]
    };
}

describe('calculateCAGR (Compound Annual Growth Rate)', () => {

    it('calculates CAGR correctly for multi-year growth', () => {
        // $60,000 to $100,000 over 5 years
        // CAGR = (100000/60000)^(1/5) - 1 = 10.76%
        const employeeData = createMockEmployeeData({
            startSalary: 60000,
            endSalary: 100000,
            hireDate: '2020-01-15',
            currentDate: '2025-01-15'
        });

        const result = calculateCAGR(employeeData);

        expect(result).toBeCloseTo(10.76, 1);
    });

    it('returns 0 for same-day hire and export (years = 0)', () => {
        const employeeData = createMockEmployeeData({
            startSalary: 60000,
            endSalary: 60000,
            hireDate: '2025-01-15',
            currentDate: '2025-01-15'
        });

        const result = calculateCAGR(employeeData);

        expect(result).toBe(0);
    });

    it('uses simple percentage for very short tenure (<36 days)', () => {
        // 30 days tenure with 10% raise
        // Should return simple percentage (10%), not annualized CAGR
        const employeeData = createMockEmployeeData({
            startSalary: 100000,
            endSalary: 110000,
            hireDate: '2025-01-01',
            currentDate: '2025-01-31' // 30 days
        });

        const result = calculateCAGR(employeeData);

        // Simple percentage: (110000-100000)/100000 * 100 = 10%
        expect(result).toBeCloseTo(10, 1);
    });

    it('handles zero starting salary gracefully', () => {
        const employeeData = createMockEmployeeData({
            startSalary: 0,
            endSalary: 100000,
            hireDate: '2020-01-15',
            currentDate: '2025-01-15'
        });

        const result = calculateCAGR(employeeData);

        expect(result).toBe(0);
        // Should not throw or return NaN/Infinity
        expect(Number.isFinite(result)).toBe(true);
    });

    it('prevents NaN propagation from invalid inputs', () => {
        // Test with negative salary
        const employeeData = createMockEmployeeData({
            startSalary: -50000,
            endSalary: 100000,
            hireDate: '2020-01-15',
            currentDate: '2025-01-15'
        });

        const result = calculateCAGR(employeeData);

        expect(result).toBe(0);
        expect(Number.isNaN(result)).toBe(false);
    });

    it('handles single year tenure correctly', () => {
        // $65,000 to $70,000 over 1 year = 7.69% CAGR
        const employeeData = createMockEmployeeData({
            startSalary: 65000,
            endSalary: 70000,
            hireDate: '2024-01-15',
            currentDate: '2025-01-15'
        });

        const result = calculateCAGR(employeeData);

        // (70000/65000)^1 - 1 = 7.69%
        expect(result).toBeCloseTo(7.69, 1);
    });

    it('handles large date ranges (10+ years)', () => {
        // $50,000 to $150,000 over 12 years
        // CAGR = (150000/50000)^(1/12) - 1 = 9.59%
        const employeeData = createMockEmployeeData({
            startSalary: 50000,
            endSalary: 150000,
            hireDate: '2013-01-15',
            currentDate: '2025-01-15'
        });

        const result = calculateCAGR(employeeData);

        expect(result).toBeCloseTo(9.59, 1);
    });

    it('handles negative growth (salary decrease)', () => {
        // $100,000 to $90,000 over 2 years = -5.13% CAGR
        const employeeData = createMockEmployeeData({
            startSalary: 100000,
            endSalary: 90000,
            hireDate: '2023-01-15',
            currentDate: '2025-01-15'
        });

        const result = calculateCAGR(employeeData);

        expect(result).toBeLessThan(0);
        expect(result).toBeCloseTo(-5.13, 1);
    });

    it('handles zero end salary gracefully', () => {
        const employeeData = createMockEmployeeData({
            startSalary: 100000,
            endSalary: 0,
            hireDate: '2020-01-15',
            currentDate: '2025-01-15'
        });

        const result = calculateCAGR(employeeData);

        expect(result).toBe(0);
        expect(Number.isFinite(result)).toBe(true);
    });
});

describe('calculateInflationOverPeriod', () => {

    describe('Full Year Calculations', () => {
        it('calculates single year inflation', () => {
            // 2018 CPI = 1.9% (from cpiData)
            const result = calculateInflationOverPeriod(2018, 2018);

            expect(result).toBeCloseTo(1.9, 1);
        });

        it('calculates multi-year cumulative inflation', () => {
            // 2015: 0.7%, 2016: 2.1%, 2017: 2.1%, 2018: 1.9%
            // Cumulative: (1.007 * 1.021 * 1.021 * 1.019) - 1 = ~6.95%
            const result = calculateInflationOverPeriod(2015, 2018);

            expect(result).toBeGreaterThan(6.5);
            expect(result).toBeLessThan(7.5);
        });

        it('returns 1 month of inflation for same month start/end', () => {
            // Month 0 to month 0 = 1 month (January)
            // 2018 annual: 1.9%, 1 month: 1.9/12 = 0.158%
            const result = calculateInflationOverPeriod(2018, 2018, 0, 0);

            expect(result).toBeCloseTo(0.158, 1);
        });
    });

    describe('Partial Year Calculations', () => {
        it('calculates partial year inflation (8 months)', () => {
            // March 2018 to October 2018 (8 months) using actual CPI data
            // 2018 annual: 1.9%, Monthly: 1.9/12 = 0.158%
            // 8 months: 0.158% * 8 = 1.27%
            const result = calculateInflationOverPeriod(2018, 2018, 2, 9);

            expect(result).toBeCloseTo(1.27, 1);
        });

        it('calculates multi-year with partial start and end', () => {
            // July 2016 through May 2018 using actual CPI data
            const result = calculateInflationOverPeriod(2016, 2018, 6, 4);

            // 2016: 6 months = 2.1/12*6 = 1.05%, 2017: full = 2.1%, 2018: 5 months = 1.9/12*5 = 0.79%
            // Should be around 4-5% cumulative
            expect(result).toBeGreaterThan(3);
            expect(result).toBeLessThan(6);
        });

        it('handles partial first year correctly', () => {
            // September 2018 through December 2018 (4 months)
            // 2018: 1.9% annual, 4 months = 1.9/12 * 4 = 0.63%
            const result = calculateInflationOverPeriod(2018, 2018, 8, 11);

            expect(result).toBeCloseTo(0.63, 1);
        });

        it('handles partial last year correctly', () => {
            // January 2018 through March 2018 (3 months)
            // 2018: 1.9% annual, 3 months = 1.9/12 * 3 = 0.475%
            const result = calculateInflationOverPeriod(2018, 2018, 0, 2);

            expect(result).toBeCloseTo(0.475, 1);
        });
    });

    describe('Edge Cases', () => {
        it('uses default CPI rate for missing year', () => {
            // Year 2030 doesn't exist in cpiData
            const result = calculateInflationOverPeriod(2030, 2030);

            expect(result).toBeCloseTo(CONSTANTS.DEFAULT_CPI_RATE, 1);
        });

        it('handles year boundaries correctly', () => {
            // December 2018 to January 2019 (2 months) using actual CPI data years
            // 2018: 1.9% annual, Dec only = 1/12 ≈ 0.158%
            // 2019: 2.3% annual, Jan only = 1/12 ≈ 0.192%
            const result = calculateInflationOverPeriod(2018, 2019, 11, 0);

            expect(result).toBeGreaterThan(0.3);
            expect(result).toBeLessThan(0.5);
        });

        it('compounds inflation correctly for multi-year periods', () => {
            // Verify compounding, not simple addition
            const result = calculateInflationOverPeriod(2013, 2014);

            // 2013: 1.5%, 2014: 0.8% (from actual cpiData)
            // Compounded: (1.015 * 1.008) - 1 = 2.312%
            expect(result).toBeCloseTo(2.312, 1);
        });
    });
});

describe('calculateRealGrowth (Inflation-Adjusted Growth)', () => {

    it('calculates real growth correctly with positive nominal and inflation', () => {
        // Nominal: 5%, Inflation: 3%
        // Real: ((1.05 / 1.03) - 1) * 100 = 1.94%
        const result = calculateRealGrowth(5, 3);

        expect(result).toBeCloseTo(1.94, 2);
    });

    it('returns negative real growth when inflation exceeds nominal growth', () => {
        // Nominal: 3%, Inflation: 5%
        // Real: ((1.03 / 1.05) - 1) * 100 = -1.90%
        const result = calculateRealGrowth(3, 5);

        expect(result).toBeLessThan(0);
        expect(result).toBeCloseTo(-1.90, 2);
    });

    it('returns zero real growth when nominal equals inflation', () => {
        // Nominal: 4%, Inflation: 4%
        // Real: ((1.04 / 1.04) - 1) * 100 = 0%
        const result = calculateRealGrowth(4, 4);

        expect(result).toBeCloseTo(0, 2);
    });

    it('handles zero inflation correctly', () => {
        // Nominal: 5%, Inflation: 0%
        // Real: ((1.05 / 1.00) - 1) * 100 = 5%
        const result = calculateRealGrowth(5, 0);

        expect(result).toBeCloseTo(5, 2);
    });

    it('handles negative nominal growth (salary decrease)', () => {
        // Nominal: -2%, Inflation: 3%
        // Real: ((0.98 / 1.03) - 1) * 100 = -4.85%
        const result = calculateRealGrowth(-2, 3);

        expect(result).toBeLessThan(-4);
        expect(result).toBeCloseTo(-4.85, 2);
    });

    it('handles high inflation scenarios', () => {
        // Nominal: 8%, Inflation: 8% (2022-like scenario)
        // Real: ((1.08 / 1.08) - 1) * 100 = 0%
        const result = calculateRealGrowth(8, 8);

        expect(result).toBeCloseTo(0, 2);
    });

    it('calculates correctly for large values', () => {
        // Nominal: 20%, Inflation: 3%
        // Real: ((1.20 / 1.03) - 1) * 100 = 16.50%
        const result = calculateRealGrowth(20, 3);

        expect(result).toBeCloseTo(16.50, 2);
    });

    it('handles decimal percentages correctly', () => {
        // Nominal: 5.5%, Inflation: 2.7%
        // Real: ((1.055 / 1.027) - 1) * 100 = 2.73%
        const result = calculateRealGrowth(5.5, 2.7);

        expect(result).toBeCloseTo(2.73, 2);
    });
});

describe('calculateInflationAdjustedSalary', () => {

    it('adjusts salary forward with inflation', () => {
        // $65,000 in 2016 adjusted to 2019 (uses CPI data years)
        // 2016: 2.1%, 2017: 2.1%, 2018: 1.9%
        // Calculation: 65000 * 1.021 * 1.021 * 1.019 = 69,066
        const result = calculateInflationAdjustedSalary(65000, 2016, 2019);

        expect(result).toBeGreaterThan(69000);
        expect(result).toBeLessThan(70000);
    });

    it('returns unchanged salary when toYear < fromYear (no backward adjustment)', () => {
        // Function only supports forward adjustment via multiplication loop
        // When toYear < fromYear, the loop doesn't execute
        const result = calculateInflationAdjustedSalary(78000, 2023, 2020);

        expect(result).toBe(78000);
    });

    it('returns same salary for same year', () => {
        const result = calculateInflationAdjustedSalary(65000, 2023, 2023);

        expect(result).toBe(65000);
    });

    it('uses default CPI rate for missing years', () => {
        // Year 2030 doesn't exist in cpiData
        const result = calculateInflationAdjustedSalary(65000, 2030, 2031);

        // Should use CONSTANTS.DEFAULT_CPI_RATE (2.5%)
        expect(result).toBeCloseTo(66625, 0); // 65000 * 1.025
    });
});

describe('calculateAverageMonthsBetweenDates (Raise Frequency Helper)', () => {

    it('calculates average months between adjustment dates', () => {
        // Three raises: Jan 2020, Jul 2020 (6 months later), Jan 2021 (6 months later)
        const records = [
            { date: '2020-01-15' },
            { date: '2020-07-15' },
            { date: '2021-01-15' }
        ];
        const result = calculateAverageMonthsBetweenDates(records);

        // Average interval: (6 + 6) / 2 = 6 months (approximately)
        expect(result).toBeGreaterThan(5.5);
        expect(result).toBeLessThan(6.5);
    });

    it('returns default value for single record', () => {
        const records = [{ date: '2020-01-15' }];
        const result = calculateAverageMonthsBetweenDates(records);

        expect(result).toBe(12); // Default is 12 months
    });

    it('returns custom default value when specified', () => {
        const records = [{ date: '2020-01-15' }];
        const result = calculateAverageMonthsBetweenDates(records, 0);

        expect(result).toBe(0); // Custom default
    });

    it('returns default value for empty records', () => {
        const result = calculateAverageMonthsBetweenDates([]);

        expect(result).toBe(12); // Default is 12 months
    });

    it('handles records with irregular intervals', () => {
        // Raises at varying intervals: 3 months, then 9 months
        const records = [
            { date: '2020-01-15' },
            { date: '2020-04-15' }, // 3 months
            { date: '2021-01-15' }  // 9 months
        ];
        const result = calculateAverageMonthsBetweenDates(records);

        // Average: (3 + 9) / 2 = 6 months (approximately)
        expect(result).toBeGreaterThan(5.5);
        expect(result).toBeLessThan(6.5);
    });

    it('sorts dates correctly regardless of input order', () => {
        // Same dates in different order should give same result
        const recordsOrdered = [
            { date: '2020-01-15' },
            { date: '2020-07-15' }
        ];
        const recordsUnordered = [
            { date: '2020-07-15' },
            { date: '2020-01-15' }
        ];

        const result1 = calculateAverageMonthsBetweenDates(recordsOrdered);
        const result2 = calculateAverageMonthsBetweenDates(recordsUnordered);

        expect(result1).toBeCloseTo(result2, 1);
    });
});

describe('CONSTANTS Validation', () => {

    it('has realistic salary validation ranges', () => {
        expect(CONSTANTS.MIN_REALISTIC_SALARY).toBe(1000);
        expect(CONSTANTS.MAX_REALISTIC_SALARY).toBe(10000000);
    });

    it('has reasonable time intervals', () => {
        expect(CONSTANTS.TYPICAL_RAISE_INTERVAL_MONTHS).toBe(12);
        expect(CONSTANTS.CAGR_MIN_YEARS_THRESHOLD).toBe(0.1); // ~36 days
        expect(CONSTANTS.CAGR_MIN_YEARS_WARNING).toBe(1);
    });

    it('has default CPI rate for missing data', () => {
        expect(CONSTANTS.DEFAULT_CPI_RATE).toBe(2.5);
    });

    it('has em-dash placeholder for empty reasons', () => {
        expect(CONSTANTS.EMPTY_REASON_PLACEHOLDER).toBe('—');
    });

    it('has chart configuration constants', () => {
        expect(CONSTANTS.CHART_ANIMATION_DURATION).toBe(300);
        expect(CONSTANTS.CHART_UPDATE_MODE).toBe('none');
    });

    it('has benchmark ranges', () => {
        expect(benchmarks).toBeDefined();
        expect(benchmarks.typicalRaise).toBeDefined();
        expect(benchmarks.typicalRaise.min).toBeGreaterThan(0);
        expect(benchmarks.typicalRaise.max).toBeGreaterThan(benchmarks.typicalRaise.min);
    });
});

describe('getBenchmarkComparisons (Market Tab Metrics)', () => {

    /**
     * Helper to create realistic mock employeeData with multiple raises
     */
    function createBenchmarkTestData(options = {}) {
        const {
            startSalary = 60000,
            endSalary = 100000,
            hireDate = '2020-01-15',
            currentDate = '2025-01-15',
            raises = [] // Array of { date, salary, reason, changePercent }
        } = options;

        // Build records array (most recent first)
        const records = [];

        // Current salary (most recent)
        records.push({
            date: currentDate,
            annual: endSalary,
            reason: raises.length > 0 ? raises[raises.length - 1].reason : 'Merit Increase',
            changePercent: raises.length > 0 ? raises[raises.length - 1].changePercent : 10
        });

        // Add intermediate raises in reverse order
        for (let i = raises.length - 2; i >= 0; i--) {
            records.push({
                date: raises[i].date,
                annual: raises[i].salary,
                reason: raises[i].reason,
                changePercent: raises[i].changePercent
            });
        }

        // Starting salary (oldest)
        records.push({
            date: hireDate,
            annual: startSalary,
            reason: 'New Hire',
            changePercent: 0
        });

        return {
            hireDate,
            currentDate,
            records
        };
    }

    describe('Returns null for invalid data', () => {
        it('returns null when employeeData is null', () => {
            const result = getBenchmarkComparisons(null, benchmarks);
            expect(result).toBeNull();
        });

        it('returns null when employeeData is undefined', () => {
            const result = getBenchmarkComparisons(undefined, benchmarks);
            expect(result).toBeNull();
        });
    });

    describe('User Metrics Calculation', () => {
        it('calculates avgRaise correctly', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 60000,
                endSalary: 80000,
                raises: [
                    { date: '2021-01-15', salary: 65000, reason: 'Merit', changePercent: 8.33 },
                    { date: '2022-01-15', salary: 70000, reason: 'Merit', changePercent: 7.69 },
                    { date: '2023-01-15', salary: 75000, reason: 'Merit', changePercent: 7.14 },
                    { date: '2024-01-15', salary: 80000, reason: 'Merit', changePercent: 6.67 }
                ]
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // Average of 8.33, 7.69, 7.14, 6.67 = 7.46%
            expect(result.avgRaise).toBeCloseTo(7.46, 1);
        });

        it('calculates userCagr correctly', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 60000,
                endSalary: 100000,
                hireDate: '2020-01-15',
                currentDate: '2025-01-15'
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // CAGR = (100000/60000)^(1/5) - 1 = 10.76%
            expect(result.userCagr).toBeCloseTo(10.76, 1);
        });

        it('calculates totalRaises correctly', () => {
            const employeeData = createBenchmarkTestData({
                raises: [
                    { date: '2021-01-15', salary: 65000, reason: 'Merit', changePercent: 8 },
                    { date: '2022-01-15', salary: 70000, reason: 'Merit', changePercent: 7 },
                    { date: '2023-01-15', salary: 75000, reason: 'Promotion', changePercent: 7 }
                ]
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // 3 raises with changePercent > 0
            expect(result.totalRaises).toBe(3);
        });

        it('handles zero raises correctly', () => {
            // Employee with only New Hire entry (no raises yet)
            const employeeData = {
                hireDate: '2024-06-01',
                currentDate: '2024-12-01',
                records: [
                    { date: '2024-06-01', annual: 60000, reason: 'New Hire', changePercent: 0 }
                ]
            };

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            expect(result.avgRaise).toBe(0);
            expect(result.totalRaises).toBe(0);
        });
    });

    describe('Growth Comparisons', () => {
        it('calculates nominalGrowth correctly', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 50000,
                endSalary: 75000
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // (75000 - 50000) / 50000 * 100 = 50%
            expect(result.nominalGrowth).toBeCloseTo(50, 1);
        });

        it('calculates totalInflation over period', () => {
            const employeeData = createBenchmarkTestData({
                hireDate: '2016-01-15',
                currentDate: '2019-01-15'
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // 2016-2018 inflation using actual CPI data
            // 2016: 2.1%, 2017: 2.1%, 2018: 1.9% ≈ 6.3% cumulative
            expect(result.totalInflation).toBeGreaterThan(5);
            expect(result.totalInflation).toBeLessThan(10);
        });

        it('calculates realGrowth (inflation-adjusted)', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 60000,
                endSalary: 72000, // 20% nominal growth
                hireDate: '2021-01-15',
                currentDate: '2023-01-15'
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // Real growth should be less than nominal (inflation eats into gains)
            expect(result.realGrowth).toBeLessThan(result.nominalGrowth);
        });

        it('calculates inflationAdjustedStart correctly', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 60000,
                hireDate: '2020-01-15',
                currentDate: '2023-01-15'
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // Inflation-adjusted start should be higher than original
            expect(result.inflationAdjustedStart).toBeGreaterThan(60000);
        });

        it('calculates purchasingPowerGain correctly', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 60000,
                endSalary: 100000,
                hireDate: '2020-01-15',
                currentDate: '2023-01-15'
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // Purchasing power gain = current - inflationAdjustedStart
            expect(result.purchasingPowerGain).toBe(
                employeeData.records[0].annual - result.inflationAdjustedStart
            );
        });
    });

    describe('Industry Comparisons', () => {
        it('calculates industryProjectedSalary correctly', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 60000,
                hireDate: '2020-01-15',
                currentDate: '2025-01-15'
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // At 6% industry CAGR over 5 years:
            // 60000 * (1.06)^5 = ~80,294
            expect(result.industryProjectedSalary).toBeCloseTo(80294, -2);
        });

        it('calculates vsIndustrySalary (difference from industry)', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 60000,
                endSalary: 100000,
                hireDate: '2020-01-15',
                currentDate: '2025-01-15'
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // vsIndustrySalary = current - industryProjected
            // 100000 - ~80294 = ~19706
            expect(result.vsIndustrySalary).toBeGreaterThan(15000);
        });

        it('calculates vsIndustryPercent correctly', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 60000,
                endSalary: 100000,
                hireDate: '2020-01-15',
                currentDate: '2025-01-15'
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // vsIndustryPercent = ((current / industryProjected) - 1) * 100
            // ((100000 / 80294) - 1) * 100 = ~24.5%
            expect(result.vsIndustryPercent).toBeGreaterThan(20);
        });

        it('calculates cagrVsIndustry correctly', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 60000,
                endSalary: 100000,
                hireDate: '2020-01-15',
                currentDate: '2025-01-15'
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // userCagr (~10.76%) - industryCagr (6%) = ~4.76%
            expect(result.cagrVsIndustry).toBeCloseTo(4.76, 1);
        });
    });

    describe('Raise Comparisons', () => {
        it('calculates raiseVsTypical correctly', () => {
            const employeeData = createBenchmarkTestData({
                raises: [
                    { date: '2021-01-15', salary: 66000, reason: 'Merit', changePercent: 10 }
                ]
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // avgRaise (10%) - typicalRaise.avg (4%) = 6%
            expect(result.raiseVsTypical).toBeGreaterThan(0);
        });

        it('calculates raiseVsHighPerformer correctly', () => {
            const employeeData = createBenchmarkTestData({
                raises: [
                    { date: '2021-01-15', salary: 66000, reason: 'Merit', changePercent: 10 }
                ]
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // avgRaise - highPerformerRaise.avg (8%)
            expect(result.raiseVsHighPerformer).toBeDefined();
        });
    });

    describe('Performance Tier Classification', () => {
        it('classifies as "high" for high-performer raises', () => {
            const employeeData = createBenchmarkTestData({
                raises: [
                    { date: '2021-01-15', salary: 66000, reason: 'Merit', changePercent: 10 },
                    { date: '2022-01-15', salary: 72600, reason: 'Merit', changePercent: 10 }
                ]
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // avgRaise (10%) >= highPerformerRaise.min (6%)
            expect(result.performanceTier).toBe('high');
        });

        it('classifies as "solid" for typical raises', () => {
            const employeeData = createBenchmarkTestData({
                raises: [
                    { date: '2021-01-15', salary: 62400, reason: 'Merit', changePercent: 4 },
                    { date: '2022-01-15', salary: 64896, reason: 'Merit', changePercent: 4 }
                ]
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // avgRaise (4%) >= typicalRaise.avg (4%) but < highPerformer.min (6%)
            expect(result.performanceTier).toBe('solid');
        });

        it('classifies as "below" for below-average raises', () => {
            const employeeData = createBenchmarkTestData({
                raises: [
                    { date: '2021-01-15', salary: 61200, reason: 'Merit', changePercent: 2 },
                    { date: '2022-01-15', salary: 62424, reason: 'Merit', changePercent: 2 }
                ]
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // avgRaise (2%) < typicalRaise.avg (4%)
            expect(result.performanceTier).toBe('below');
        });
    });

    describe('Edge Cases', () => {
        it('handles very short tenure (< 1 year)', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 60000,
                endSalary: 63000,
                hireDate: '2024-07-15',
                currentDate: '2025-01-15',
                raises: [
                    { date: '2025-01-15', salary: 63000, reason: 'Merit', changePercent: 5 }
                ]
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            expect(result).not.toBeNull();
            expect(result.userCagr).toBeDefined();
            expect(Number.isFinite(result.userCagr)).toBe(true);
        });

        it('handles very long tenure (10+ years)', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 50000,
                endSalary: 150000,
                hireDate: '2013-01-15',
                currentDate: '2025-01-15',
                raises: [
                    { date: '2014-01-15', salary: 55000, reason: 'Merit', changePercent: 10 },
                    { date: '2016-01-15', salary: 70000, reason: 'Promotion', changePercent: 15 },
                    { date: '2019-01-15', salary: 100000, reason: 'Promotion', changePercent: 20 },
                    { date: '2022-01-15', salary: 130000, reason: 'Merit', changePercent: 10 },
                    { date: '2025-01-15', salary: 150000, reason: 'Merit', changePercent: 8 }
                ]
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            expect(result).not.toBeNull();
            expect(result.totalRaises).toBe(5);
            expect(result.userCagr).toBeGreaterThan(5); // Should be ~9.6%
        });

        it('handles user growth above all benchmarks', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 60000,
                endSalary: 180000, // 3x growth in 5 years = ~24% CAGR
                hireDate: '2020-01-15',
                currentDate: '2025-01-15',
                raises: [
                    { date: '2021-01-15', salary: 84000, reason: 'Promotion', changePercent: 40 },
                    { date: '2023-01-15', salary: 126000, reason: 'Promotion', changePercent: 50 },
                    { date: '2025-01-15', salary: 180000, reason: 'Merit', changePercent: 20 }
                ]
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            expect(result.performanceTier).toBe('high');
            expect(result.cagrVsIndustry).toBeGreaterThan(10);
            expect(result.vsIndustryPercent).toBeGreaterThan(50);
        });

        it('handles user growth below all benchmarks', () => {
            const employeeData = createBenchmarkTestData({
                startSalary: 60000,
                endSalary: 63000, // Only 5% total growth over 5 years
                hireDate: '2020-01-15',
                currentDate: '2025-01-15',
                raises: [
                    { date: '2022-01-15', salary: 61200, reason: 'Merit', changePercent: 2 },
                    { date: '2025-01-15', salary: 63000, reason: 'Merit', changePercent: 1 }
                ]
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            expect(result.performanceTier).toBe('below');
            expect(result.cagrVsIndustry).toBeLessThan(0);
            expect(result.vsIndustryPercent).toBeLessThan(0);
        });

        it('handles user matching industry average exactly', () => {
            // At 6% CAGR over 5 years: 60000 * 1.06^5 = 80,294
            const employeeData = createBenchmarkTestData({
                startSalary: 60000,
                endSalary: 80294,
                hireDate: '2020-01-15',
                currentDate: '2025-01-15'
            });

            const result = getBenchmarkComparisons(employeeData, benchmarks);

            expect(result.userCagr).toBeCloseTo(6, 0);
            expect(result.cagrVsIndustry).toBeCloseTo(0, 0);
        });
    });

    describe('All Returned Fields Exist', () => {
        it('returns all expected fields', () => {
            const employeeData = createBenchmarkTestData();
            const result = getBenchmarkComparisons(employeeData, benchmarks);

            // User metrics
            expect(result).toHaveProperty('avgRaise');
            expect(result).toHaveProperty('userCagr');
            expect(result).toHaveProperty('avgMonthsBetween');
            expect(result).toHaveProperty('totalRaises');

            // Growth comparisons
            expect(result).toHaveProperty('nominalGrowth');
            expect(result).toHaveProperty('totalInflation');
            expect(result).toHaveProperty('realGrowth');
            expect(result).toHaveProperty('inflationAdjustedStart');
            expect(result).toHaveProperty('purchasingPowerGain');

            // Industry comparisons
            expect(result).toHaveProperty('industryProjectedSalary');
            expect(result).toHaveProperty('vsIndustrySalary');
            expect(result).toHaveProperty('vsIndustryPercent');

            // Raise comparisons
            expect(result).toHaveProperty('raiseVsTypical');
            expect(result).toHaveProperty('raiseVsHighPerformer');
            expect(result).toHaveProperty('cagrVsIndustry');

            // Timing comparisons
            expect(result).toHaveProperty('raisesMoreFrequent');

            // Performance tier
            expect(result).toHaveProperty('performanceTier');
        });

        it('returns numeric values for all numeric fields', () => {
            const employeeData = createBenchmarkTestData();
            const result = getBenchmarkComparisons(employeeData, benchmarks);

            const numericFields = [
                'avgRaise', 'userCagr', 'avgMonthsBetween', 'totalRaises',
                'nominalGrowth', 'totalInflation', 'realGrowth',
                'inflationAdjustedStart', 'purchasingPowerGain',
                'industryProjectedSalary', 'vsIndustrySalary', 'vsIndustryPercent',
                'raiseVsTypical', 'raiseVsHighPerformer', 'cagrVsIndustry',
                'raisesMoreFrequent'
            ];

            for (const field of numericFields) {
                expect(typeof result[field]).toBe('number');
                expect(Number.isFinite(result[field])).toBe(true);
            }
        });

        it('returns valid performanceTier string', () => {
            const employeeData = createBenchmarkTestData();
            const result = getBenchmarkComparisons(employeeData, benchmarks);

            expect(['high', 'solid', 'below']).toContain(result.performanceTier);
        });
    });
});
