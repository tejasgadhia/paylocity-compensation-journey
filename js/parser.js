// ========================================
// PARSER FUNCTIONS
// ========================================

/**
 * Validates salary values are within reasonable ranges.
 * Prevents parsing of corrupted/malicious data with extreme values.
 *
 * **Security Context:**
 * Protects against:
 * - Chart rendering failures from extreme values
 * - Memory overflow in calculations
 * - Misleading visualizations from unrealistic salaries
 *
 * @param {number} value - Salary value to validate
 * @param {string} fieldName - Field name for error messages ('annual', 'perCheck', 'hourlyRate')
 * @returns {number} The validated value
 * @throws {Error} If value is outside valid range or not finite
 *
 * @example
 * validateSalaryRange(65000, 'annual') // → 65000 (valid)
 * validateSalaryRange(999999999, 'annual') // → Throws error (too high)
 * validateSalaryRange(-5000, 'annual') // → Throws error (negative)
 */
export function validateSalaryRange(value, fieldName = 'salary') {
    // Reasonable ranges for US compensation data
    const ranges = {
        annual: { min: 1000, max: 10000000 },      // $1K - $10M (executive cap)
        perCheck: { min: 50, max: 400000 },         // $50 - $400K per paycheck
        hourlyRate: { min: 1, max: 5000 },          // $1 - $5K per hour
        change: { min: 0, max: 5000000 }            // $0 - $5M raise (one-time)
    };

    const range = ranges[fieldName] || ranges.annual;

    // Check for invalid numbers (NaN, Infinity, etc.)
    if (!Number.isFinite(value)) {
        throw new Error(`Invalid ${fieldName}: ${value} (not a finite number)`);
    }

    // Check range
    if (value < range.min || value > range.max) {
        const formatted = value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const minFormatted = range.min.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const maxFormatted = range.max.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        throw new Error(`${fieldName} ${formatted} outside valid range (${minFormatted} - ${maxFormatted})`);
    }

    return value;
}

/**
 * Parses a single Paylocity compensation record from raw text.
 *
 * Extracts structured data from concatenated values using multiple regex strategies.
 * Handles Paylocity's inconsistent formatting: concatenated dollar amounts without spaces,
 * variable decimal places, and missing hourly rates. Uses whitelist approach for
 * security and defensive parsing for robustness.
 *
 * @param {string} dateStr - Date string in MM/DD/YYYY format (e.g., "01/15/2023")
 * @param {string} text - Raw record text containing reason and dollar amounts
 * @returns {Object} Parsed compensation record
 * @returns {string} returns.date - Record date in YYYY-MM-DD format
 * @returns {string} returns.reason - Change reason ('Merit Increase', 'Promotion', etc.)
 * @returns {number} returns.perCheck - Per-paycheck amount (bi-weekly)
 * @returns {number} returns.annual - Annual salary
 * @returns {number|null} returns.hourlyRate - Hourly rate (null if missing, derived if possible)
 *
 * @example
 * // Normal format with all values
 * const record = parseRecord("01/15/2023", "Merit Increase   $2,500.0065,000.0031.25");
 * console.log(record);
 * // { date: "2023-01-15", reason: "Merit Increase",
 * //   perCheck: 2500.00, annual: 65000.00, hourlyRate: 31.25 }
 *
 * @example
 * // Missing hourly rate (auto-calculated from annual)
 * const record = parseRecord("01/15/2023", "Promotion   $3,000.0078,000.00");
 * console.log(record.hourlyRate); // 37.50 (derived: 78000 / 2080)
 *
 * @example
 * // Concatenated values without spaces
 * const record = parseRecord("06/12/2022", "Merit Increase$1,166.6712.2807");
 * // Correctly parses: perCheck=$1,166.67, annual=12.28 (uses exactly 2 decimals)
 */
