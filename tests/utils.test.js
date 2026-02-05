/**
 * Unit Tests for Utils Module
 *
 * Tests pure utility functions from js/utils.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../js/utils.js';

describe('Utils Module', () => {

    describe('debounce', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('delays function execution by specified wait time', () => {
            const fn = vi.fn();
            const debounced = debounce(fn, 100);

            debounced();

            // Function not called immediately
            expect(fn).not.toHaveBeenCalled();

            // Advance time by 50ms (not enough)
            vi.advanceTimersByTime(50);
            expect(fn).not.toHaveBeenCalled();

            // Advance to 100ms total
            vi.advanceTimersByTime(50);
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('resets timer on subsequent calls within wait period', () => {
            const fn = vi.fn();
            const debounced = debounce(fn, 100);

            debounced();
            vi.advanceTimersByTime(50);
            debounced(); // Reset timer
            vi.advanceTimersByTime(50);

            // Still not called (timer reset)
            expect(fn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(50);
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('passes arguments to the debounced function', () => {
            const fn = vi.fn();
            const debounced = debounce(fn, 100);

            debounced('arg1', 'arg2', 123);
            vi.advanceTimersByTime(100);

            expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123);
        });

        it('uses the most recent arguments when called multiple times', () => {
            const fn = vi.fn();
            const debounced = debounce(fn, 100);

            debounced('first');
            vi.advanceTimersByTime(50);
            debounced('second');
            vi.advanceTimersByTime(50);
            debounced('third');
            vi.advanceTimersByTime(100);

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith('third');
        });

        it('preserves this context', () => {
            const obj = {
                value: 42,
                getValue: vi.fn(function() { return this.value; })
            };

            obj.debouncedGetValue = debounce(obj.getValue, 100);

            obj.debouncedGetValue();
            vi.advanceTimersByTime(100);

            expect(obj.getValue).toHaveBeenCalled();
        });

        it('allows multiple independent debounced functions', () => {
            const fn1 = vi.fn();
            const fn2 = vi.fn();
            const debounced1 = debounce(fn1, 100);
            const debounced2 = debounce(fn2, 200);

            debounced1();
            debounced2();

            vi.advanceTimersByTime(100);
            expect(fn1).toHaveBeenCalledTimes(1);
            expect(fn2).not.toHaveBeenCalled();

            vi.advanceTimersByTime(100);
            expect(fn2).toHaveBeenCalledTimes(1);
        });

        it('handles zero wait time (essentially setTimeout 0)', () => {
            const fn = vi.fn();
            const debounced = debounce(fn, 0);

            debounced();
            expect(fn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(0);
            expect(fn).toHaveBeenCalledTimes(1);
        });
    });
});
