// ========================================
// FILE I/O MODULE
// ========================================

import { showUserMessage } from './notifications.js';
import { validateSalaryRange } from './parser.js';

// ========================================
// CONSTANTS
// ========================================

/**
 * Valid change reasons for compensation records.
 * Must match parser.js extractReason() whitelist.
 */
export const VALID_REASONS = ['Merit Increase', 'Promotion', 'Market Adjustment', 'Equity', 'New Hire'];

// ========================================
// MODULE STATE (injected via initIO)
// ========================================

let _getEmployeeData;
let _setEmployeeData;
let _showDashboard;
let _updateUrlParams;
let _saveBackup;

/**
 * Initializes the I/O module with required dependencies.
 * Must be called once before using any I/O functions.
 *
 * @param {Object} deps - Dependencies to inject
 * @param {Function} deps.getEmployeeData - Function that returns employee data
 * @param {Function} deps.setEmployeeData - Function to set employee data
 * @param {Function} deps.showDashboard - Function to show the dashboard view
 * @param {Function} deps.updateUrlParams - Function to update URL parameters
 * @param {Function} deps.saveBackup - Function to save backup to localStorage
 */
export function initIO({ getEmployeeData, setEmployeeData, showDashboard, updateUrlParams, saveBackup }) {
    _getEmployeeData = getEmployeeData;
    _setEmployeeData = setEmployeeData;
    _showDashboard = showDashboard;
    _updateUrlParams = updateUrlParams;
    _saveBackup = saveBackup;
}

// ========================================
// HTML DOWNLOAD
// ========================================

/**
 * Downloads the current page as an HTML file.
 * Includes privacy warning before download.
 */
export function downloadHtmlFile() {
    // Privacy warning - user should understand they're downloading sensitive data
    if (!confirm('⚠️ This file contains your compensation data. Only share with trusted people.')) {
        return;
    }

    const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compensation-journey.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ========================================
// JSON IMPORT VALIDATION
// ========================================

/**
 * Validates imported JSON data structure and values (#176).
 *
 * Performs schema validation to prevent:
 * - Malformed data crashing the app
 * - Invalid field types causing calculation errors
 * - Unrealistic salary values from corrupted data
 *
 * @param {Object} data - Parsed JSON data to validate
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 *
 * @example
 * const result = validateImportedData({ records: [...], hireDate: '2020-01-15' });
 * if (!result.valid) console.error(result.errors.join(', '));
 */
export function validateImportedData(data) {
    const errors = [];

    // Top-level structure validation
    if (!data || typeof data !== 'object') {
        errors.push('Invalid data format: expected object');
        return { valid: false, errors };
    }

    if (!Array.isArray(data.records)) {
        errors.push('Missing or invalid "records" array');
    } else if (data.records.length < 2) {
        errors.push('Need at least 2 records for analysis');
    }

    if (!data.hireDate || typeof data.hireDate !== 'string') {
        errors.push('Missing or invalid "hireDate" field');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.hireDate)) {
        errors.push('hireDate must be in YYYY-MM-DD format');
    }

    // Stop early if top-level invalid (can't validate records)
    if (errors.length > 0) {
        return { valid: false, errors };
    }

    // Per-record validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    data.records.forEach((record, index) => {
        const prefix = `Record ${index + 1}`;

        // Required fields check
        if (!record.date) {
            errors.push(`${prefix}: missing "date"`);
        } else if (!dateRegex.test(record.date)) {
            errors.push(`${prefix}: date "${record.date}" must be YYYY-MM-DD`);
        }

        if (!record.reason) {
            errors.push(`${prefix}: missing "reason"`);
        } else if (!VALID_REASONS.includes(record.reason)) {
            errors.push(`${prefix}: invalid reason "${record.reason}". Valid: ${VALID_REASONS.join(', ')}`);
        }

        if (record.annual === undefined || record.annual === null) {
            errors.push(`${prefix}: missing "annual" salary`);
        } else if (typeof record.annual !== 'number') {
            errors.push(`${prefix}: annual must be a number`);
        } else {
            // Reuse existing salary range validation
            try {
                validateSalaryRange(record.annual, 'annual');
            } catch (e) {
                errors.push(`${prefix}: ${e.message}`);
            }
        }

        if (record.perCheck === undefined || record.perCheck === null) {
            errors.push(`${prefix}: missing "perCheck" amount`);
        } else if (typeof record.perCheck !== 'number') {
            errors.push(`${prefix}: perCheck must be a number`);
        } else if (record.perCheck > 0) {
            // Only validate if positive (some records may have 0)
            try {
                validateSalaryRange(record.perCheck, 'perCheck');
            } catch (e) {
                errors.push(`${prefix}: ${e.message}`);
            }
        }
    });

    return { valid: errors.length === 0, errors };
}

// ========================================
// JSON FILE IMPORT
// ========================================

/**
 * Handles JSON file import via file input.
 * Validates the data structure before loading.
 *
 * @param {Event} event - File input change event
 */
export function loadJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);

            // Schema validation (#176)
            const validation = validateImportedData(parsed);
            if (!validation.valid) {
                throw new Error(validation.errors.join('; '));
            }

            _setEmployeeData(parsed);
            parsed.isDemo = false;
            _showDashboard();
            // Hide demo banner for loaded data
            document.getElementById('demoBanner').classList.add('hidden');
            // Update URL (removes demo flag)
            _updateUrlParams();
            // Save backup to localStorage
            _saveBackup();
            // Auto-close import modal after successful load (#66)
            const modal = document.getElementById('importModal');
            if (modal) {
                modal.classList.remove('visible');
                document.body.style.overflow = '';
            }
        } catch (err) {
            showUserMessage('Error loading file: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

// ========================================
// JSON FILE EXPORT
// ========================================

/**
 * Exports employee data as a JSON file download.
 */
export function downloadData() {
    const employeeData = _getEmployeeData();
    if (!employeeData) return;

    const dataStr = JSON.stringify(employeeData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'compensation-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