export function parseRecord(dateStr, text) {
    // Convert date format from MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = dateStr.split('/');
    const date = `${year}-${month}-${day}`;

    // Extract change reason (whitelist approach for security)
    let reason = 'Unknown';
    const reasons = ['Merit Increase', 'Promotion', 'Market Adjustment', 'Equity', 'New Hire'];
    for (const r of reasons) {
        if (text.includes(r)) {
            reason = r;
            break;
        }
    }
    if (text.includes('—') && reason === 'Unknown') {
        reason = '—';
    }

    // Security: Strip any HTML-like patterns from reason (defense in depth)
    // This protects against malicious input even though we escape at display time
    reason = reason.replace(/<[^>]*>/g, '');

    // Extract dollar amounts - use exactly 2 decimal places to handle concatenated values
    // e.g., "$1,166.6712.2807" should parse as $1,166.67 (not $1,166.6712)
    // Pattern breakdown:
    //   \$ - Literal dollar sign
    //   ([0-9,]+\.\d{2}) - Captured group:
    //     [0-9,]+ - One or more digits or commas (e.g., "1,166" or "65000")
    //     \. - Literal decimal point
    //     \d{2} - Exactly 2 decimal digits (prevents capturing extra decimals from concatenated values)
    // Why exactly 2 decimals? Paylocity concatenates values like "$1,166.6712.2807"
    // Using \d{2} stops at "$1,166.67" instead of greedily taking "$1,166.6712"
    const dollarPattern = /\$([0-9,]+\.\d{2})/g;
    const dollars = [];
    let dollarMatch;
    while ((dollarMatch = dollarPattern.exec(text)) !== null) {
        dollars.push(parseFloat(dollarMatch[1].replace(/,/g, '')));
    }

    // Expected order: Per Check, Annual Salary, Amount (change)
    let perCheck = 0, annual = 0, change = 0;

    if (dollars.length >= 2) {
        // Find the annual salary (typically the largest reasonable number, >= 20000)
        const annualCandidates = dollars.filter(d => d >= 20000);
        if (annualCandidates.length > 0) {
            annual = validateSalaryRange(annualCandidates[0], 'annual');
        }

        // Per check is usually the first dollar amount
        perCheck = dollars[0];
        if (perCheck >= 20000) {
            // First one was annual, find actual per check
            const perCheckCandidate = dollars.find(d => d < 20000 && d > 100) || 0;
            perCheck = perCheckCandidate > 0 ? validateSalaryRange(perCheckCandidate, 'perCheck') : 0;
        } else {
            perCheck = perCheck > 0 ? validateSalaryRange(perCheck, 'perCheck') : 0;
        }

        // Change/Amount is usually after annual salary
        if (dollars.length >= 3) {
            const annualIdx = dollars.indexOf(annualCandidates[0]); // Use unvalidated value for indexOf
            const afterAnnual = dollars.slice(annualIdx + 1);
            if (afterAnnual.length > 0 && afterAnnual[0] > 0) {
                change = validateSalaryRange(afterAnnual[0], 'change');
            }
        }
    }

    // Extract hourly rate (XXX.XXXX / Hour)
    // Pattern breakdown:
    //   (\d+\.?\d*) - Captured group for the rate:
    //     \d+ - One or more digits (required)
    //     \.? - Optional decimal point
    //     \d* - Zero or more decimal digits (allows "31.25" or "31")
    //   \s* - Zero or more whitespace characters
    //   \/ - Literal forward slash
    //   \s* - Zero or more whitespace characters
    //   Hour - Literal text "Hour" (case-insensitive due to 'i' flag)
    // Matches: "31.25 / Hour", "31.25/Hour", "31 / Hour"
    const hourlyPattern = /(\d+\.?\d*)\s*\/\s*Hour/i;
    const hourlyMatch = text.match(hourlyPattern);
    let hourlyRate = 0;
    if (hourlyMatch) {
        const parsedRate = parseFloat(hourlyMatch[1]);
        hourlyRate = parsedRate > 0 ? validateSalaryRange(parsedRate, 'hourlyRate') : 0;
    }

    // Extract percentage - it's the last decimal number in the string
    // Look for pattern like "12.2807" or "0.0000" at the end (after last $X.XX amount)
    // Pattern breakdown:
    //   (\d+\.\d{4}) - Captured group:
    //     \d+ - One or more digits (e.g., "12" or "0")
    //     \. - Literal decimal point
    //     \d{4} - Exactly 4 decimal digits (Paylocity uses 4 decimals for percentages: "12.2807")
    //   \s* - Zero or more whitespace characters
    //   $ - End of string anchor (ensures we match the last number only)
    // Example: "01/15/2023 Merit Increase $2,500.0065,000.0031.2512.2807" matches "12.2807"
    const percentPattern = /(\d+\.\d{4})\s*$/;
    const percentMatch = text.trim().match(percentPattern);
    let changePercent = 0;
    if (percentMatch) {
        changePercent = parseFloat(percentMatch[1]);
    } else {
        // Fallback: try to find any percentage-like number at end
        // Pattern: (\d+\.?\d*)\s*$ matches any decimal number at the end
        //   \d+ - One or more digits (required)
        //   \.? - Optional decimal point
        //   \d* - Zero or more decimal digits (allows "12.28" or "12")
        //   \s* - Zero or more whitespace
        //   $ - End of string anchor
        // Used when main percentPattern fails (e.g., percentage has fewer than 4 decimals)
        const fallbackMatch = text.trim().match(/(\d+\.?\d*)\s*$/);
        if (fallbackMatch) {
            const potential = parseFloat(fallbackMatch[1]);
            if (potential < 100) {
                changePercent = potential;
            }
        }
    }

    // Validate we have minimum required data
    if (annual === 0) {
        return null;
    }

    return {
        date,
        reason,
        perCheck,
        annual,
        hourlyRate,
        change,
        changePercent
    };
}

