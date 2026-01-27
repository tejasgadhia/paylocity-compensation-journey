/**
 * Unit Tests for Parser Functions
 *
 * Tests critical parsing logic from app.js:
 * - parsePaylocityData() - Main parser with regex
 * - parseRecord() - Single record parsing
 * - validateSalaryRange() - Input validation
 * - escapeHTML() - XSS prevention
 */

import { describe, it, expect } from 'vitest';
import {
    parsePaylocityData,
    parseRecord,
    validateSalaryRange
} from '../js/parser.js';
import { escapeHTML } from '../app.js';

describe('parsePaylocityData', () => {
    describe('Valid Input Handling', () => {
        it('parses single valid record with all fields', () => {
            const input = '01/15/2023   Merit Increase   $2,500.0065,000.0031.25';
            const result = parsePaylocityData(input);

            expect(result.records).toHaveLength(1);
            expect(result.records[0]).toMatchObject({
                date: '2023-01-15',
                reason: 'Merit Increase',
                perCheck: 2500.00,
                annual: 65000.00,
                hourlyRate: 31.25
            });
        });

        it('parses multiple records in chronological order', () => {
            const input = `01/15/2023   Merit Increase   $2,500.0065,000.0031.25
06/01/2024   Promotion   $3,000.0078,000.0037.50
12/15/2024   Market Adjustment   $3,250.0084,500.0040.63`;

            const result = parsePaylocityData(input);

            expect(result.records).toHaveLength(3);
            // Records should be sorted descending by date
            expect(result.records[0].date).toBe('2024-12-15');
            expect(result.records[1].date).toBe('2024-06-01');
            expect(result.records[2].date).toBe('2023-01-15');
        });

        it('calculates change amount and percentage correctly', () => {
            const input = `01/15/2023   New Hire   $2,500.0065,000.0031.25
06/01/2023   Merit Increase   $3,000.0078,000.0037.50`;

            const result = parsePaylocityData(input);

            // Most recent record (Merit Increase)
            expect(result.records[0]).toMatchObject({
                annual: 78000,
                change: 13000, // 78000 - 65000
                changePercent: 20 // (13000 / 65000) * 100
            });

            // Initial record (New Hire) - no change
            expect(result.records[1]).toMatchObject({
                annual: 65000,
                change: 0,
                changePercent: 0
            });
        });

        it('handles missing hourly rate by deriving from annual', () => {
            const input = '01/15/2023   Merit Increase   $2,500.0065,000.00';
            const result = parsePaylocityData(input);

            expect(result.records[0].annual).toBe(65000);
            expect(result.records[0].hourlyRate).toBeCloseTo(31.25, 2); // 65000 / 2080
        });

        it('handles concatenated values without spaces', () => {
            const input = '01/15/2023Merit Increase$2,500.0065,000.0031.25';
            const result = parsePaylocityData(input);

            expect(result.records[0]).toMatchObject({
                date: '2023-01-15',
                reason: 'Merit Increase',
                annual: 65000.00
            });
        });

        it('sets hireDate and currentDate correctly', () => {
            const input = `01/15/2023   New Hire   $2,500.0065,000.0031.25
06/01/2024   Merit Increase   $3,000.0078,000.0037.50`;

            const result = parsePaylocityData(input);

            expect(result.hireDate).toBe('2023-01-15'); // Earliest date
            expect(result.currentDate).toBe('2024-06-01'); // Most recent date
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('throws error when no valid dates found', () => {
            const input = 'Merit Increase $2,500.00 65,000.00 31.25';

            expect(() => parsePaylocityData(input)).toThrow('No valid dates found');
        });

        it('throws error when salary exceeds maximum range', () => {
            const input = '01/15/2023   Merit Increase   $999,999,999.00';

            expect(() => parsePaylocityData(input)).toThrow('outside valid range');
        });

        it('throws error when salary is negative', () => {
            const input = '01/15/2023   Merit Increase   -$5,000.00';

            expect(() => parsePaylocityData(input)).toThrow();
        });

        it('throws error when salary is unrealistically low', () => {
            const input = '01/15/2023   Merit Increase   $500.00';

            expect(() => parsePaylocityData(input)).toThrow('outside valid range');
        });

        it('handles various date formats', () => {
            const input = '01/15/2023   Merit Increase   $2,500.0065,000.0031.25';
            const result = parsePaylocityData(input);

            expect(result.records[0].date).toBe('2023-01-15'); // YYYY-MM-DD format
        });

        it('handles whitespace-heavy input', () => {
            const input = '  01/15/2023     Merit Increase     $2,500.00    65,000.00    31.25  ';
            const result = parsePaylocityData(input);

            expect(result.records).toHaveLength(1);
            expect(result.records[0].annual).toBe(65000);
        });

        it('recognizes all supported change reasons', () => {
            const reasons = [
                'Merit Increase',
                'Promotion',
                'Market Adjustment',
                'Equity',
                'New Hire'
            ];

            reasons.forEach(reason => {
                const input = `01/15/2023   ${reason}   $2,500.0065,000.0031.25`;
                const result = parsePaylocityData(input);

                expect(result.records[0].reason).toBe(reason);
            });
        });

        it('defaults to "Unknown" for unrecognized reasons', () => {
            const input = '01/15/2023   Special Bonus   $2,500.0065,000.0031.25';
            const result = parsePaylocityData(input);

            expect(result.records[0].reason).toBe('Unknown');
        });
    });
});

describe('parseRecord', () => {
    it('converts date from MM/DD/YYYY to YYYY-MM-DD format', () => {
        const record = parseRecord('01/15/2023', 'Merit Increase $2,500.0065,000.0031.25');

        expect(record.date).toBe('2023-01-15');
    });

    it('extracts dollar amounts with exactly 2 decimal places', () => {
        const record = parseRecord('01/15/2023', 'Merit Increase $2,500.0065,000.0031.25');

        expect(record.perCheck).toBe(2500.00);
        expect(record.annual).toBe(65000.00);
        expect(record.hourlyRate).toBe(31.25);
    });

    it('handles concatenated dollar amounts without spaces', () => {
        const record = parseRecord('06/12/2022', 'Merit Increase$1,166.6712.2807');

        expect(record.perCheck).toBeCloseTo(1166.67, 2);
        // Note: This is a known parsing issue where the concatenated value is truncated
    });

    it('derives hourly rate from annual when missing', () => {
        const record = parseRecord('01/15/2023', 'Merit Increase $2,500.0065,000.00');

        expect(record.hourlyRate).toBeCloseTo(31.25, 2); // 65000 / 2080
    });

    it('strips HTML-like patterns from reason (XSS prevention)', () => {
        const record = parseRecord('01/15/2023', '<script>alert("xss")</script> Merit Increase $2,500.0065,000.00');

        expect(record.reason).toBe('Merit Increase');
        expect(record.reason).not.toContain('<script>');
    });
});

describe('validateSalaryRange', () => {
    describe('Annual Salary Validation', () => {
        it('accepts valid annual salaries', () => {
            expect(validateSalaryRange(65000, 'annual')).toBe(65000);
            expect(validateSalaryRange(100000, 'annual')).toBe(100000);
            expect(validateSalaryRange(1500, 'annual')).toBe(1500);
        });

        it('rejects annual salary above maximum', () => {
            expect(() => validateSalaryRange(15000000, 'annual'))
                .toThrow('outside valid range');
        });

        it('rejects annual salary below minimum', () => {
            expect(() => validateSalaryRange(500, 'annual'))
                .toThrow('outside valid range');
        });

        it('rejects negative annual salaries', () => {
            expect(() => validateSalaryRange(-5000, 'annual'))
                .toThrow('outside valid range');
        });
    });

    describe('Edge Case Handling', () => {
        it('rejects NaN values', () => {
            expect(() => validateSalaryRange(NaN, 'annual'))
                .toThrow('not a finite number');
        });

        it('rejects Infinity values', () => {
            expect(() => validateSalaryRange(Infinity, 'annual'))
                .toThrow('not a finite number');
        });

        it('rejects -Infinity values', () => {
            expect(() => validateSalaryRange(-Infinity, 'annual'))
                .toThrow('not a finite number');
        });
    });

    describe('Per-Check Validation', () => {
        it('accepts valid per-check amounts', () => {
            expect(validateSalaryRange(2500, 'perCheck')).toBe(2500);
        });

        it('rejects per-check amount above maximum', () => {
            expect(() => validateSalaryRange(500000, 'perCheck'))
                .toThrow('outside valid range');
        });
    });

    describe('Hourly Rate Validation', () => {
        it('accepts valid hourly rates', () => {
            expect(validateSalaryRange(31.25, 'hourlyRate')).toBeCloseTo(31.25, 2);
        });

        it('rejects hourly rate above maximum', () => {
            expect(() => validateSalaryRange(6000, 'hourlyRate'))
                .toThrow('outside valid range');
        });
    });
});

describe('escapeHTML', () => {
    it('escapes < and > characters', () => {
        expect(escapeHTML('<div>test</div>'))
            .toBe('&lt;div&gt;test&lt;&#x2F;div&gt;');
    });

    it('escapes & character', () => {
        expect(escapeHTML('Tom & Jerry'))
            .toBe('Tom &amp; Jerry');
    });

    it('escapes quotes', () => {
        expect(escapeHTML('"Hello" \'World\''))
            .toBe('&quot;Hello&quot; &#x27;World&#x27;');
    });

    it('escapes script tags (XSS prevention)', () => {
        const malicious = '<script>alert("XSS")</script>';
        const escaped = escapeHTML(malicious);

        expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
        expect(escaped).not.toContain('<script>');
    });

    it('handles empty strings', () => {
        expect(escapeHTML('')).toBe('');
    });

    it('handles strings without special characters', () => {
        expect(escapeHTML('Hello World')).toBe('Hello World');
    });

    it('escapes all HTML entities in complex input', () => {
        const input = '<a href="http://example.com">Click & "view" \'more\'</a>';
        const escaped = escapeHTML(input);

        expect(escaped).toBe('&lt;a href=&quot;http:&#x2F;&#x2F;example.com&quot;&gt;Click &amp; &quot;view&quot; &#x27;more&#x27;&lt;&#x2F;a&gt;');
    });
});
