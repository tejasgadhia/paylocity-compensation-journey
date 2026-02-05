// ========================================
// FILE I/O MODULE
// ========================================

import { showUserMessage } from './notifications.js';
import { validateSalaryRange } from './parser.js';
import { encryptData, decryptData, isEncrypted, isCryptoSupported, CryptoError } from './crypto.js';

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
    if (!confirm('This file contains your compensation data. Only share with trusted people.')) {
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
// PASSWORD MODAL
// ========================================

/**
 * Shows the password modal and returns user input.
 * @param {'encrypt' | 'decrypt'} mode - Modal mode
 * @returns {Promise<string | null>} Password or null if cancelled/skipped
 */
function showPasswordModal(mode) {
    return new Promise((resolve) => {
        const modal = document.getElementById('passwordModal');
        const titleText = document.getElementById('passwordModalTitleText');
        const description = document.getElementById('passwordDescription');
        const passwordInput = document.getElementById('passwordInput');
        const confirmInput = document.getElementById('passwordConfirmInput');
        const confirmGroup = document.getElementById('passwordConfirmGroup');
        const errorEl = document.getElementById('passwordError');
        const skipBtn = document.getElementById('passwordSkipBtn');
        const submitBtn = document.getElementById('passwordSubmitBtn');
        const closeBtn = document.getElementById('closePasswordBtn');

        // Configure modal for mode
        if (mode === 'encrypt') {
            titleText.textContent = 'Encrypt Download';
            description.textContent = 'Protect your compensation data with a password. You\'ll need this password to open the file later.';
            confirmGroup.classList.remove('hidden');
            skipBtn.classList.remove('hidden');
            submitBtn.textContent = 'Encrypt & Download';
        } else {
            titleText.textContent = 'Unlock File';
            description.textContent = 'This file is encrypted. Enter your password to unlock it.';
            confirmGroup.classList.add('hidden');
            skipBtn.classList.add('hidden');
            submitBtn.textContent = 'Unlock';
        }

        // Reset state
        passwordInput.value = '';
        confirmInput.value = '';
        errorEl.textContent = '';
        errorEl.classList.add('hidden');

        // Show modal
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';
        passwordInput.focus();

        // Cleanup function
        function cleanup() {
            modal.classList.remove('visible');
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeydown);
            submitBtn.removeEventListener('click', handleSubmit);
            skipBtn.removeEventListener('click', handleSkip);
            closeBtn.removeEventListener('click', handleClose);
            modal.removeEventListener('click', handleBackdrop);
        }

        function showError(message) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        }

        function handleSubmit() {
            const password = passwordInput.value;

            // Validation
            if (password.length < 8) {
                showError('Password must be at least 8 characters');
                passwordInput.focus();
                return;
            }

            if (mode === 'encrypt') {
                const confirmPassword = confirmInput.value;
                if (password !== confirmPassword) {
                    showError('Passwords do not match');
                    confirmInput.focus();
                    return;
                }
            }

            cleanup();
            resolve(password);
        }

        function handleSkip() {
            cleanup();
            resolve(null);
        }

        function handleClose() {
            cleanup();
            resolve(null);
        }

        function handleBackdrop(e) {
            if (e.target === modal) {
                cleanup();
                resolve(null);
            }
        }

        function handleKeydown(e) {
            if (e.key === 'Escape') {
                cleanup();
                resolve(null);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            }
        }

        // Attach event listeners
        submitBtn.addEventListener('click', handleSubmit);
        skipBtn.addEventListener('click', handleSkip);
        closeBtn.addEventListener('click', handleClose);
        modal.addEventListener('click', handleBackdrop);
        document.addEventListener('keydown', handleKeydown);
    });
}

// ========================================
// JSON FILE IMPORT
// ========================================

/**
 * Handles JSON file import via file input.
 * Supports both encrypted (v2) and plaintext files.
 *
 * @param {Event} event - File input change event
 */
export async function loadJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            let parsed = JSON.parse(e.target.result);

            // Check if file is encrypted
            if (isEncrypted(parsed)) {
                // Request password for decryption
                const password = await showPasswordModal('decrypt');
                if (!password) {
                    // User cancelled
                    return;
                }

                try {
                    const decrypted = await decryptData(parsed, password);
                    parsed = JSON.parse(decrypted);
                } catch (err) {
                    if (err instanceof CryptoError) {
                        showUserMessage(err.message, 'error');
                    } else {
                        showUserMessage('Error decrypting file: ' + err.message, 'error');
                    }
                    return;
                }
            }

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
 * Optionally encrypts the file with a password.
 */
export async function downloadData() {
    const employeeData = _getEmployeeData();
    if (!employeeData) return;

    // Check if crypto is supported
    if (!isCryptoSupported()) {
        // Fall back to unencrypted download
        downloadPlaintext(employeeData, 'compensation-data.json');
        return;
    }

    // Show password modal
    const password = await showPasswordModal('encrypt');

    if (password) {
        // Encrypt and download
        try {
            const plaintext = JSON.stringify(employeeData, null, 2);
            const encrypted = await encryptData(plaintext, password);
            const dataStr = JSON.stringify(encrypted, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'compensation-data-encrypted.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showUserMessage('Encrypted file downloaded successfully', 'success');
        } catch (err) {
            showUserMessage('Encryption failed: ' + err.message, 'error');
        }
    } else {
        // User skipped encryption - download plaintext
        downloadPlaintext(employeeData, 'compensation-data.json');
    }
}

/**
 * Downloads employee data as unencrypted JSON.
 * @param {Object} data - Employee data to download
 * @param {string} filename - Download filename
 */
function downloadPlaintext(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
