/**
 * Input Validation Module
 *
 * Handles Paylocity data validation and parsing pipeline.
 * Uses dependency injection for testability.
 */

import { parsePaylocityData } from './parser.js';

// ========================================
// MODULE STATE (injected via init)
// ========================================

let _setEmployeeData;
let _getDomCache;
let _showDashboard;
let _updateUrlParams;
let _saveBackup;
let _loadChartJS;
let _showUserMessage;

/**
 * Initialize the validation module with dependencies.
 *
 * @param {Object} deps - Dependencies
 * @param {Function} deps.setEmployeeData - Function to set employee data
 * @param {Function} deps.getDomCache - Function to get DOM cache
 * @param {Function} deps.showDashboard - Function to show dashboard
 * @param {Function} deps.updateUrlParams - Function to update URL params
 * @param {Function} deps.saveBackup - Function to save backup
 * @param {Function} deps.loadChartJS - Function to lazy-load Chart.js
 * @param {Function} deps.showUserMessage - Function to show user messages
 */
export function initValidation({
    setEmployeeData,
    getDomCache,
    showDashboard,
    updateUrlParams,
    saveBackup,
    loadChartJS,
    showUserMessage
}) {
    _setEmployeeData = setEmployeeData;
    _getDomCache = getDomCache;
    _showDashboard = showDashboard;
    _updateUrlParams = updateUrlParams;
    _saveBackup = saveBackup;
    _loadChartJS = loadChartJS;
    _showUserMessage = showUserMessage;
}

// ========================================
// MAIN PARSE PIPELINE
// ========================================

/**
 * Main data pipeline: parses Paylocity input and initializes the dashboard.
 *
 * Validates input, parses compensation records, updates URL with encoded data,
 * hides the landing page, and initializes all dashboard components.
 * Shows user-friendly error messages for invalid or incomplete data.
 *
 * @async
 * @returns {Promise<void>}
 *
 * @example
 * // Triggered by "Generate" button click
 * document.getElementById('generateBtn').addEventListener('click', parseAndGenerate);
 */
export async function parseAndGenerate() {
    const input = document.getElementById('pasteInput').value.trim();
    const messageDiv = document.getElementById('validationMessage');

    if (!input) {
        messageDiv.className = 'validation-message error visible';
        messageDiv.textContent = '✗ Please paste your Paylocity data first.';
        return;
    }

    try {
        const employeeData = parsePaylocityData(input);

        if (employeeData.records.length < 2) {
            throw new Error('Need at least 2 records to generate insights');
        }

        // Check if there are any actual adjustments (not just New Hire)
        const adjustments = employeeData.records.filter(r => r.reason !== 'New Hire');
        if (adjustments.length === 0) {
            throw new Error('No salary adjustments found. You may be too new to have raise history yet');
        }

        employeeData.isDemo = false;
        _setEmployeeData(employeeData);
        messageDiv.className = 'validation-message';

        // Close import modal if open
        const domCache = _getDomCache();
        if (domCache.importModal) {
            domCache.importModal.classList.remove('visible');
            document.body.style.overflow = '';
        }

        // Lazy-load Chart.js before showing dashboard (performance optimization)
        await _loadChartJS();

        _showDashboard();
        // Hide demo banner for real data
        document.getElementById('demoBanner').classList.add('hidden');
        // Update URL (removes demo flag)
        _updateUrlParams();
        // Save backup to localStorage
        _saveBackup();
    } catch (e) {
        console.error('Parse error:', e);
        messageDiv.className = 'validation-message error visible';
        messageDiv.textContent = `✗ ${e.message}. Please make sure you copied from "Rates" down to "items".`;
    }
}

// ========================================
// REAL-TIME VALIDATION
// ========================================

/**
 * Validates paste input in real-time as user types.
 *
 * Provides progressive feedback:
 * - Error: No dates or dollars found
 * - Warning: Incomplete data or missing sections
 * - Success: Valid data ready to generate
 *
 * Enables/disables generate button based on validation state.
 */
export function validatePasteInput() {
    const input = document.getElementById('pasteInput').value.trim();
    const messageDiv = document.getElementById('validationMessage');
    const generateBtn = document.getElementById('generateBtn');
    // Checkbox was removed in 5d189c9 but JS still expected it - default to true if missing
    const legalConsentCheckbox = document.getElementById('legalConsentCheckbox');
    const legalConsent = legalConsentCheckbox ? legalConsentCheckbox.checked : true;

    if (!input) {
        messageDiv.className = 'validation-message';
        messageDiv.textContent = '';
        generateBtn.disabled = true;
        return;
    }

    // Check for date patterns (MM/DD/YYYY)
    const datePattern = /\d{2}\/\d{2}\/\d{4}/g;
    const dates = input.match(datePattern) || [];

    // Check for dollar amounts with exactly 2 decimal places (standard currency)
    const dollarPattern = /\$[0-9,]+\.\d{2}/g;
    const dollars = input.match(dollarPattern) || [];

    // Check for key structural indicators
    const hasSalary = /salary/i.test(input);
    const hasHistory = /history/i.test(input);

    // Validation checks
    if (dates.length === 0) {
        messageDiv.className = 'validation-message error visible';
        messageDiv.textContent = '✗ No dates found. Make sure you copied the table data including dates (MM/DD/YYYY format).';
        generateBtn.disabled = true;
        return;
    }

    if (dollars.length === 0) {
        messageDiv.className = 'validation-message error visible';
        messageDiv.textContent = '✗ No salary amounts found. Make sure "Show Private Data" is enabled in Paylocity.';
        generateBtn.disabled = true;
        return;
    }

    if (!hasSalary) {
        messageDiv.className = 'validation-message warning visible';
        messageDiv.textContent = '⚠ Data looks incomplete. Make sure you copied from the Rates tab.';
        generateBtn.disabled = !legalConsent;
        return;
    }

    if (!hasHistory && dates.length < 3) {
        messageDiv.className = 'validation-message warning visible';
        messageDiv.textContent = '⚠ Only ' + dates.length + ' record(s) found. Did you include the History table?';
        generateBtn.disabled = !legalConsent;
        return;
    }

    if (dollars.length < dates.length) {
        messageDiv.className = 'validation-message warning visible';
        messageDiv.textContent = '⚠ Found ' + dates.length + ' dates but only ' + dollars.length + ' salary values. Some data may be missing.';
        generateBtn.disabled = !legalConsent;
        return;
    }

    // Check legal consent before enabling button
    if (!legalConsent) {
        messageDiv.className = 'validation-message warning visible';
        messageDiv.textContent = '✓ Found ' + dates.length + ' compensation records. Please accept the legal notice to continue.';
        generateBtn.disabled = true;
        return;
    }

    // Success
    messageDiv.className = 'validation-message success visible';
    messageDiv.textContent = '✓ Found ' + dates.length + ' compensation records. Ready to generate!';
    generateBtn.disabled = false;
}