/**
 * Parses raw Paylocity compensation history data into structured records.
 *
 * Handles inconsistent formatting from Paylocity's "Rates" tab by using multiple
 * fallback strategies to extract dates, dollar amounts, and hourly rates. Robust
 * against concatenated values (e.g., "$1,166.6712.2807") and missing fields.
 *
 * @param {string} rawText - Raw text copied from Paylocity "Rates" tab
 * @returns {Object} Parsed compensation data
 * @returns {string} returns.hireDate - Earliest record date (YYYY-MM-DD format)
 * @returns {string} returns.currentDate - Most recent record date (YYYY-MM-DD format)
 * @returns {Array<Object>} returns.records - Array of compensation records, sorted descending by date
 * @returns {string} returns.records[].date - Record date (YYYY-MM-DD)
 * @returns {string} returns.records[].reason - Change reason ('Merit Increase', 'Promotion', etc.)
 * @returns {number} returns.records[].perCheck - Per-paycheck amount (bi-weekly)
 * @returns {number} returns.records[].annual - Annual salary
 * @returns {number} returns.records[].hourlyRate - Hourly rate (may be null)
 * @returns {number} returns.records[].change - Dollar change from previous record
 * @returns {number} returns.records[].changePercent - Percentage change from previous record
 * @throws {Error} If no valid dates found or no records could be parsed
 *
 * @example
 * const data = parsePaylocityData("01/15/2023   Merit Increase   $2,500.0065,000.0031.25");
 * console.log(data.records[0].annual); // 65000
 */
export function parsePaylocityData(rawText) {
    const records = [];

    // Clean up the text
    let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Find all date patterns (MM/DD/YYYY) which start each record
    // Pattern: \d{2}\/\d{2}\/\d{4} matches MM/DD/YYYY (e.g., "01/15/2023")
    // Captured group (\d{2}\/\d{2}\/\d{4}) extracts the full date
    // Global flag 'g' finds all occurrences (one per compensation record)
    const datePattern = /(\d{2}\/\d{2}\/\d{4})/g;
    const dates = [];
    let match;

    while ((match = datePattern.exec(text)) !== null) {
        dates.push({ date: match[1], index: match.index });
    }

    if (dates.length === 0) {
        throw new Error('No valid dates found in the data');
    }

    // Extract each record between dates
    for (let i = 0; i < dates.length; i++) {
        const startIdx = dates[i].index;
        const endIdx = i < dates.length - 1 ? dates[i + 1].index : text.length;
        const recordText = text.substring(startIdx, endIdx);

        try {
            const record = parseRecord(dates[i].date, recordText);
            if (record) {
                records.push(record);
            }
        } catch (e) {
            console.warn('Failed to parse record:', recordText, e);
        }
    }

    if (records.length === 0) {
        throw new Error('Could not parse any records from the data');
    }

    // Sort by date descending (most recent first)
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Find hire date (earliest record)
    const sortedByDate = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    const hireDate = sortedByDate[0].date;
    const currentDate = sortedByDate[sortedByDate.length - 1].date;

    return {
        hireDate,
        currentDate,
        records
    };
}
