// ========================================
// SECURITY FUNCTIONS
// ========================================

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
                /<iframe/i
            ];

            for (const pattern of suspiciousPatterns) {
                if (pattern.test(value)) {
                    throw new Error(`Suspicious pattern in template data: ${key} contains ${pattern}`);
                }
            }
        }
    }
}
