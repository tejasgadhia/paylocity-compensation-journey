/**
 * Table Rendering Module
 *
 * Provides testable table rendering functions with dependency injection.
 * Extracted from app.js for better modularity and testability.
 */

import { CONSTANTS } from './constants.js';
import { formatDateDetail } from './calculations.js';

// ========================================
// MODULE STATE (injected via init)
// ========================================

let _state;
let _getEmployeeData;
let _escapeHTML;
let _formatCurrency;
let _getStartingSalary;
let _getCurrentSalary;
let _calculateCAGR;

/**
 * Initialize the tables module with dependencies.
 *
 * @param {Object} deps - Dependencies
 * @param {Object} deps.state - Application state
 * @param {Function} deps.getEmployeeData - Function to get employee data
 * @param {Function} deps.escapeHTML - XSS escape function
 * @param {Function} deps.formatCurrency - Currency formatting function
 * @param {Function} deps.getStartingSalary - Get starting salary
 * @param {Function} deps.getCurrentSalary - Get current salary
 * @param {Function} deps.calculateCAGR - Calculate CAGR
 */
export function initTables({
    state,
    getEmployeeData,
    escapeHTML,
    formatCurrency,
    getStartingSalary,
    getCurrentSalary,
    calculateCAGR
}) {
    _state = state;
    _getEmployeeData = getEmployeeData;
    _escapeHTML = escapeHTML;
    _formatCurrency = formatCurrency;
    _getStartingSalary = getStartingSalary;
    _getCurrentSalary = getCurrentSalary;
    _calculateCAGR = calculateCAGR;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Returns the CSS badge class for a given adjustment reason.
 *
 * Maps adjustment types to their visual styles:
 * - Merit increases → badge-merit (typically green)
 * - Equity adjustments → badge-equity (typically blue)
 * - Market adjustments → badge-market (typically purple)
 * - New Hire → badge-new (typically neutral)
 *
 * @param {string} reason - The adjustment reason text
 * @returns {string} CSS class name for the badge
 *
 * @example
 * getBadgeClass('Merit Increase') // Returns 'badge-merit'
 * getBadgeClass('Equity Adjustment') // Returns 'badge-equity'
 * getBadgeClass('Unknown Type') // Returns ''
 */
export function getBadgeClass(reason) {
    if (reason.includes('Merit')) return 'badge-merit';
    if (reason.includes('Equity')) return 'badge-equity';
    if (reason.includes('Market')) return 'badge-market';
    if (reason.includes('New')) return 'badge-new';
    return '';
}

// ========================================
// TABLE RENDERING
// ========================================

/**
 * Builds the compensation history table from employee data.
 *
 * Renders each salary record as a table row with:
 * - Date (formatted)
 * - Reason (with badge styling)
 * - Salary (actual or indexed based on privacy mode)
 * - Index (percentage of starting salary)
 * - Change amount (dollars or index points)
 * - Change percentage
 *
 * @returns {void}
 */
export function buildHistoryTable() {
    const employeeData = _getEmployeeData();
    if (!employeeData) return;

    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    const startingSalary = _getStartingSalary(employeeData);

    tbody.innerHTML = employeeData.records.map(r => {
        const badgeClass = getBadgeClass(r.reason);
        const index = ((r.annual / startingSalary) * 100).toFixed(0);
        const changeDisplay = r.change > 0
            ? (_state.showDollars
                ? `+${_formatCurrency(r.change * CONSTANTS.PAY_PERIODS_PER_YEAR)}`
                : `+${((r.change * CONSTANTS.PAY_PERIODS_PER_YEAR / startingSalary) * 100).toFixed(1)}`)
            : '—';

        return `
            <tr>
                <td>${formatDateDetail(r.date)}</td>
                <td><span class="badge ${badgeClass}">${_escapeHTML(r.reason)}</span></td>
                <td>${_state.showDollars ? _formatCurrency(r.annual) : `Index: ${index}`}</td>
                <td>${index}</td>
                <td>${changeDisplay}</td>
                <td>${r.changePercent > 0 ? `+${r.changePercent.toFixed(2)}%` : '—'}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Builds the salary projection table.
 *
 * Shows projected salaries at fixed intervals (1-5 years, then 10, 15, 20)
 * using three growth scenarios:
 * - Historical: Based on actual CAGR
 * - Conservative: 3% annual growth
 * - Custom: User-adjustable rate
 *
 * Respects privacy mode (shows indexed values when enabled).
 *
 * @returns {void}
 */
export function buildProjectionTable() {
    const employeeData = _getEmployeeData();
    if (!employeeData) return;

    const tbody = document.getElementById('projectionTableBody');
    if (!tbody) return;

    const currentSalaryRaw = _getCurrentSalary(employeeData);
    const startingSalary = _getStartingSalary(employeeData);

    // Convert to indexed values if privacy mode enabled (same as chart)
    const currentSalary = _state.showDollars
        ? currentSalaryRaw
        : (currentSalaryRaw / startingSalary) * 100;

    const cagr = _calculateCAGR(employeeData) / 100;
    const customRate = _state.customRate / 100;

    // Fixed intervals: 1-5 yearly, then 10, 15, 20
    const intervals = [1, 2, 3, 4, 5, 10, 15, 20];

    tbody.innerHTML = intervals.map(year => {
        const historicalValue = currentSalary * Math.pow(1 + cagr, year);
        const conservativeValue = currentSalary * Math.pow(1 + CONSTANTS.PROJECTION_RATE_CONSERVATIVE, year);
        const customValue = currentSalary * Math.pow(1 + customRate, year);

        return `
            <tr>
                <td>${year} year${year > 1 ? 's' : ''}</td>
                <td>${_state.showDollars ? _formatCurrency(historicalValue) : historicalValue.toFixed(0)}</td>
                <td>${_state.showDollars ? _formatCurrency(conservativeValue) : conservativeValue.toFixed(0)}</td>
                <td>${_state.showDollars ? _formatCurrency(customValue) : customValue.toFixed(0)}</td>
            </tr>
        `;
    }).join('');
}
