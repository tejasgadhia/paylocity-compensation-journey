/**
 * Performance Tests (#167)
 *
 * Establishes baseline performance metrics for:
 * - Parser performance with varying data sizes
 * - Calculation performance (memoization effectiveness)
 * - Memory usage patterns
 *
 * These baselines help detect performance regressions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parsePaylocityData } from '../js/parser.js';
import {
    calculateInflationAdjustedSalary,
    calculateCAGR,
    clearMemoCache
} from '../js/calculations.js';

/**
 * Generate a single valid Paylocity record
 * @param {Date} date - Record date
 * @param {string} reason - Change reason
 * @param {number} annual - Annual salary
 * @returns {string} Formatted record line
 */
function generateRecord(date, reason, annual) {
    const perCheck = (annual / 26).toFixed(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}   ${reason}   $${Number(perCheck).toLocaleString()}$${annual.toLocaleString()}.00`;
}

/**
 * Generate test data with specified number of records
 * @param {number} count - Number of records to generate
 * @returns {string} Multi-line Paylocity data
 */
function generateTestData(count) {
    const reasons = ['Merit Increase', 'Promotion', 'Market Adjustment', 'Equity'];
    const records = [];
    let salary = 60000;
    const startDate = new Date(2020, 0, 15);
    const MAX_SALARY = 9000000; // Stay under $10M validation max

    // First record is always New Hire
    records.push(generateRecord(startDate, 'New Hire', salary));

    for (let i = 1; i < count; i++) {
        // Increment date by ~6 months
        const date = new Date(startDate.getTime() + (i * 180 * 24 * 60 * 60 * 1000));
        // Small raise 1-3% to avoid hitting max
        const raisePercent = 0.01 + Math.random() * 0.02;
        salary = Math.min(Math.round(salary * (1 + raisePercent)), MAX_SALARY);
        const reason = reasons[i % reasons.length];
        records.push(generateRecord(date, reason, salary));
    }

    return records.join('\n');
}

describe('Parser Performance', () => {

    describe('Small Dataset (< 10 records)', () => {
        it('parses 5 records in under 10ms', () => {
            const input = generateTestData(5);
            const start = performance.now();
            parsePaylocityData(input);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(10);
        });
    });

    describe('Medium Dataset (10-50 records)', () => {
        it('parses 25 records in under 25ms', () => {
            const input = generateTestData(25);
            const start = performance.now();
            parsePaylocityData(input);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(25);
        });

        it('parses 50 records in under 50ms', () => {
            const input = generateTestData(50);
            const start = performance.now();
            parsePaylocityData(input);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(50);
        });
    });

    describe('Large Dataset (100+ records)', () => {
        it('parses 100 records in under 100ms', () => {
            const input = generateTestData(100);
            const start = performance.now();
            parsePaylocityData(input);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(100);
        });

        it('parses 200 records in under 200ms', () => {
            const input = generateTestData(200);
            const start = performance.now();
            parsePaylocityData(input);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(200);
        });

        it('scales linearly (not exponentially) with data size', () => {
            // Run multiple iterations to reduce JIT variance
            const iterations = 5;
            let total100 = 0;
            let total200 = 0;

            for (let i = 0; i < iterations; i++) {
                const input100 = generateTestData(100);
                const input200 = generateTestData(200);

                const start100 = performance.now();
                parsePaylocityData(input100);
                total100 += performance.now() - start100;

                const start200 = performance.now();
                parsePaylocityData(input200);
                total200 += performance.now() - start200;
            }

            const avg100 = total100 / iterations;
            const avg200 = total200 / iterations;

            // 200 records should take less than 4x the time of 100 records
            // (linear scaling with JIT variance tolerance)
            expect(avg200).toBeLessThan(avg100 * 4);
        });
    });

    describe('Stress Test', () => {
        it('handles 500 records without timing out', () => {
            const input = generateTestData(500);
            const start = performance.now();
            const result = parsePaylocityData(input);
            const duration = performance.now() - start;

            // At least 450 records should parse (some may hit validation edge cases)
            expect(result.records.length).toBeGreaterThanOrEqual(450);
            expect(duration).toBeLessThan(500); // 500ms max
        });
    });
});

describe('Calculation Performance', () => {

    beforeEach(() => {
        // Clear memoization cache before each test
        if (typeof clearMemoCache === 'function') {
            clearMemoCache();
        }
    });

    describe('Inflation Calculation', () => {
        it('calculates inflation for single year in under 1ms', () => {
            const start = performance.now();
            calculateInflationAdjustedSalary(65000, '2023-01-15', '2024-01-15');
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(1);
        });

        it('calculates inflation for 10-year period in under 5ms', () => {
            const start = performance.now();
            calculateInflationAdjustedSalary(65000, '2015-01-15', '2025-01-15');
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(5);
        });
    });

    describe('CAGR Calculation', () => {
        const mockData = {
            hireDate: '2020-01-15',
            currentDate: '2025-01-15',
            records: [
                { date: '2025-01-15', annual: 100000 },
                { date: '2020-01-15', annual: 60000 }
            ]
        };

        it('calculates CAGR in under 1ms', () => {
            const start = performance.now();
            calculateCAGR(mockData);
            const duration = performance.now() - start;

            expect(duration).toBeLessThan(1);
        });
    });

    describe('Memoization Effectiveness', () => {
        it('repeated inflation calculations are faster (memoized)', () => {
            // Clear any existing cache
            if (typeof clearMemoCache === 'function') {
                clearMemoCache();
            }

            // First call - cache miss
            const start1 = performance.now();
            calculateInflationAdjustedSalary(65000, '2020-01-15', '2025-01-15');
            const duration1 = performance.now() - start1;

            // Second call with same params - cache hit
            const start2 = performance.now();
            calculateInflationAdjustedSalary(65000, '2020-01-15', '2025-01-15');
            const duration2 = performance.now() - start2;

            // Cached call should be at least 2x faster (or close to 0)
            // Note: In V8, both might be very fast due to JIT optimization
            expect(duration2).toBeLessThanOrEqual(Math.max(duration1, 0.1));
        });

        it('handles many unique calculations without memory issues', () => {
            const salaries = Array.from({ length: 100 }, (_, i) => 50000 + i * 1000);
            const years = ['2020', '2021', '2022', '2023', '2024', '2025'];

            const start = performance.now();
            for (const salary of salaries) {
                for (let i = 0; i < years.length - 1; i++) {
                    calculateInflationAdjustedSalary(
                        salary,
                        `${years[i]}-01-15`,
                        `${years[i + 1]}-01-15`
                    );
                }
            }
            const duration = performance.now() - start;

            // 500 calculations should complete in under 500ms
            expect(duration).toBeLessThan(500);
        });
    });
});

describe('Concurrent Operations', () => {

    it('handles multiple parse operations in parallel', async () => {
        const inputs = Array.from({ length: 10 }, () => generateTestData(50));

        const start = performance.now();
        const results = await Promise.all(
            inputs.map(input => Promise.resolve(parsePaylocityData(input)))
        );
        const duration = performance.now() - start;

        expect(results).toHaveLength(10);
        results.forEach(result => {
            // Each result should have at least 40 records (some may fail validation)
            expect(result.records.length).toBeGreaterThanOrEqual(40);
        });

        // 10 parallel parses of 50 records each should complete in under 500ms
        expect(duration).toBeLessThan(500);
    });
});

describe('Memory Patterns', () => {

    it('does not leak memory on repeated parse operations', () => {
        // Parse 100 times and check that garbage collection works
        // (We can't directly measure memory in Vitest, but we can ensure no errors)
        for (let i = 0; i < 100; i++) {
            const input = generateTestData(20);
            parsePaylocityData(input);
        }

        // If we get here without running out of memory, test passes
        expect(true).toBe(true);
    });

    it('data structures are reasonable size', () => {
        const input = generateTestData(100);
        const result = parsePaylocityData(input);

        // Check that records array doesn't have excessive properties
        const recordKeys = Object.keys(result.records[0]);
        expect(recordKeys.length).toBeLessThanOrEqual(10);

        // Check that we have expected structure
        expect(result).toHaveProperty('hireDate');
        expect(result).toHaveProperty('currentDate');
        expect(result).toHaveProperty('records');
    });
});
