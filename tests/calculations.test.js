/**
 * Unit Tests for Calculation Functions
 *
 * Tests critical calculation logic from app.js:
 * - calculateCAGR() - Compound Annual Growth Rate
 * - calculateInflationOverPeriod() - Cumulative inflation
 * - calculateRealGrowth() - Inflation-adjusted growth
 * - calculateInflationAdjustedSalary() - Salary adjustments
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CONSTANTS, benchmarks } from '../js/constants.js';
import {
    calculateInflationOverPeriod,
    calculateRealGrowth,
    calculateInflationAdjustedSalary
} from '../app.js';

// We need to mock the global state that these functions depend on
// For now, we'll test them indirectly or create wrapper tests

describe('calculateCAGR (Compound Annual Growth Rate)', () => {
    // Note: calculateCAGR depends on employeeData global state
    // We'll need to either mock it or restructure the function
    // For now, documenting expected behavior

    it.todo('calculates CAGR correctly for multi-year growth');
    it.todo('returns 0 for same-day hire and export (years = 0)');
    it.todo('uses simple percentage for very short tenure (<36 days)');
    it.todo('handles zero starting salary gracefully');
    it.todo('prevents NaN propagation from invalid inputs');
});

describe('calculateInflationOverPeriod', () => {

    describe('Full Year Calculations', () => {
        it('calculates single year inflation', () => {
            // Assuming 2023 CPI = 4.1% (from cpiData)
            const result = calculateInflationOverPeriod(2023, 2023);

            expect(result).toBeCloseTo(4.1, 1);
        });

        it('calculates multi-year cumulative inflation', () => {
            // 2020: 1.2%, 2021: 4.7%, 2022: 8.0%, 2023: 4.1%
            // Cumulative: (1.012 * 1.047 * 1.08 * 1.041) - 1 = ~19.5%
            const result = calculateInflationOverPeriod(2020, 2023);

            expect(result).toBeGreaterThan(18);
            expect(result).toBeLessThan(21);
        });

        it('returns 0 for same year with no time passed', () => {
            const result = calculateInflationOverPeriod(2023, 2023, 0, 0);

            expect(result).toBeCloseTo(0, 1);
        });
    });

    describe('Partial Year Calculations', () => {
        it('calculates partial year inflation (8 months)', () => {
            // March 2023 to October 2023 (8 months)
            // 2023 annual: 4.1%, Monthly: 4.1/12 = 0.342%
            // 8 months: 0.342% * 8 = 2.73%
            const result = calculateInflationOverPeriod(2023, 2023, 2, 9);

            expect(result).toBeCloseTo(2.73, 1);
        });

        it('calculates multi-year with partial start and end', () => {
            // July 2021 through May 2023
            const result = calculateInflationOverPeriod(2021, 2023, 6, 4);

            // Should be between full 2-year and full 3-year inflation
            expect(result).toBeGreaterThan(10);
            expect(result).toBeLessThan(20);
        });

        it('handles partial first year correctly', () => {
            // September 2023 through December 2023 (4 months)
            // 2023: 4.1% annual, 4 months = 4.1/12 * 4 = 1.37%
            const result = calculateInflationOverPeriod(2023, 2023, 8, 11);

            expect(result).toBeCloseTo(1.37, 1);
        });

        it('handles partial last year correctly', () => {
            // January 2023 through March 2023 (3 months)
            // 2023: 4.1% annual, 3 months = 4.1/12 * 3 = 1.03%
            const result = calculateInflationOverPeriod(2023, 2023, 0, 2);

            expect(result).toBeCloseTo(1.03, 1);
        });
    });

    describe('Edge Cases', () => {
        it('uses default CPI rate for missing year', () => {
            // Year 2030 doesn't exist in cpiData
            const result = calculateInflationOverPeriod(2030, 2030);

            expect(result).toBeCloseTo(CONSTANTS.DEFAULT_CPI_RATE, 1);
        });

        it('handles year boundaries correctly', () => {
            // December 2022 to January 2023 (2 months)
            const result = calculateInflationOverPeriod(2022, 2023, 11, 0);

            expect(result).toBeGreaterThan(0.5);
            expect(result).toBeLessThan(2);
        });

        it('compounds inflation correctly for multi-year periods', () => {
            // 2 years at 3% each: (1.03)^2 - 1 = 6.09%, not 6%
            // Verify compounding, not simple addition
            const result = calculateInflationOverPeriod(2013, 2014);

            // 2013: 1.5%, 2014: 1.6%
            // Compounded: (1.015 * 1.016) - 1 = 3.124%
            expect(result).toBeCloseTo(3.124, 1);
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

    it.skip('adjusts salary forward with inflation', () => {
        // $65,000 in 2020 adjusted to 2023
        // With cumulative inflation of ~19.5%
        const result = calculateInflationAdjustedSalary(65000, 2020, 2023);

        expect(result).toBeGreaterThan(75000);
        expect(result).toBeLessThan(80000);
    });

    it.skip('adjusts salary backward with inflation', () => {
        // $78,000 in 2023 adjusted to 2020 (purchasing power)
        // Divide by cumulative inflation
        const result = calculateInflationAdjustedSalary(78000, 2023, 2020);

        expect(result).toBeGreaterThan(62000);
        expect(result).toBeLessThan(68000);
    });

    it.skip('returns same salary for same year', () => {
        const result = calculateInflationAdjustedSalary(65000, 2023, 2023);

        expect(result).toBe(65000);
    });

    it.skip('uses default CPI rate for missing years', () => {
        // Year 2030 doesn't exist in cpiData
        const result = calculateInflationAdjustedSalary(65000, 2030, 2031);

        // Should use CONSTANTS.DEFAULT_CPI_RATE (2.5%)
        expect(result).toBeCloseTo(66625, 0); // 65000 * 1.025
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
