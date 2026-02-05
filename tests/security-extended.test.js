/**
 * Extended Security Tests for escapeHTML function
 *
 * Tests the escapeHTML function added to js/security.js
 */

import { describe, it, expect } from 'vitest';
import { escapeHTML } from '../js/security.js';

describe('Security Module - escapeHTML', () => {

    describe('basic character escaping', () => {
        it('escapes ampersand', () => {
            expect(escapeHTML('Tom & Jerry')).toBe('Tom &amp; Jerry');
        });

        it('escapes less than', () => {
            expect(escapeHTML('a < b')).toBe('a &lt; b');
        });

        it('escapes greater than', () => {
            expect(escapeHTML('a > b')).toBe('a &gt; b');
        });

        it('escapes double quotes', () => {
            expect(escapeHTML('say "hello"')).toBe('say &quot;hello&quot;');
        });

        it('escapes single quotes', () => {
            expect(escapeHTML("it's working")).toBe('it&#x27;s working');
        });

        it('escapes forward slash', () => {
            expect(escapeHTML('path/to/file')).toBe('path&#x2F;to&#x2F;file');
        });
    });

    describe('XSS attack prevention', () => {
        it('escapes script tags', () => {
            const malicious = '<script>alert("XSS")</script>';
            const escaped = escapeHTML(malicious);
            expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
            expect(escaped).not.toContain('<script');
        });

        it('escapes img onerror attack (neutralizes as HTML)', () => {
            const malicious = '<img src=x onerror="alert(1)">';
            const escaped = escapeHTML(malicious);
            // The angle brackets are escaped, making it safe to display as text
            expect(escaped).not.toContain('<img');
            expect(escaped).toContain('&lt;img');
            // The attribute is still present but harmless as escaped text
            expect(escaped).toContain('onerror');
        });

        it('escapes javascript: protocol (neutralizes as HTML)', () => {
            const malicious = '<a href="javascript:alert(1)">click</a>';
            const escaped = escapeHTML(malicious);
            // The anchor tag is escaped, making the link non-functional
            expect(escaped).not.toContain('<a');
            expect(escaped).toContain('&lt;a');
            // The protocol is still present but rendered as text, not a link
            expect(escaped).toContain('javascript:');
        });

        it('escapes event handler attributes (neutralizes as HTML)', () => {
            const malicious = '<div onclick="evil()">click me</div>';
            const escaped = escapeHTML(malicious);
            // The div is escaped, so onclick becomes plain text
            expect(escaped).not.toContain('<div');
            expect(escaped).toContain('&lt;div');
            // The handler name is present but harmless as text
            expect(escaped).toContain('onclick');
        });

        it('escapes iframe injection', () => {
            const malicious = '<iframe src="evil.com"></iframe>';
            const escaped = escapeHTML(malicious);
            expect(escaped).not.toContain('<iframe');
        });
    });

    describe('edge cases', () => {
        it('returns non-string values unchanged', () => {
            expect(escapeHTML(123)).toBe(123);
            expect(escapeHTML(null)).toBe(null);
            expect(escapeHTML(undefined)).toBe(undefined);
            expect(escapeHTML(true)).toBe(true);
        });

        it('handles empty string', () => {
            expect(escapeHTML('')).toBe('');
        });

        it('handles string with no special characters', () => {
            expect(escapeHTML('Hello World')).toBe('Hello World');
        });

        it('handles multiple special characters together', () => {
            const input = '<div class="test" data-val=\'foo\' id="bar/baz">&nbsp;</div>';
            const escaped = escapeHTML(input);
            expect(escaped).not.toContain('<');
            expect(escaped).not.toContain('>');
            expect(escaped).not.toContain('"');
            expect(escaped).not.toContain("'");
        });

        it('handles nested escaping correctly (does not double-escape)', () => {
            // If we escape twice, we should get &amp;amp; etc
            const once = escapeHTML('&');
            expect(once).toBe('&amp;');

            const twice = escapeHTML(once);
            expect(twice).toBe('&amp;amp;');
        });

        it('handles unicode characters (passes through unchanged)', () => {
            expect(escapeHTML('日本語')).toBe('日本語');
            expect(escapeHTML('émoji 🎉')).toBe('émoji 🎉');
        });

        it('handles mixed safe and unsafe content', () => {
            const input = 'Name: <strong>John</strong> & "Jane"';
            const expected = 'Name: &lt;strong&gt;John&lt;&#x2F;strong&gt; &amp; &quot;Jane&quot;';
            expect(escapeHTML(input)).toBe(expected);
        });
    });

    describe('real-world Paylocity data scenarios', () => {
        it('escapes reason field safely', () => {
            // Normal reasons should pass through with minimal changes
            expect(escapeHTML('Merit Increase')).toBe('Merit Increase');
            expect(escapeHTML('New Hire')).toBe('New Hire');
            expect(escapeHTML('Equity Adjustment')).toBe('Equity Adjustment');
        });

        it('handles reason with special characters', () => {
            // Some companies use special chars in reason codes
            expect(escapeHTML('Merit - Q4/2024')).toBe('Merit - Q4&#x2F;2024');
            expect(escapeHTML('Raise (10% cap)')).toBe('Raise (10% cap)');
        });
    });
});
