// ========================================
// SECURITY FUNCTIONS
// ========================================

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Converts characters that have special meaning in HTML to their entity equivalents.
 *
 * **Security Context:**
 * This function protects against XSS (Cross-Site Scripting) attacks by escaping
 * user-provided data before inserting it into HTML via innerHTML. Even though the
 * parser uses a whitelist approach for the 'reason' field, this provides defense
 * in depth at the display layer.
 *
 * **When to Use:**
 * - Always escape user-provided strings before inserting via innerHTML
 * - Especially important for the 'reason' field from Paylocity data
 * - Use for any data that could potentially contain malicious input
 *
 * **Where Used:**
 * - buildHistoryTable() - Escapes r.reason before display
 * - buildMilestones() - Escapes milestone text fields
 *
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for insertion into HTML
 *
 * @example
 * escapeHTML('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 *
 * @example
 * // Safe usage in template literal
 * element.innerHTML = `<span>${escapeHTML(userInput)}</span>`;
 */
export function escapeHTML(str) {
    if (typeof str !== 'string') return str;

    const htmlEscapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };

    return str.replace(/[&<>"'\/]/g, char => htmlEscapeMap[char]);
}

/**
 * Validates template data for XSS patterns before innerHTML usage.
 *
 * Defense-in-depth layer that checks all template data values for:
 * - Unsafe types (objects, functions, symbols)
 * - Script injection patterns (<script, javascript:, on*=, <iframe)
 *
 * @param {Object} data - Key-value pairs to validate
 * @throws {Error} If unsafe data type or suspicious pattern detected
 *
 * @example
 * // Valid data passes
 * validateTemplateData({ name: 'John', age: 30 }); // OK
 *
 * @example
 * // Throws on script tags
 * validateTemplateData({ bio: '<script>alert(1)</script>' }); // Error!
 */
export function validateTemplateData(data) {
    for (const [key, value] of Object.entries(data)) {
        // Allow null (often used for optional fields like sixFigureDate)
        if (value === null) continue;

        // Check type is safe (string, number, boolean - no objects, functions, symbols)
        const type = typeof value;
        if (!['string', 'number', 'boolean'].includes(type)) {
            throw new Error(`Unsafe data type for template: ${key} is ${type}`);
        }

        // For strings, check for suspicious patterns (script tags, event handlers)
        if (type === 'string') {
            const suspiciousPatterns = [
                /<script/i,
                /javascript:/i,
                /on\w+\s*=/i,  // onclick=, onerror=, etc.
                /<iframe/i,
                /data:/i       // Prevent data: URL XSS attacks (#169)
            ];

            for (const pattern of suspiciousPatterns) {
                if (pattern.test(value)) {
                    throw new Error(`Suspicious pattern in template data: ${key} contains ${pattern}`);
                }
            }
        }
    }
}
