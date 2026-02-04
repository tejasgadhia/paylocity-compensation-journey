/**
 * Security Tests for XSS Prevention
 *
 * Tests the validateTemplateData() defense-in-depth function that
 * validates template data before innerHTML usage.
 */

import { describe, it, expect } from 'vitest';
import { validateTemplateData } from '../js/security.js';

describe('validateTemplateData (XSS Prevention)', () => {

    describe('Valid Data', () => {
        it('accepts strings, numbers, and booleans', () => {
            expect(() => validateTemplateData({
                name: 'John Doe',
                salary: 75000,
                isActive: true,
                growth: 8.5
            })).not.toThrow();
        });

        it('accepts null values (optional fields)', () => {
            expect(() => validateTemplateData({
                name: 'Jane',
                sixFigureDate: null,
                notes: null
            })).not.toThrow();
        });

        it('accepts empty strings', () => {
            expect(() => validateTemplateData({
                description: ''
            })).not.toThrow();
        });

        it('accepts zero and negative numbers', () => {
            expect(() => validateTemplateData({
                balance: 0,
                change: -500
            })).not.toThrow();
        });
    });

    describe('Unsafe Types', () => {
        it('rejects objects as values', () => {
            expect(() => validateTemplateData({
                config: { nested: 'value' }
            })).toThrow(/Unsafe data type.*object/);
        });

        it('rejects arrays as values', () => {
            expect(() => validateTemplateData({
                items: [1, 2, 3]
            })).toThrow(/Unsafe data type.*object/);
        });

        it('rejects functions as values', () => {
            expect(() => validateTemplateData({
                callback: () => alert('xss')
            })).toThrow(/Unsafe data type.*function/);
        });

        it('rejects symbols as values', () => {
            expect(() => validateTemplateData({
                id: Symbol('test')
            })).toThrow(/Unsafe data type.*symbol/);
        });

        it('rejects undefined as values', () => {
            expect(() => validateTemplateData({
                missing: undefined
            })).toThrow(/Unsafe data type.*undefined/);
        });
    });

    describe('Script Injection', () => {
        it('rejects <script> tags', () => {
            expect(() => validateTemplateData({
                bio: '<script>alert("xss")</script>'
            })).toThrow(/Suspicious pattern/);
        });

        it('rejects <script> tags (case insensitive)', () => {
            expect(() => validateTemplateData({
                bio: '<ScRiPt>alert(1)</sCrIpT>'
            })).toThrow(/Suspicious pattern/);
        });

        it('rejects partial <script tags', () => {
            expect(() => validateTemplateData({
                bio: '<script src="evil.js"'
            })).toThrow(/Suspicious pattern/);
        });
    });

    describe('JavaScript URLs', () => {
        it('rejects javascript: URLs', () => {
            expect(() => validateTemplateData({
                link: 'javascript:alert(1)'
            })).toThrow(/Suspicious pattern/);
        });

        it('rejects javascript: URLs (case insensitive)', () => {
            expect(() => validateTemplateData({
                link: 'JaVaScRiPt:alert(1)'
            })).toThrow(/Suspicious pattern/);
        });

        it('rejects javascript: with whitespace', () => {
            expect(() => validateTemplateData({
                link: 'javascript:void(0)'
            })).toThrow(/Suspicious pattern/);
        });
    });

    describe('Event Handlers', () => {
        it('rejects onclick handlers', () => {
            expect(() => validateTemplateData({
                attr: 'onclick=alert(1)'
            })).toThrow(/Suspicious pattern/);
        });

        it('rejects onerror handlers', () => {
            expect(() => validateTemplateData({
                attr: 'onerror=alert(1)'
            })).toThrow(/Suspicious pattern/);
        });

        it('rejects onload handlers', () => {
            expect(() => validateTemplateData({
                attr: 'onload=alert(1)'
            })).toThrow(/Suspicious pattern/);
        });

        it('rejects onmouseover handlers', () => {
            expect(() => validateTemplateData({
                attr: 'onmouseover = alert(1)'
            })).toThrow(/Suspicious pattern/);
        });

        it('rejects onfocus handlers', () => {
            expect(() => validateTemplateData({
                attr: 'onfocus=evil()'
            })).toThrow(/Suspicious pattern/);
        });
    });

    describe('Iframe Injection', () => {
        it('rejects <iframe> tags', () => {
            expect(() => validateTemplateData({
                content: '<iframe src="evil.com"></iframe>'
            })).toThrow(/Suspicious pattern/);
        });

        it('rejects <iframe> tags (case insensitive)', () => {
            expect(() => validateTemplateData({
                content: '<IFrame src="evil.com">'
            })).toThrow(/Suspicious pattern/);
        });
    });

    describe('Edge Cases', () => {
        it('allows legitimate text containing "script" word', () => {
            expect(() => validateTemplateData({
                description: 'The script was written in JavaScript'
            })).not.toThrow();
        });

        it('allows legitimate text containing "onclick" word', () => {
            expect(() => validateTemplateData({
                description: 'Configure the onclick handler in settings'
            })).not.toThrow();
        });

        it('allows angle brackets not forming script tags', () => {
            expect(() => validateTemplateData({
                comparison: 'value < 100 and value > 50'
            })).not.toThrow();
        });

        it('allows colons in regular text', () => {
            expect(() => validateTemplateData({
                time: '10:30:45',
                url: 'https://example.com'
            })).not.toThrow();
        });

        it('handles multiple suspicious patterns in one value', () => {
            expect(() => validateTemplateData({
                attack: '<script>onclick=javascript:alert(1)</script>'
            })).toThrow(/Suspicious pattern/);
        });

        it('checks all keys, not just first', () => {
            expect(() => validateTemplateData({
                safe1: 'hello',
                safe2: 'world',
                evil: '<script>alert(1)</script>',
                safe3: 'goodbye'
            })).toThrow(/Suspicious pattern/);
        });
    });

    describe('Data URL Attacks (#169)', () => {
        it('rejects data:text/html XSS', () => {
            expect(() => validateTemplateData({
                link: "data:text/html,<script>alert('XSS')</script>"
            })).toThrow(/Suspicious pattern/);
        });

        it('rejects data:image/svg+xml XSS', () => {
            expect(() => validateTemplateData({
                img: 'data:image/svg+xml,<svg onload=alert(1)>'
            })).toThrow(/Suspicious pattern/);
        });

        it('rejects DATA: (case insensitive)', () => {
            expect(() => validateTemplateData({
                link: 'DATA:text/html,<script>alert(1)</script>'
            })).toThrow(/Suspicious pattern/);
        });

        it('rejects Data: (mixed case)', () => {
            expect(() => validateTemplateData({
                link: 'Data:text/html,evil'
            })).toThrow(/Suspicious pattern/);
        });

        it('rejects data:application/javascript', () => {
            expect(() => validateTemplateData({
                script: 'data:application/javascript,alert(1)'
            })).toThrow(/Suspicious pattern/);
        });
    });

    describe('Real-World Attack Vectors', () => {
        it('blocks img onerror attack', () => {
            expect(() => validateTemplateData({
                html: '<img src=x onerror=alert(1)>'
            })).toThrow(/Suspicious pattern/);
        });

        it('blocks svg onload attack', () => {
            expect(() => validateTemplateData({
                html: '<svg onload=alert(1)>'
            })).toThrow(/Suspicious pattern/);
        });

        it('blocks body onload attack', () => {
            expect(() => validateTemplateData({
                html: '<body onload=alert(1)>'
            })).toThrow(/Suspicious pattern/);
        });

        it('blocks input onfocus attack', () => {
            expect(() => validateTemplateData({
                html: '<input onfocus=alert(1) autofocus>'
            })).toThrow(/Suspicious pattern/);
        });

        it('blocks iframe srcdoc attack', () => {
            expect(() => validateTemplateData({
                html: '<iframe srcdoc="<script>alert(1)</script>">'
            })).toThrow(/Suspicious pattern/);
        });
    });
});
