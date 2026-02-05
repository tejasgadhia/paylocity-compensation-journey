/**
 * Unit Tests for Tables Module
 *
 * Tests the table rendering functions extracted to js/tables.js
 */

import { describe, it, expect } from 'vitest';
import { getBadgeClass } from '../js/tables.js';

describe('Tables Module', () => {

    describe('getBadgeClass', () => {
        it('returns badge-merit for Merit Increase', () => {
            expect(getBadgeClass('Merit Increase')).toBe('badge-merit');
        });

        it('returns badge-merit for Annual Merit', () => {
            expect(getBadgeClass('Annual Merit Review')).toBe('badge-merit');
        });

        it('returns badge-equity for Equity Adjustment', () => {
            expect(getBadgeClass('Equity Adjustment')).toBe('badge-equity');
        });

        it('returns badge-market for Market Adjustment', () => {
            expect(getBadgeClass('Market Adjustment')).toBe('badge-market');
        });

        it('returns badge-new for New Hire', () => {
            expect(getBadgeClass('New Hire')).toBe('badge-new');
        });

        it('returns empty string for unknown reason types', () => {
            expect(getBadgeClass('Unknown Reason')).toBe('');
            expect(getBadgeClass('Promotion')).toBe('');
            expect(getBadgeClass('')).toBe('');
        });

        it('matches partial strings (contains check)', () => {
            // Merit anywhere in string
            expect(getBadgeClass('Performance Merit')).toBe('badge-merit');
            // Equity anywhere
            expect(getBadgeClass('Stock Equity Grant')).toBe('badge-equity');
            // Market anywhere
            expect(getBadgeClass('Competitive Market Rate')).toBe('badge-market');
            // New anywhere
            expect(getBadgeClass('New Position')).toBe('badge-new');
        });

        it('respects priority order (Merit > Equity > Market > New)', () => {
            // When multiple keywords present, first match wins
            // Merit + Equity → badge-merit
            expect(getBadgeClass('Merit Equity')).toBe('badge-merit');
            // Equity + New → badge-equity
            expect(getBadgeClass('New Equity')).toBe('badge-equity');
        });
    });
});
