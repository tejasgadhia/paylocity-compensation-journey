/**
 * Global type declarations for external libraries
 * Chart.js is loaded globally via script tag in index.html
 * @global
 */
/* global Chart */

// ========================================
// IMPORTS
// ========================================

import { CONSTANTS, benchmarks, benchmarkMetadata } from './js/constants.js';
import {
    calculateInflationOverPeriod,
    calculateRealGrowth,
    calculateInflationAdjustedSalary,
    getStartingSalary,
    getCurrentSalary,
    calculateYearsOfService,
    calculateCAGR,
    getBenchmarkComparisons,
    calculateAverageMonthsBetweenDates,
    formatDateSummary,
    formatDateDetail
} from './js/calculations.js';
import {
    validateSalaryRange,
    parseRecord,
    parsePaylocityData
} from './js/parser.js';
import { validateTemplateData } from './js/security.js';
import {
    initCharts,
    updateChartTheme,
    updateMainChartType,
    updateYoyChartType,
    updateMainChartData,
    updateYoyChartData,
    buildMainChart,
    buildYoyChart,
    buildProjectionChart,
    updateProjectionChartData
} from './js/charts.js';

// ========================================
// MOBILE/TABLET DETECTION
// ========================================

// Only run mobile detection in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    (function() {
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent);
        const isSmallScreen = window.innerWidth < CONSTANTS.MOBILE_BREAKPOINT;

        if (isMobileUA || isSmallScreen) {
            document.getElementById('mobileSplash').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Also check on resize
        window.addEventListener('resize', function() {
            if (window.innerWidth < CONSTANTS.MOBILE_BREAKPOINT) {
                document.getElementById('mobileSplash').classList.add('active');
                document.body.style.overflow = 'hidden';
            } else if (!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent))) {
                document.getElementById('mobileSplash').classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    })();
}

// ========================================
// DOWNLOAD FUNCTION
// ========================================

function downloadHtmlFile() {
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
// STATE MANAGEMENT
// ========================================

/**
 * Application state - simple globals appropriate for this app's complexity.
 * Chart functions are in js/charts.js and receive these via initCharts().
 */
let employeeData = null;

let state = {
    theme: 'artistic',
    showDollars: true,
    currentTab: 'home',
    mainChartType: 'line',
    yoyChartType: 'bar',
    projectionYears: 5,
    customRate: 8,
    currentScenarioIndex: 2  // Default to Scenario 3 (Established, 8 years) for richer demo
};

let charts = {
    main: null,
    yoy: null,
    projection: null
};

/**
 * #149: DOM element cache to eliminate redundant getElementById calls.
 * Populated once in initEventListeners(), reused throughout app lifecycle.
 * Reduces ~90 querySelector operations during typical usage to ~20 cached lookups.
 */
let domCache = {};

// Expose for E2E tests (allows Playwright to access state/charts/data)
if (typeof window !== 'undefined') {
    window.state = state;
    window.charts = charts;
    window.employeeData = () => employeeData; // Function to get current value
}

// Initialize charts module with dependencies
initCharts({
    state,
    charts,
    getEmployeeData: () => employeeData,
    showUserMessage
});

// ========================================
// BENCHMARK CALCULATION FUNCTIONS
// ========================================
// All calculation functions moved to js/calculations.js for better modularity and testability

// ========================================
// SECURITY HELPERS
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
function escapeHTML(str) {
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
 * Validates that dynamic data used in HTML templates contains only safe types.
 *
 * Defense-in-depth security check: Ensures template interpolations receive only
 * safe values (numbers, dates, formatted strings) and not malicious payloads.
 *
 * @param {Object} data - Data object to validate
 * @throws {Error} If data contains unsafe types or suspicious patterns
 */
// validateTemplateData moved to js/security.js

// ========================================
// PARSER
// ========================================
// (Moved to js/parser.js - imported above)

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Creates a debounced version of a function that delays execution
 * until after a specified wait time has elapsed since the last call.
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait before executing
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), wait);
    };
}

// ========================================
// CHART.JS LAZY LOADING
// ========================================

async function loadChartJS() {
    // If Chart.js already loaded, return immediately
    if (window.Chart) return;

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'assets/js/chart.umd.min.js'; // Self-hosted for privacy & offline capability
        script.onload = () => {
            console.info('Chart.js loaded successfully');
            resolve();
        };
        script.onerror = () => {
            const error = 'Failed to load Chart.js library';
            console.error(error);
            showUserMessage('Failed to load charting library. Please refresh and try again.', 'error');
            reject(new Error(error));
        };
        document.head.appendChild(script);
    });
}

// ========================================
// PARSE AND GENERATE
// ========================================

/**
 * Main data pipeline: parses Paylocity input and initializes the dashboard.
 *
 * Validates input, parses compensation records, updates URL with encoded data,
 * hides the landing page, and initializes all dashboard components.
 * Shows user-friendly error messages for invalid or incomplete data.
 *
 * @async
 * @global {Object} employeeData - Sets parsed compensation data
 * @returns {Promise<void>}
 *
 * @example
 * // Triggered by "Generate" button click
 * document.getElementById('generateBtn').addEventListener('click', parseAndGenerate);
 */
async function parseAndGenerate() {
    const input = document.getElementById('pasteInput').value.trim();
    const messageDiv = document.getElementById('validationMessage');
    
    if (!input) {
        messageDiv.className = 'validation-message error visible';
        messageDiv.textContent = '✗ Please paste your Paylocity data first.';
        return;
    }
    
    try {
        employeeData = parsePaylocityData(input);

        if (employeeData.records.length < 2) {
            throw new Error('Need at least 2 records to generate insights');
        }
        
        // Check if there are any actual adjustments (not just New Hire)
        const adjustments = employeeData.records.filter(r => r.reason !== 'New Hire');
        if (adjustments.length === 0) {
            throw new Error('No salary adjustments found. You may be too new to have raise history yet');
        }
        
        employeeData.isDemo = false;
        messageDiv.className = 'validation-message';

        // Close import modal if open (#149: Use cached element)
        if (domCache.importModal) {
            domCache.importModal.classList.remove('visible');
            document.body.style.overflow = '';
        }

        // Lazy-load Chart.js before showing dashboard (performance optimization)
        await loadChartJS();

        showDashboard();
        // Hide demo banner for real data
        document.getElementById('demoBanner').classList.add('hidden');
        // Update URL (removes demo flag)
        updateUrlParams();
        // Save backup to localStorage
        saveBackup();
    } catch (e) {
        console.error('Parse error:', e);
        messageDiv.className = 'validation-message error visible';
        messageDiv.textContent = `✗ ${e.message}. Please make sure you copied from "Rates" down to "items".`;
    }
}

// ========================================
// REAL-TIME VALIDATION
// ========================================

function validatePasteInput() {
    const input = document.getElementById('pasteInput').value.trim();
    const messageDiv = document.getElementById('validationMessage');
    const generateBtn = document.getElementById('generateBtn');
    const legalConsent = document.getElementById('legalConsentCheckbox').checked;

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

// ========================================
// DEMO DATA - Multiple Scenarios
// ========================================

const DEMO_SCENARIOS = [
    {
        id: 1,
        name: "Early Career",
        description: "2 years tenure",
        hireDate: "2023-03-15",
        currentDate: "2025-01-15",
        records: [
            { date: "2025-01-15", reason: "Merit Increase", perCheck: 3125.00, annual: 75000.00, hourlyRate: 36.06, change: 208.33, changePercent: 7.14 },
            { date: "2024-03-01", reason: "Merit Increase", perCheck: 2916.67, annual: 70000.00, hourlyRate: 33.65, change: 208.33, changePercent: 7.69 },
            { date: "2023-09-01", reason: "Equity", perCheck: 2708.33, annual: 65000.00, hourlyRate: 31.25, change: 208.33, changePercent: 8.33 },
            { date: "2023-03-15", reason: "New Hire", perCheck: 2500.00, annual: 60000.00, hourlyRate: 28.85, change: 0, changePercent: 0 }
        ]
    },
    {
        id: 2,
        name: "Growth Phase",
        description: "5 years tenure",
        hireDate: "2020-02-01",
        currentDate: "2025-01-15",
        records: [
            { date: "2025-01-15", reason: "Merit Increase", perCheck: 4166.67, annual: 100000.00, hourlyRate: 48.08, change: 375.00, changePercent: 9.89 },
            { date: "2024-02-15", reason: "Promotion", perCheck: 3791.67, annual: 91000.00, hourlyRate: 43.75, change: 458.33, changePercent: 13.75 },
            { date: "2023-02-01", reason: "Merit Increase", perCheck: 3333.33, annual: 80000.00, hourlyRate: 38.46, change: 208.33, changePercent: 6.67 },
            { date: "2022-03-01", reason: "Market Adjustment", perCheck: 3125.00, annual: 75000.00, hourlyRate: 36.06, change: 291.67, changePercent: 10.34 },
            { date: "2021-02-15", reason: "Merit Increase", perCheck: 2833.33, annual: 68000.00, hourlyRate: 32.69, change: 166.67, changePercent: 5.43 },
            { date: "2020-08-01", reason: "Equity", perCheck: 2666.67, annual: 64000.00, hourlyRate: 30.77, change: 166.67, changePercent: 6.67 },
            { date: "2020-02-01", reason: "New Hire", perCheck: 2500.00, annual: 60000.00, hourlyRate: 28.85, change: 0, changePercent: 0 }
        ]
    },
    {
        id: 3,
        name: "Established",
        description: "8 years tenure",
        hireDate: "2017-06-15",
        currentDate: "2025-01-15",
        records: [
            { date: "2025-01-15", reason: "Merit Increase", perCheck: 5416.67, annual: 130000.00, hourlyRate: 62.50, change: 416.67, changePercent: 8.33 },
            { date: "2024-01-15", reason: "Merit Increase", perCheck: 5000.00, annual: 120000.00, hourlyRate: 57.69, change: 416.67, changePercent: 9.09 },
            { date: "2023-02-01", reason: "Promotion", perCheck: 4583.33, annual: 110000.00, hourlyRate: 52.88, change: 625.00, changePercent: 15.38 },
            { date: "2022-02-15", reason: "Merit Increase", perCheck: 3958.33, annual: 95000.00, hourlyRate: 45.67, change: 291.67, changePercent: 8.11 },
            { date: "2021-03-01", reason: "Merit Increase", perCheck: 3666.67, annual: 88000.00, hourlyRate: 42.31, change: 250.00, changePercent: 7.32 },
            { date: "2020-02-15", reason: "Market Adjustment", perCheck: 3416.67, annual: 82000.00, hourlyRate: 39.42, change: 333.33, changePercent: 10.81 },
            { date: "2019-02-01", reason: "Merit Increase", perCheck: 3083.33, annual: 74000.00, hourlyRate: 35.58, change: 208.33, changePercent: 7.25 },
            { date: "2018-06-15", reason: "Merit Increase", perCheck: 2875.00, annual: 69000.00, hourlyRate: 33.17, change: 208.33, changePercent: 7.69 },
            { date: "2017-12-01", reason: "Equity", perCheck: 2666.67, annual: 64000.00, hourlyRate: 30.77, change: 166.67, changePercent: 6.67 },
            { date: "2017-06-15", reason: "New Hire", perCheck: 2500.00, annual: 60000.00, hourlyRate: 28.85, change: 0, changePercent: 0 }
        ]
    },
    {
        id: 4,
        name: "Senior Tenure",
        description: "12 years tenure",
        hireDate: "2013-01-15",
        currentDate: "2025-01-15",
        records: [
            { date: "2025-01-15", reason: "Merit Increase", perCheck: 7916.67, annual: 190000.00, hourlyRate: 91.35, change: 416.67, changePercent: 5.56 },
            { date: "2024-02-01", reason: "Merit Increase", perCheck: 7500.00, annual: 180000.00, hourlyRate: 86.54, change: 416.67, changePercent: 5.88 },
            { date: "2023-01-15", reason: "Merit Increase", perCheck: 7083.33, annual: 170000.00, hourlyRate: 81.73, change: 416.67, changePercent: 6.25 },
            { date: "2022-02-15", reason: "Promotion", perCheck: 6666.67, annual: 160000.00, hourlyRate: 76.92, change: 833.33, changePercent: 14.29 },
            { date: "2021-02-01", reason: "Merit Increase", perCheck: 5833.33, annual: 140000.00, hourlyRate: 67.31, change: 416.67, changePercent: 7.69 },
            { date: "2020-03-01", reason: "Market Adjustment", perCheck: 5416.67, annual: 130000.00, hourlyRate: 62.50, change: 625.00, changePercent: 12.50 },
            { date: "2019-02-15", reason: "Merit Increase", perCheck: 4791.67, annual: 115000.00, hourlyRate: 55.29, change: 416.67, changePercent: 9.52 },
            { date: "2018-02-01", reason: "Promotion", perCheck: 4375.00, annual: 105000.00, hourlyRate: 50.48, change: 625.00, changePercent: 16.22 },
            { date: "2017-03-01", reason: "Merit Increase", perCheck: 3750.00, annual: 90000.00, hourlyRate: 43.27, change: 291.67, changePercent: 8.43 },
            { date: "2016-02-15", reason: "Merit Increase", perCheck: 3458.33, annual: 83000.00, hourlyRate: 39.90, change: 208.33, changePercent: 6.49 },
            { date: "2015-03-01", reason: "Market Adjustment", perCheck: 3250.00, annual: 78000.00, hourlyRate: 37.50, change: 333.33, changePercent: 11.43 },
            { date: "2014-02-15", reason: "Merit Increase", perCheck: 2916.67, annual: 70000.00, hourlyRate: 33.65, change: 208.33, changePercent: 7.69 },
            { date: "2013-08-01", reason: "Equity", perCheck: 2708.33, annual: 65000.00, hourlyRate: 31.25, change: 208.33, changePercent: 8.33 },
            { date: "2013-01-15", reason: "New Hire", perCheck: 2500.00, annual: 60000.00, hourlyRate: 28.85, change: 0, changePercent: 0 }
        ]
    }
];

async function loadDemoData(scenarioIndex = null) {
    // If no valid index provided, use current state index
    // Note: When used as event handler, scenarioIndex receives Event object
    if (typeof scenarioIndex !== 'number') {
        scenarioIndex = state.currentScenarioIndex;
    } else {
        state.currentScenarioIndex = scenarioIndex;
    }

    // #79 fix: Preserve tab from URL before it gets overwritten
    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get('tab');
    const validTabs = ['home', 'story', 'market', 'history', 'analytics', 'projections', 'help'];
    if (initialTab && validTabs.includes(initialTab)) {
        state.currentTab = initialTab;
    }

    const scenario = DEMO_SCENARIOS[scenarioIndex];

    employeeData = {
        hireDate: scenario.hireDate,
        currentDate: scenario.currentDate,
        records: [...scenario.records], // Clone to prevent mutation
        isDemo: true,
        scenarioId: scenario.id
    };

    // Lazy-load Chart.js before showing dashboard (performance optimization)
    await loadChartJS();

    showDashboard();

    // Update demo banner
    document.getElementById('demoBanner').classList.remove('hidden');
    updateScenarioLabel();

    // Update URL (now preserves the tab since state.currentTab was set above)
    updateUrlParams();
}

async function cycleNextScenario() {
    // Move to next scenario (wrap around)
    state.currentScenarioIndex = (state.currentScenarioIndex + 1) % DEMO_SCENARIOS.length;

    // Destroy existing charts before regenerating
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    charts = { main: null, yoy: null, projection: null };

    // Load the new scenario
    await loadDemoData(state.currentScenarioIndex);
}

function updateScenarioLabel() {
    const scenario = DEMO_SCENARIOS[state.currentScenarioIndex];
    const label = document.getElementById('scenarioLabel');
    if (label) {
        label.textContent = `Scenario ${scenario.id}: ${scenario.name} (${scenario.description})`;
    }
}

// ========================================
// DATA BACKUP & RECOVERY
// ========================================

/**
 * Save employeeData to localStorage as backup
 * Called after successful parse or data load
 */
function saveBackup() {
    if (!employeeData) return;

    try {
        const backup = {
            data: employeeData,
            timestamp: Date.now(),
            version: 1
        };
        localStorage.setItem('cj-backup', JSON.stringify(backup));
        console.log('Data backup saved to localStorage');
    } catch (err) {
        // Quota exceeded or localStorage disabled - fail gracefully
        console.warn('Failed to save backup to localStorage:', err.message);
    }
}

/**
 * Load employeeData from localStorage backup
 * Returns null if no backup exists or backup is invalid
 */
function loadBackup() {
    try {
        const backupStr = localStorage.getItem('cj-backup');
        if (!backupStr) return null;

        const backup = JSON.parse(backupStr);
        if (!backup.data || !backup.data.records || !backup.data.hireDate) {
            throw new Error('Invalid backup format');
        }

        return backup;
    } catch (err) {
        console.warn('Failed to load backup from localStorage:', err.message);
        return null;
    }
}

/**
 * Clear localStorage backup
 * Called after successful restore or when user clicks "Start Over"
 */
function clearBackup() {
    try {
        localStorage.removeItem('cj-backup');
        console.log('Backup cleared from localStorage');
    } catch (err) {
        console.warn('Failed to clear backup:', err.message);
    }
}

/**
 * Check if backup exists and update UI
 * Called on page load and when import modal opens
 */
function updateBackupUI() {
    const backup = loadBackup();
    const restoreBtn = document.getElementById('restoreBackupBtn');

    if (restoreBtn) {
        if (backup) {
            const date = new Date(backup.timestamp);
            const dateStr = date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
            restoreBtn.textContent = `Restore Last Session (from ${dateStr})`;
            restoreBtn.classList.remove('hidden');
        } else {
            restoreBtn.classList.add('hidden');
        }
    }
}

/**
 * Restore data from localStorage backup
 * Called when user clicks "Restore Last Session" button
 */
function restoreFromBackup() {
    const backup = loadBackup();
    if (!backup) {
        showUserMessage('No backup found', 'error');
        return;
    }

    try {
        employeeData = backup.data;
        employeeData.isDemo = false;
        showDashboard();

        // Hide demo banner
        document.getElementById('demoBanner').classList.add('hidden');

        // Update URL (removes demo flag)
        updateUrlParams();

        // Close import modal (#149: Use cached element)
        if (domCache.importModal) {
            domCache.importModal.classList.remove('visible');
            document.body.style.overflow = '';
        }

        // Clear backup after successful restore
        clearBackup();
        updateBackupUI();

        showUserMessage('Session restored successfully', 'success');
    } catch (err) {
        showUserMessage('Error restoring session: ' + err.message, 'error');
    }
}

// ========================================
// FILE HANDLING
// ========================================

function loadJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            employeeData = JSON.parse(e.target.result);
            if (!employeeData.records || !employeeData.hireDate) {
                throw new Error('Invalid data format');
            }
            employeeData.isDemo = false;
            showDashboard();
            // Hide demo banner for loaded data
            document.getElementById('demoBanner').classList.add('hidden');
            // Update URL (removes demo flag)
            updateUrlParams();
            // Save backup to localStorage
            saveBackup();
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

function downloadData() {
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

// ========================================
// VIEW SWITCHING
// ========================================

function showDashboard() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    window.scrollTo(0, 0);
    initDashboard();

    // If a non-home tab was specified (e.g., from URL), switch to it immediately
    if (state.currentTab && state.currentTab !== 'home') {
        setTab(state.currentTab, false);
    }

    // Focus management for accessibility - move focus to dashboard heading
    setTimeout(() => {
        const heading = document.querySelector('.logo-text h1');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus();
        }
    }, 100);
}

function resetDashboard() {
    // Destroy all charts
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    charts = { main: null, yoy: null, projection: null };

    // Reset state
    state.currentTab = 'home';
    employeeData = null;
    
    // Update URL - keep theme, remove demo
    const params = new URLSearchParams();
    params.set('theme', state.theme);
    history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    
    // Show landing page
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('landingPage').classList.remove('hidden');

    // Close import modal if open
    const importModal = document.getElementById('importModal');
    if (importModal) {
        importModal.classList.remove('visible');
        document.body.style.overflow = '';
    }

    // Clear paste area and validation
    document.getElementById('pasteInput').value = '';
    document.getElementById('validationMessage').className = 'validation-message';
    document.getElementById('generateBtn').disabled = true;

    // Reset legal consent checkbox
    const legalConsentCheckbox = document.getElementById('legalConsentCheckbox');
    if (legalConsentCheckbox) {
        legalConsentCheckbox.checked = false;
    }
}

// ========================================
// STORY CONTENT
// ========================================

const storyContent = {
    tactical: {
        title: "Mission Debrief: Compensation Trajectory",
        subtitle: "Classification: Personnel Valuation Report",
        getText: (data) => `
            <p><span class="story-highlight">MISSION START:</span> Specialist deployed on <span class="story-stat">${escapeHTML(data.hireDateFormatted)}</span> with initial resource allocation of <span class="story-stat">${escapeHTML(data.startSalary)}</span>. Operational status: New Hire. Initial positioning established within standard parameters for role classification.</p>
            
            <p><span class="story-highlight">OPERATIONAL SUMMARY:</span> Over <span class="story-stat">${data.years} years</span> of continuous deployment, the specialist has demonstrated consistent value appreciation. Total resource adjustments: <span class="story-stat">${data.totalAdjustments} modifications</span>. Current valuation stands at <span class="story-stat">${data.currentSalary}</span>, representing a <span class="story-stat">${data.growth}%</span> increase from baseline. Adjustment frequency exceeds standard annual review cycles, indicating active performance recognition protocols.</p>
            
            <p><span class="story-highlight">PERFORMANCE METRICS:</span> Compound Annual Growth Rate (CAGR) calculated at <span class="story-stat">${data.cagr}%</span>. Average interval between resource reallocations: <span class="story-stat">${data.avgInterval} months</span>. Primary adjustment category: Merit-based (${data.meritPercent}% of all modifications). Remaining adjustments attributed to promotions, market corrections, and role transitions. Cumulative inflation during deployment period: <span class="story-stat">${data.cumulativeInflation}%</span>. Inflation-adjusted growth rate: <span class="story-stat">${data.realGrowth}%</span>, confirming real value appreciation beyond cost-of-living factors.</p>
            
            <p><span class="story-highlight">NOTABLE OPERATIONS:</span> Largest single-event appreciation occurred <span class="story-stat">${data.largestRaiseDate}</span> with a <span class="story-stat">${data.largestRaise}%</span> value increase.${data.sixFigureDate ? ` Six-figure threshold breached <span class="story-stat">${data.sixFigureDate}</span>, achieved within <span class="story-stat">${data.yearsToSixFigures}</span> of initial deployment.` : ''} Compensation trajectory has maintained positive momentum across all recorded intervals.</p>
            
            <p><span class="story-highlight">STATUS:</span> Specialist remains in active deployment. Current trajectory sustainable pending continued performance alignment. See <a href="#market" onclick="setTab('market'); return false;" class="tab-link">Market</a> tab for industry benchmarks and inflation-adjusted analysis.</p>
            
            <div class="story-insight">
                <span class="story-insight-label">Advisory Note</span>
                Compensation metrics represent one vector in a multi-dimensional assessment matrix. Operational impact, skill acquisition, and mission value are tracked through separate channels. This system monitors resource allocation only; comprehensive specialist evaluation requires additional data streams not captured in this report.
            </div>
        `
    },
    artistic: {
        title: "Compensation Summary",
        getSubtitle: (data) => data.dateRange,
        getText: (data) => `
            <p>You started at <span class="story-stat">${data.startSalary}</span> on <span class="story-stat">${data.hireDateFormatted}</span>. Your current annual salary is <span class="story-stat">${data.currentSalary}</span>—an increase of <span class="story-stat">${data.dollarIncrease}</span> from your starting point.</p>
            
            <p>Over <span class="story-stat">${data.years} years</span>, your compensation has increased <span class="story-stat">${data.growth}%</span> through <span class="story-stat">${data.totalAdjustments} adjustments</span>. That works out to a compound annual growth rate (CAGR) of <span class="story-stat">${data.cagr}%</span>, with adjustments occurring roughly every <span class="story-stat">${data.avgInterval} months</span> on average—more frequently than the typical annual review cycle.</p>
            
            <p><span class="story-stat">${data.meritPercent}%</span> of your adjustments were merit-based, with the remainder coming from promotions, market adjustments, or role changes. Your largest single increase was <span class="story-stat">${data.largestRaise}%</span> in <span class="story-stat">${data.largestRaiseDate}</span>.${data.sixFigureDate ? ` You crossed the six-figure threshold in <span class="story-stat">${data.sixFigureDate}</span>, about <span class="story-stat">${data.yearsToSixFigures}</span> into your tenure.` : ''}</p>
            
            <p>Accounting for <span class="story-stat">${data.cumulativeInflation}%</span> cumulative inflation over this period, your real purchasing power has grown by approximately <span class="story-stat">${data.realGrowth}%</span>. In other words, your raises have ${parseFloat(data.realGrowth) > 0 ? 'outpaced' : 'not kept pace with'} the cost of living.</p>
            
            <p>For context on how these numbers compare to industry standards, see the <a href="#market" onclick="setTab('market'); return false;" class="tab-link">Market</a> tab. The <a href="#analytics" onclick="setTab('analytics'); return false;" class="tab-link">Analytics</a> tab provides additional breakdowns of your raise history and patterns over time.</p>
            
            <div class="story-insight">
                <span class="story-insight-label">Note</span>
                This summary tracks compensation only. Career growth encompasses many things—skills developed, problems solved, teams built, impact made—that aren't captured in salary data alone. The numbers here tell one part of the story.
            </div>
        `
    }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Displays a user-facing message banner at the top of the page.
 * Automatically removes after 5 seconds.
 *
 * @param {string} message - The message to display
 * @param {string} type - Message type: 'error', 'warning', 'success', 'info'
 *
 * @example
 * showUserMessage('Chart rendering failed. Try refreshing.', 'error');
 * showUserMessage('Data saved successfully!', 'success');
 */
function showUserMessage(message, type = 'error') {
    // Remove any existing messages
    document.querySelectorAll('.user-message').forEach(el => el.remove());

    const banner = document.createElement('div');
    banner.className = `user-message user-message-${type}`;
    banner.innerHTML = `
        <span>${escapeHTML(message)}</span>
        <button onclick="this.parentElement.remove()" aria-label="Dismiss message">✕</button>
    `;
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10000;
        padding: 1rem 2rem;
        background: ${type === 'error' ? '#d32f2f' : type === 'warning' ? '#f57c00' : type === 'success' ? '#388e3c' : '#1976d2'};
        color: white;
        text-align: center;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    banner.querySelector('button').style.cssText = `
        background: transparent;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0 0.5rem;
        margin-left: 1rem;
    `;

    document.body.prepend(banner);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (banner.parentElement) {
            banner.remove();
        }
    }, 5000);
}

function formatCurrency(amount, showDollars = state.showDollars) {
    if (showDollars) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    const startingSalary = getStartingSalary(employeeData);
    const index = (amount / startingSalary) * 100;
    return index.toFixed(0);
}

function formatPercent(value) {
    return value.toFixed(1) + '%';
}

// Helper functions moved to js/calculations.js (imported above)
// Chart functions moved to js/charts.js (imported above)

// ========================================
// MILESTONES DETECTION
// ========================================

function detectMilestones() {
    const milestones = [];
    const records = [...employeeData.records].reverse();
    const startingSalary = getStartingSalary(employeeData);

    // Six figures
    const sixFigures = records.find(r => r.annual >= CONSTANTS.SALARY_SIX_FIGURES);
    if (sixFigures) {
        milestones.push({
            icon: '💯',
            title: 'Six Figures',
            detail: 'Crossed $100,000 annual salary',
            date: formatDateSummary(sixFigures.date)
        });
    }

    // Salary doubled
    const doubled = records.find(r => r.annual >= startingSalary * 2);
    if (doubled) {
        const doubledDate = new Date(doubled.date);
        const hireDate = new Date(employeeData.hireDate);
        const monthsToDouble = Math.round((doubledDate - hireDate) / (CONSTANTS.MS_PER_DAY * CONSTANTS.DAYS_PER_MONTH_AVG));
        milestones.push({
            icon: '📈',
            title: 'Salary Doubled',
            detail: `Reached 2× starting salary in ${monthsToDouble} months`,
            date: formatDateSummary(doubledDate)
        });
    }

    // $200k milestone
    const twoHundredK = records.find(r => r.annual >= CONSTANTS.SALARY_200K_MILESTONE);
    if (twoHundredK) {
        milestones.push({
            icon: '🎯',
            title: '$200K Milestone',
            detail: 'Crossed $200,000 annual salary',
            date: formatDateSummary(twoHundredK.date)
        });
    }

    // Biggest raise
    const raises = employeeData.records.filter(r => r.changePercent > 0);
    if (raises.length > 0) {
        const biggestRaise = raises.reduce((max, r) => r.changePercent > max.changePercent ? r : max);
        milestones.push({
            icon: '⭐',
            title: 'Largest Raise',
            detail: `${biggestRaise.changePercent.toFixed(1)}% increase`,
            date: formatDateSummary(biggestRaise.date)
        });
    }

    // Decade of service milestone
    const years = calculateYearsOfService(employeeData);
    if (years >= CONSTANTS.YEARS_DECADE_SERVICE) {
        milestones.push({
            icon: '🏆',
            title: 'Decade of Service',
            detail: '10+ years with the organization',
            date: formatDateSummary(new Date(new Date(employeeData.hireDate).getTime() + CONSTANTS.YEARS_DECADE_SERVICE * CONSTANTS.MS_PER_YEAR))
        });
    }

    return milestones;
}

// ========================================
// THEME FUNCTIONS
// ========================================

/**
 * Sets the application theme and updates all visual components.
 *
 * Changes the data-theme attribute, persists preference to localStorage,
 * updates theme toggle buttons, and refreshes chart colors without rebuilding.
 *
 * @param {string} theme - Theme name ('tactical' for dark, 'artistic' for light)
 * @returns {void}
 *
 * @example
 * setTheme('tactical'); // Switch to dark theme
 * setTheme('artistic'); // Switch to light theme
 */
function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    // Persist theme preference to localStorage
    try {
        localStorage.setItem('theme', theme);
    } catch (e) {
        console.warn('Failed to save theme preference:', e);
    }

    // Update all theme buttons
    document.querySelectorAll('.theme-btn, .landing-theme-btn').forEach(btn => {
        const isActive = btn.dataset.theme === theme;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });

    // Update URL
    updateUrlParams();

    if (employeeData) {
        updateStory();
        // Instantly update chart colors without rebuilding (performance optimization)
        updateChartTheme(charts.main);
        updateChartTheme(charts.yoy);
        updateChartTheme(charts.projection);
    }
}

// ========================================
// VIEW MODE (DOLLARS / INDEX)
// ========================================

function setViewMode(mode) {
    state.showDollars = (mode === 'dollars');
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        const isActive = btn.dataset.view === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
    
    updateAllDisplays();
    updateUrlParams();
}

function togglePrivacy() {
    // Toggle for keyboard shortcut
    setViewMode(state.showDollars ? 'index' : 'dollars');
}

function updateAllDisplays() {
    const current = getCurrentSalary(employeeData);

    document.getElementById('currentSalary').textContent = state.showDollars
        ? formatCurrency(current)
        : `Index: ${formatCurrency(current, false)}`;

    document.getElementById('currentSalaryIndexed').textContent = state.showDollars
        ? `Index: ${formatCurrency(current, false)}`
        : `Base 100 = Starting salary`;

    buildHistoryTable();
    updateAnalytics();
    updateStory();
    updateMainChartData();  // #150: Use update() instead of destroy/rebuild for better performance
    if (charts.projection) {
        updateProjectionChartData();  // #150: Use update() for better performance
        buildProjectionTable();
    }
}

// ========================================
// STORY UPDATE
// ========================================

/**
 * Updates the Story tab with narrative insights about compensation history.
 *
 * Generates personalized story cards with CAGR analysis, milestone detection,
 * industry comparisons, and contextual insights. Adapts language and metrics
 * based on theme (tactical/artistic) and tenure length.
 *
 * @global {Object} employeeData - Employee compensation records
 * @global {Object} state - UI state (theme, showDollars)
 * @returns {void}
 *
 * @example
 * // Refresh story after data or theme change
 * updateStory();
 */
function updateStory() {
    const content = storyContent[state.theme];
    document.getElementById('storyTitle').textContent = content.title;

    const start = getStartingSalary(employeeData);
    const current = getCurrentSalary(employeeData);
    const growth = ((current - start) / start) * 100;
    const cagr = calculateCAGR(employeeData);
    const years = calculateYearsOfService(employeeData);
    
    // Exclude "New Hire" - it's the starting point, not an adjustment
    const adjustments = employeeData.records.filter(r => r.reason !== 'New Hire');
    
    const raises = employeeData.records.filter(r => r.changePercent > 0);
    const largestRaise = raises.length > 0 ? raises.reduce((max, r) => r.changePercent > max.changePercent ? r : max) : null;
    
    const meritCount = adjustments.filter(r => r.reason.includes('Merit')).length;
    const meritPercent = adjustments.length > 0 ? ((meritCount / adjustments.length) * 100).toFixed(1) : '0';
    
    // Calculate avg interval (exclude New Hire from time calculation)
    const avgMonths = adjustments.length > 0 ? calculateAverageMonthsBetweenDates(adjustments, 0) : 0;

    // Find six figure date and calculate time to reach it
    const recordsChron = [...employeeData.records].reverse();
    const sixFigures = recordsChron.find(r => r.annual >= 100000);
    let yearsToSixFigures = null;
    if (sixFigures) {
        const hireDate = new Date(employeeData.hireDate);
        const sixFigDate = new Date(sixFigures.date);
        const diffYears = (sixFigDate - hireDate) / CONSTANTS.MS_PER_YEAR;
        yearsToSixFigures = diffYears < 1 ? `${Math.round(diffYears * 12)} months` : `${diffYears.toFixed(1)} years`;
    }
    
    // Calculate inflation data (use employeeData.currentDate, not current real date)
    const startYear = new Date(employeeData.hireDate).getFullYear();
    const startMonth = new Date(employeeData.hireDate).getMonth();
    const endYear = new Date(employeeData.currentDate).getFullYear();
    const endMonth = new Date(employeeData.currentDate).getMonth();
    const cumulativeInflation = calculateInflationOverPeriod(startYear, endYear, startMonth, endMonth);
    const realGrowth = calculateRealGrowth(growth, cumulativeInflation);
    const dollarIncrease = current - start;
    
    const data = {
        hireDateFormatted: formatDateDetail(employeeData.hireDate),
        startSalary: state.showDollars ? formatCurrency(start) : 'Index 100',
        currentSalary: state.showDollars ? formatCurrency(current) : `Index ${formatCurrency(current, false)}`,
        dollarIncrease: state.showDollars ? formatCurrency(dollarIncrease) : `Index ${(dollarIncrease / start * 100).toFixed(0)}`,
        years: years.toFixed(1),
        totalAdjustments: adjustments.length,
        growth: growth.toFixed(0),
        cagr: cagr.toFixed(1),
        avgInterval: avgMonths.toFixed(1),
        meritPercent,
        largestRaiseDate: largestRaise ? formatDateSummary(largestRaise.date) : 'N/A',
        largestRaise: largestRaise ? largestRaise.changePercent.toFixed(1) : '0',
        sixFigureDate: sixFigures ? formatDateSummary(sixFigures.date) : null,
        yearsToSixFigures,
        cumulativeInflation: cumulativeInflation.toFixed(1),
        realGrowth: realGrowth.toFixed(1),
        dateRange: formatDateSummary(employeeData.hireDate) + ' – Present'
    };

    // Security: Validate data types before template interpolation (defense-in-depth)
    validateTemplateData(data);

    // Set subtitle (static for tactical, dynamic for summary)
    const subtitle = content.getSubtitle ? content.getSubtitle(data) : content.subtitle;
    document.getElementById('storySubtitle').textContent = subtitle;

    // Security Note: innerHTML is safe here because all dynamic values come from safe sources:
    // - Dates: toLocaleDateString() (browser API, produces safe strings)
    // - Numbers: toFixed(), formatCurrency() (numeric methods, produce safe strings)
    // - Parser validates all inputs: parser.js:25-50 (validateSalaryRange) and parser.js:106 (HTML stripping)
    // No user-controlled strings are interpolated without sanitization.
    document.getElementById('storyText').innerHTML = content.getText(data);
    buildMilestones();
}

/**
 * Updates the Market tab with benchmark comparisons and performance analysis.
 *
 * Compares user's CAGR, average raises, and real growth against B2B SaaS
 * industry benchmarks. Generates performance tier (high/solid/low) and
 * theme-appropriate headline. Renders comparison cards and inflation analysis.
 *
 * @global {Object} benchmarks - Industry benchmark data (CAGR, typical raises)
 * @global {Object} state - UI state (theme for tactical vs artistic styling)
 * @returns {void}
 *
 * @example
 * // After parsing data, call to render market comparison
 * updateMarket(); // Populates #marketSummaryCard with performance analysis
 */
function updateMarket() {
    const bench = getBenchmarkComparisons(employeeData, benchmarks);
    if (!bench) return;

    const start = getStartingSalary(employeeData);
    const current = getCurrentSalary(employeeData);
    const years = calculateYearsOfService(employeeData);
    
    // Update header based on theme
    const isOutperforming = bench.cagrVsIndustry > 0 && bench.realGrowth > 0;
    const summaryCard = document.getElementById('marketSummaryCard');
    summaryCard.className = 'market-summary-card ' + (isOutperforming ? 'outperforming' : bench.cagrVsIndustry < -1 ? 'underperforming' : '');
    
    // Generate summary headline
    let headline, detail;
    if (bench.performanceTier === 'high') {
        headline = state.theme === 'tactical' 
            ? 'PERFORMANCE STATUS: EXCEEDING BENCHMARKS'
            : 'Your growth outpaces the industry';
        detail = `Your <strong>${bench.userCagr.toFixed(1)}% CAGR</strong> exceeds the B2B SaaS benchmark of ${benchmarks.industryCagr}%. With raises averaging <strong>${bench.avgRaise.toFixed(1)}%</strong> (above the typical ${benchmarks.typicalRaise.min}-${benchmarks.typicalRaise.max}% range), your compensation trajectory demonstrates exceptional growth.`;
    } else if (bench.performanceTier === 'solid') {
        headline = state.theme === 'tactical'
            ? 'PERFORMANCE STATUS: MEETING STANDARDS'
            : 'Tracking with industry benchmarks';
        detail = `Your <strong>${bench.userCagr.toFixed(1)}% CAGR</strong> ${bench.cagrVsIndustry >= 0 ? 'meets' : 'approaches'} the B2B SaaS benchmark of ${benchmarks.industryCagr}%. With raises averaging <strong>${bench.avgRaise.toFixed(1)}%</strong>, your compensation growth aligns with industry norms.`;
    } else {
        headline = state.theme === 'tactical'
            ? 'PERFORMANCE STATUS: OPPORTUNITY IDENTIFIED'
            : 'Room to grow toward benchmarks';
        detail = `Your <strong>${bench.userCagr.toFixed(1)}% CAGR</strong> trails the B2B SaaS benchmark of ${benchmarks.industryCagr}%. With raises averaging <strong>${bench.avgRaise.toFixed(1)}%</strong>, there may be opportunity to negotiate stronger increases.`;
    }
    
    document.getElementById('marketSummaryHeadline').textContent = headline;
    // Security Note: innerHTML safe - 'detail' contains only <strong> tags around numeric values from toFixed()
    document.getElementById('marketSummaryDetail').innerHTML = detail;
    
    // Build comparison cards
    buildMarketComparison();

    // Build inflation analysis
    buildInflationAnalysis(bench, start, current, years);

    // Populate market footnote with metadata (#147)
    const footnote = document.getElementById('marketFootnote');
    if (footnote) {
        footnote.textContent =
            `Benchmarks: ${benchmarkMetadata.lastUpdated.salaryBenchmarks} | ` +
            `CPI Data: ${benchmarkMetadata.lastUpdated.inflationData} | ` +
            `Region: ${benchmarkMetadata.region} | ` +
            `Industry: ${benchmarkMetadata.industry}`;
    }
}

function buildInflationAnalysis(bench, start, current, years) {
    const container = document.getElementById('inflationAnalysis');
    const nominalGrowth = ((current - start) / start) * 100;

    // Security Note: innerHTML safe - all dynamic values are numeric (toFixed, formatCurrency, Math.round)
    // No user-controlled strings. Data originates from validated parser (parser.js:25-50).
    container.innerHTML = `
        <div class="inflation-card">
            <div class="inflation-card-title">Cumulative Inflation</div>
            <div class="inflation-card-value">${bench.totalInflation.toFixed(1)}%</div>
            <div class="inflation-card-label">CPI increase over ${years.toFixed(1)} years</div>
            <div class="inflation-breakdown">
                <div class="inflation-row">
                    <span class="inflation-row-label">Your nominal growth</span>
                    <span class="inflation-row-value">${nominalGrowth.toFixed(1)}%</span>
                </div>
                <div class="inflation-row">
                    <span class="inflation-row-label">Minus inflation</span>
                    <span class="inflation-row-value">-${bench.totalInflation.toFixed(1)}%</span>
                </div>
                <div class="inflation-row" style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.25rem;">
                    <span class="inflation-row-label"><strong>Real growth</strong></span>
                    <span class="inflation-row-value ${bench.realGrowth >= 0 ? 'positive' : 'negative'}"><strong>${bench.realGrowth >= 0 ? '+' : ''}${bench.realGrowth.toFixed(1)}%</strong></span>
                </div>
            </div>
        </div>
        <div class="inflation-card">
            <div class="inflation-card-title">Purchasing Power ${bench.purchasingPowerGain >= 0 ? 'Gained' : 'Lost'}</div>
            <div class="inflation-card-value ${bench.purchasingPowerGain >= 0 ? 'positive' : 'negative'}">${state.showDollars ? (bench.purchasingPowerGain >= 0 ? '+' : '') + formatCurrency(bench.purchasingPowerGain) : (bench.purchasingPowerGain >= 0 ? '+' : '') + (bench.purchasingPowerGain / start * 100).toFixed(0) + ' pts'}</div>
            <div class="inflation-card-label">In today's dollars</div>
            <div class="inflation-breakdown">
                <div class="inflation-row">
                    <span class="inflation-row-label">Starting salary (then)</span>
                    <span class="inflation-row-value">${state.showDollars ? formatCurrency(start) : '100'}</span>
                </div>
                <div class="inflation-row">
                    <span class="inflation-row-label">Adjusted for inflation (now)</span>
                    <span class="inflation-row-value">${state.showDollars ? formatCurrency(bench.inflationAdjustedStart) : Math.round(bench.inflationAdjustedStart / start * 100)}</span>
                </div>
                <div class="inflation-row">
                    <span class="inflation-row-label">Current salary</span>
                    <span class="inflation-row-value">${state.showDollars ? formatCurrency(current) : Math.round(current / start * 100)}</span>
                </div>
            </div>
        </div>
    `;
}

function buildMilestones() {
    const milestones = detectMilestones();
    const grid = document.getElementById('milestonesGrid');

    grid.innerHTML = milestones.map(m => `
        <div class="milestone-card">
            <div class="milestone-icon">${escapeHTML(m.icon)}</div>
            <div class="milestone-title">${escapeHTML(m.title)}</div>
            <div class="milestone-detail">${escapeHTML(m.detail)}</div>
            <div class="milestone-date">${escapeHTML(m.date)}</div>
        </div>
    `).join('');
}

function buildMarketComparison() {
    const grid = document.getElementById('marketComparisonGrid');
    const bench = getBenchmarkComparisons(employeeData, benchmarks);

    if (!bench) {
        grid.innerHTML = '<p style="color: var(--text-muted);">Unable to calculate market comparisons.</p>';
        return;
    }

    const start = getStartingSalary(employeeData);

    // #79: Primary metrics get larger cards, secondary metrics get smaller cards
    const cards = [
        {
            label: 'Your CAGR',
            value: `${bench.userCagr.toFixed(1)}%`,
            comparison: `Industry avg: <strong>${benchmarks.industryCagr}%</strong>`,
            diff: bench.cagrVsIndustry,
            badge: bench.cagrVsIndustry > 0.5 ? 'above' : bench.cagrVsIndustry < -0.5 ? 'below' : 'at',
            primary: true
        },
        {
            label: 'Real Growth',
            value: `${bench.realGrowth.toFixed(1)}%`,
            comparison: `After <strong>${bench.totalInflation.toFixed(1)}%</strong> cumulative inflation`,
            diff: bench.realGrowth,
            badge: bench.realGrowth > 10 ? 'above' : bench.realGrowth > 0 ? 'at' : 'below',
            primary: true
        },
        {
            label: 'vs Industry Path',
            value: state.showDollars
                ? (bench.vsIndustrySalary >= 0 ? '+' : '') + formatCurrency(bench.vsIndustrySalary)
                : (bench.vsIndustrySalary >= 0 ? '+' : '') + (bench.vsIndustrySalary / start * 100).toFixed(0) + ' pts',
            comparison: `At ${benchmarks.industryCagr}% CAGR: <strong>${state.showDollars ? formatCurrency(bench.industryProjectedSalary) : Math.round(bench.industryProjectedSalary / start * 100)}</strong>`,
            diff: bench.vsIndustrySalary,
            badge: bench.vsIndustryPercent > 5 ? 'above' : bench.vsIndustryPercent < -5 ? 'below' : 'at',
            primary: true
        },
        {
            label: 'Avg Raise',
            value: `${bench.avgRaise.toFixed(1)}%`,
            comparison: `Typical range: <strong>${benchmarks.typicalRaise.min}-${benchmarks.typicalRaise.max}%</strong>`,
            diff: bench.raiseVsTypical,
            badge: bench.avgRaise > benchmarks.typicalRaise.max ? 'above' : bench.avgRaise >= benchmarks.typicalRaise.min ? 'at' : 'below'
        },
        {
            label: 'Raise Frequency',
            value: `${bench.avgMonthsBetween.toFixed(0)} mo`,
            comparison: `Industry avg: <strong>${benchmarks.avgMonthsBetweenRaises} months</strong>`,
            diff: benchmarks.avgMonthsBetweenRaises - bench.avgMonthsBetween,
            badge: bench.avgMonthsBetween < benchmarks.avgMonthsBetweenRaises - 1 ? 'above' : bench.avgMonthsBetween > benchmarks.avgMonthsBetweenRaises + 1 ? 'below' : 'at'
        },
        {
            label: 'Purchasing Power',
            value: state.showDollars
                ? (bench.purchasingPowerGain >= 0 ? '+' : '') + formatCurrency(bench.purchasingPowerGain)
                : (bench.purchasingPowerGain >= 0 ? '+' : '') + (bench.purchasingPowerGain / start * 100).toFixed(0) + ' pts',
            comparison: `${state.showDollars ? formatCurrency(bench.inflationAdjustedStart) : Math.round(bench.inflationAdjustedStart / start * 100)} would equal start salary today`,
            diff: bench.purchasingPowerGain,
            badge: bench.purchasingPowerGain > 0 ? 'above' : bench.purchasingPowerGain < 0 ? 'below' : 'at'
        }
    ];

    // Security Note: innerHTML safe - 'cards' array contains only:
    // - Static labels (hardcoded strings)
    // - Numeric values (toFixed, formatCurrency, Math.round - all produce safe strings)
    // - Badge strings (conditional on 'above'/'below'/'at' - all hardcoded safe values)
    // No user-controlled data interpolated without validation.
    grid.innerHTML = cards.map(card => `
        <div class="market-card ${card.diff > 0 ? 'positive' : card.diff < 0 ? 'negative' : 'neutral'}${card.primary ? ' market-card-primary' : ''}">
            <div class="market-card-header">
                <span class="market-card-label">${card.label}</span>
                <span class="market-card-badge ${card.badge}">${card.badge === 'above' ? '↑ Above' : card.badge === 'below' ? '↓ Below' : '● At'}</span>
            </div>
            <div class="market-card-value ${card.diff > 0 ? 'positive' : card.diff < 0 ? 'negative' : ''}">${card.value}</div>
            <div class="market-card-comparison">${card.comparison}</div>
        </div>
    `).join('');
    
    // Update footnote
    document.getElementById('marketFootnote').textContent = `Benchmarks based on B2B SaaS industry data (${benchmarks.lastUpdated}). CPI data from Bureau of Labor Statistics. Individual results vary by role, location, and company stage.`;
}

// ========================================
// TAB FUNCTIONS
// ========================================

/**
 * Switches to the specified dashboard tab and lazy-loads its content.
 *
 * Updates URL parameters, toggles active states on tab buttons, shows/hides
 * tab content panels, and initializes tab-specific charts on first view
 * (market benchmarks, analytics charts, projections).
 *
 * @param {string} tabId - Tab identifier (home, story, market, history, analytics, projections, help)
 * @param {boolean} [pushHistory=true] - Whether to push a new browser history entry (enables back/forward)
 * @returns {void}
 *
 * @example
 * setTab('market');           // Switch to Market tab, push history entry
 * setTab('history', false);   // Switch to History tab, don't push history (e.g., from popstate)
 */
function setTab(tabId, pushHistory = true) {
    state.currentTab = tabId;

    // Update URL params - push history for user-initiated navigation
    if (pushHistory) {
        updateUrlParams(true);  // true = pushState for back/forward support
    } else {
        updateUrlParams(false); // false = replaceState (from popstate handler)
    }
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabId}`);
    });

    if (tabId === 'market') {
        setTimeout(() => {
            updateMarket();
        }, 100);
    }
    if (tabId === 'analytics' && !charts.yoy) {
        setTimeout(() => {
            buildYoyChart();
        }, 100);
    }
    if (tabId === 'projections' && !charts.projection) {
        setTimeout(() => {
            initProjections();
            buildProjectionChart();
            buildProjectionTable();
        }, 100);
    }
}

// ========================================
// URL NAVIGATION
// ========================================

function handleTabFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const validTabs = ['home', 'story', 'market', 'history', 'analytics', 'projections', 'help'];
    if (tab && validTabs.includes(tab) && employeeData) {
        setTab(tab, false); // false = don't push history (initial load)
    }
}

// Warn before losing unsaved data (browser only)
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', (e) => {
        if (employeeData && !employeeData.isDemo) {
            e.preventDefault();
            return '';
        }
    });

    // Handle browser back/forward navigation
    window.addEventListener('popstate', (event) => {
        if (!employeeData) return; // Only handle if dashboard is active

        const tab = event.state?.tab || new URLSearchParams(window.location.search).get('tab') || 'home';
        const validTabs = ['home', 'story', 'market', 'history', 'analytics', 'projections', 'help'];

        if (validTabs.includes(tab)) {
            setTab(tab, false); // false = don't push another history entry
        }
    });
}

// Check tab on initial dashboard load
function checkInitialHash() {
    setTimeout(handleTabFromUrl, 100);
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

// Only set up keyboard shortcuts in browser environment
if (typeof document !== 'undefined') {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!employeeData) return;

        switch(e.key) {
            case '1': setTab('home'); break;
            case '2': setTab('story'); break;
            case '3': setTab('market'); break;
            case '4': setTab('history'); break;
            case '5': setTab('analytics'); break;
            case '6': setTab('projections'); break;
            case '7': setTab('help'); break;
            case 't':
            case 'T': setTheme(state.theme === 'tactical' ? 'artistic' : 'tactical'); break;
            case 'v':
            case 'V':
            case 'p':
            case 'P': togglePrivacy(); break;
        }
    });
}

// ========================================
// CHART FUNCTIONS
// ========================================

function setChartType(type) {
    state.mainChartType = type;
    document.querySelectorAll('.chart-controls .chart-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.chart === type);
    });
    // Use efficient type update instead of full rebuild
    updateMainChartType();
}

function setYoyChartType(type) {
    state.yoyChartType = type;
    document.querySelectorAll('[data-chart^="yoy-"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.chart === `yoy-${type}`);
    });
    // Use efficient type update instead of full rebuild
    updateYoyChartType();
}

// Chart build functions moved to js/charts.js (imported above)

function initProjections() {
    // Set slider to historical CAGR
    const historicalCAGR = Math.round(calculateCAGR(employeeData));
    state.cagr = historicalCAGR;

    // Set custom rate to halfway between historical and conservative (3%)
    // This prevents custom line from overlapping with historical line
    const conservativeRate = 3;
    state.customRate = Math.round((historicalCAGR + conservativeRate) / 2);

    // Update slider and display
    const slider = document.getElementById('customRateSlider');
    slider.value = state.customRate;
    document.getElementById('customRateValue').textContent = state.customRate + '%';
    document.getElementById('historicalRateDisplay').textContent = historicalCAGR + '%';

    // Initialize slider track fill
    const progress = (state.customRate / 25) * 100;
    slider.style.setProperty('--range-progress', `${progress}%`);
}

// ========================================
// TABLE FUNCTIONS
// ========================================

function buildHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    const startingSalary = getStartingSalary(employeeData);

    tbody.innerHTML = employeeData.records.map(r => {
        const badgeClass = getBadgeClass(r.reason);
        const index = ((r.annual / startingSalary) * 100).toFixed(0);
        const changeDisplay = r.change > 0
            ? (state.showDollars ? `+${formatCurrency(r.change * CONSTANTS.PAY_PERIODS_PER_YEAR)}` : `+${((r.change * CONSTANTS.PAY_PERIODS_PER_YEAR / startingSalary) * 100).toFixed(1)}`)
            : '—';

        return `
            <tr>
                <td>${formatDateDetail(r.date)}</td>
                <td><span class="badge ${badgeClass}">${escapeHTML(r.reason)}</span></td>
                <td>${state.showDollars ? formatCurrency(r.annual) : `Index: ${index}`}</td>
                <td>${index}</td>
                <td>${changeDisplay}</td>
                <td>${r.changePercent > 0 ? `+${r.changePercent.toFixed(2)}%` : '—'}</td>
            </tr>
        `;
    }).join('');
}

function getBadgeClass(reason) {
    if (reason.includes('Merit')) return 'badge-merit';
    if (reason.includes('Equity')) return 'badge-equity';
    if (reason.includes('Market')) return 'badge-market';
    if (reason.includes('New')) return 'badge-new';
    return '';
}

function buildProjectionTable() {
    const tbody = document.getElementById('projectionTableBody');
    const currentSalaryRaw = getCurrentSalary(employeeData);
    const startingSalary = getStartingSalary(employeeData);

    // Convert to indexed values if privacy mode enabled (same as chart)
    const currentSalary = state.showDollars
        ? currentSalaryRaw
        : (currentSalaryRaw / startingSalary) * 100;

    const cagr = calculateCAGR(employeeData) / 100;
    const customRate = state.customRate / 100;

    // Fixed intervals: 1-5 yearly, then 10, 15, 20
    const intervals = [1, 2, 3, 4, 5, 10, 15, 20];

    tbody.innerHTML = intervals.map(year => {
        const historicalValue = currentSalary * Math.pow(1 + cagr, year);
        const conservativeValue = currentSalary * Math.pow(1 + CONSTANTS.PROJECTION_RATE_CONSERVATIVE, year);
        const customValue = currentSalary * Math.pow(1 + customRate, year);

        return `
            <tr>
                <td>${year} year${year > 1 ? 's' : ''}</td>
                <td>${state.showDollars ? formatCurrency(historicalValue) : historicalValue.toFixed(0)}</td>
                <td>${state.showDollars ? formatCurrency(conservativeValue) : conservativeValue.toFixed(0)}</td>
                <td>${state.showDollars ? formatCurrency(customValue) : customValue.toFixed(0)}</td>
            </tr>
        `;
    }).join('');
}

// ========================================
// ANALYTICS UPDATE
// ========================================

function updateAnalytics() {
    const records = employeeData.records;
    const startingSalary = getStartingSalary(employeeData);
    
    // Filter out "New Hire" - it's the starting point, not an adjustment
    const adjustments = records.filter(r => r.reason !== 'New Hire');
    
    // Guard against no adjustments (shouldn't happen, but be safe)
    if (adjustments.length === 0) return;
    
    const raises = records.filter(r => r.changePercent > 0);
    if (raises.length === 0) return;
    
    const avgRaisePercent = raises.reduce((sum, r) => sum + r.changePercent, 0) / raises.length;
    const sortedRaises = [...raises].sort((a, b) => a.changePercent - b.changePercent);
    const medianRaise = sortedRaises[Math.floor(sortedRaises.length / 2)].changePercent;
    const largestRaise = Math.max(...raises.map(r => r.changePercent));
    const largestRaiseRecord = raises.find(r => r.changePercent === largestRaise);
    
    const meritCount = adjustments.filter(r => r.reason.includes('Merit')).length;
    
    // Use adjustments (excludes New Hire) for time between raises
    const avgMonths = calculateAverageMonthsBetweenDates(adjustments);
    
    document.getElementById('cagr').textContent = formatPercent(calculateCAGR(employeeData));
    document.getElementById('avgRaise').textContent = formatPercent(avgRaisePercent);
    
    const avgRaiseDollar = (avgRaisePercent / 100) * getCurrentSalary(employeeData);
    document.getElementById('avgRaiseDollar').textContent = state.showDollars 
        ? `~${formatCurrency(avgRaiseDollar)} per adjustment`
        : `~${((avgRaiseDollar / startingSalary) * 100).toFixed(1)} index points`;
    
    document.getElementById('medianRaise').textContent = formatPercent(medianRaise);
    document.getElementById('largestRaise').textContent = formatPercent(largestRaise);
    document.getElementById('largestRaiseDate').textContent = formatDateSummary(largestRaiseRecord.date);
    document.getElementById('avgTimeBetween').textContent = `${avgMonths.toFixed(1)} mo`;
    const benchmarkMonths = CONSTANTS.TYPICAL_RAISE_INTERVAL_MONTHS;
    const timeDiff = avgMonths - benchmarkMonths;
    let timeContext;
    if (timeDiff < -2) {
        timeContext = `${Math.abs(timeDiff).toFixed(1)} mo faster than typical`;
    } else if (timeDiff > 2) {
        timeContext = `${timeDiff.toFixed(1)} mo slower than typical`;
    } else {
        timeContext = `Near industry standard (12 mo)`;
    }
    document.getElementById('avgTimeDetail').textContent = timeContext;
    document.getElementById('meritCount').textContent = meritCount;
    document.getElementById('meritPercent').textContent = `${((meritCount / adjustments.length) * 100).toFixed(1)}% of all adjustments`;
}

// ========================================
// PROJECTION CONTROLS
// ========================================

function setProjectionYears(years) {
    state.projectionYears = years;
    document.querySelectorAll('.interval-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.years, 10) === years);
    });
    // Use efficient update instead of full rebuild
    updateProjectionChartData();
}

// Debounced chart update for smoother slider interaction (uses update() instead of rebuild)
const debouncedProjectionUpdate = debounce(() => {
    updateProjectionChartData();
    buildProjectionTable();
}, 150);

function updateCustomRate() {
    const slider = document.getElementById('customRateSlider');
    state.customRate = parseInt(slider.value, 10);
    // Update display immediately for responsive feel
    document.getElementById('customRateValue').textContent = state.customRate + '%';
    // Update slider track fill (CSS variable for gradient)
    const progress = (state.customRate / 25) * 100;
    slider.style.setProperty('--range-progress', `${progress}%`);
    // Debounce chart data updates (uses efficient update() instead of rebuild)
    debouncedProjectionUpdate();
}

function setProjectionView(view) {
    const chartWrapper = document.getElementById('projectionChartWrapper');
    const tableWrapper = document.getElementById('projectionTableWrapper');
    const buttons = document.querySelectorAll('#tab-projections .chart-type-btn');

    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    if (view === 'chart') {
        chartWrapper.classList.remove('hidden');
        tableWrapper.classList.add('hidden');
    } else {
        chartWrapper.classList.add('hidden');
        tableWrapper.classList.remove('hidden');
    }
    // Note: Time period buttons always stay visible (affects both chart and table)
}

// ========================================
// DASHBOARD INITIALIZATION
// ========================================

/**
 * Initializes the main dashboard with KPI cards and summary statistics.
 *
 * Calculates and displays current salary, total growth percentage, tenure,
 * adjustment count, CAGR, and real (inflation-adjusted) growth. Populates
 * the Home tab KPI cards. Called after parsing data or loading demo.
 *
 * @global {Object} employeeData - Parsed compensation records
 * @returns {void}
 *
 * @example
 * // Initialize after parseAndGenerate() or loadDemoData()
 * initDashboard();
 */
function initDashboard() {
    const current = getCurrentSalary(employeeData);
    const start = getStartingSalary(employeeData);
    const growth = ((current - start) / start) * 100;
    const years = calculateYearsOfService(employeeData);

    // Exclude "New Hire" from adjustment counts - it's the starting point, not an adjustment
    const adjustments = employeeData.records.filter(r => r.reason !== 'New Hire');
    const adjustmentCount = adjustments.length;
    
    document.getElementById('currentSalary').textContent = formatCurrency(current);
    document.getElementById('currentSalaryIndexed').textContent = `Index: ${formatCurrency(current, false)}`;
    document.getElementById('totalGrowth').textContent = `+${growth.toFixed(0)}%`;
    document.getElementById('yearsService').textContent = years.toFixed(1);
    document.getElementById('hireDateText').textContent = `Since ${formatDateSummary(employeeData.hireDate)}`;
    document.getElementById('totalRaises').textContent = adjustmentCount;
    document.getElementById('avgRaisesPerYear').textContent = `Avg: ${(adjustmentCount / years).toFixed(1)} per year`;
    
    buildHistoryTable();
    buildMainChart();
    updateAnalytics();
    updateStory();
}

// ========================================
// URL PARAMETER HANDLING
// ========================================

/**
 * Update URL parameters to reflect current state.
 *
 * @param {boolean} [pushHistory=false] - If true, create new history entry (for back/forward nav).
 *                                        If false, replace current entry (for non-navigation updates).
 */
function updateUrlParams(pushHistory = false) {
    const params = new URLSearchParams();

    // Always include theme
    params.set('theme', state.theme);

    // Include view mode (only if not default 'dollars')
    if (!state.showDollars) {
        params.set('view', 'index');
    }

    // Include demo flag if in demo mode
    if (employeeData && employeeData.isDemo) {
        params.set('demo', 'true');
    }

    // Include tab if on dashboard and not home
    if (!document.getElementById('dashboardPage').classList.contains('hidden') && state.currentTab !== 'home') {
        params.set('tab', state.currentTab);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;

    if (pushHistory) {
        history.pushState({ tab: state.currentTab }, '', newUrl);
    } else {
        history.replaceState({ tab: state.currentTab }, '', newUrl);
    }
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        theme: params.get('theme'),
        demo: params.get('demo') === 'true',
        tab: params.get('tab'),
        view: params.get('view')
    };
}

function initFromUrl() {
    const params = getUrlParams();

    // Apply theme from URL if specified
    if (params.theme && (params.theme === 'tactical' || params.theme === 'artistic')) {
        setTheme(params.theme);
    }

    // Apply view mode from URL if specified
    if (params.view === 'index') {
        setViewMode('index');
    }

    // Set tab from URL BEFORE loading demo (so showDashboard can use it)
    const validTabs = ['home', 'story', 'market', 'history', 'analytics', 'projections', 'help'];
    if (params.tab && validTabs.includes(params.tab)) {
        state.currentTab = params.tab;
    }

    // Auto-load demo if specified
    if (params.demo) {
        loadDemoData();
    }
}

/**
 * Initialize event listeners (CSP Hardening - Closes #28)
 * Replace all inline onclick handlers with addEventListener
 */
function initEventListeners() {
    // #149: Initialize DOM cache to eliminate redundant getElementById calls
    domCache = {
        // Landing page
        landingPage: document.getElementById('landingPage'),
        dashboardPage: document.getElementById('dashboardPage'),
        mobileSplash: document.getElementById('mobileSplash'),

        // Import modal
        importModal: document.getElementById('importModal'),
        pasteInput: document.getElementById('pasteInput'),
        generateBtn: document.getElementById('generateBtn'),
        validationMessage: document.getElementById('validationMessage'),
        legalConsentCheckbox: document.getElementById('legalConsentCheckbox'),
        jsonFileInput: document.getElementById('jsonFileInput'),

        // Demo banner
        demoBanner: document.getElementById('demoBanner'),

        // Privacy toggle & displays
        privacyToggle: document.getElementById('privacyToggle'),
        currentSalary: document.getElementById('currentSalary'),
        currentSalaryIndexed: document.getElementById('currentSalaryIndexed'),

        // Projection controls
        customRateSlider: document.getElementById('customRateSlider'),
        customRateValue: document.getElementById('customRateValue'),

        // Other frequently accessed elements
        comparisonSlider: document.getElementById('comparisonSlider'),
        marketFootnote: document.getElementById('marketFootnote'),
        restoreBackupBtn: document.getElementById('restoreBackupBtn')
    };

    // Load saved theme preference from localStorage
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && (savedTheme === 'tactical' || savedTheme === 'artistic')) {
            setTheme(savedTheme);
        } else {
            // Save initial theme to localStorage
            const initialTheme = document.documentElement.getAttribute('data-theme') || 'artistic';
            localStorage.setItem('theme', initialTheme);
        }
    } catch (e) {
        console.warn('Failed to load/save theme preference:', e);
    }

    // Landing page theme buttons
    document.querySelectorAll('.landing-theme-btn').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });

    // ========================================
    // LANDING PAGE - Feature Chips & Slider
    // ========================================

    // Tab data for feature chips - maps chip to screenshot and display name
    const tabData = {
        home: {
            name: 'Salary Timeline',
            img: 'screenshots/tab-home.png',
            url: 'tejasgadhia.github.io/paylocity-compensation-journey/#home'
        },
        market: {
            name: 'Market Benchmarks',
            img: 'screenshots/tab-market.png',
            url: 'tejasgadhia.github.io/paylocity-compensation-journey/#market'
        },
        history: {
            name: 'Pay History',
            img: 'screenshots/tab-history.png',
            url: 'tejasgadhia.github.io/paylocity-compensation-journey/#history'
        },
        analytics: {
            name: 'Growth Analytics',
            img: 'screenshots/tab-analytics.png',
            url: 'tejasgadhia.github.io/paylocity-compensation-journey/#analytics'
        },
        projections: {
            name: 'Future Projections',
            img: 'screenshots/tab-projections.png',
            url: 'tejasgadhia.github.io/paylocity-compensation-journey/#projections'
        }
    };

    // Feature chip click handlers - switch "after" image in slider
    const featureChips = document.querySelectorAll('.feature-chip');
    const afterImg = document.getElementById('afterImg');
    const tabIndicator = document.getElementById('tabIndicator');
    const browserUrl = document.getElementById('browserUrl');

    // Get slider reference for reset on chip click (#108, #111)
    const comparisonSliderRef = document.getElementById('comparisonSlider');

    featureChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Update active state
            featureChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            // Get tab info
            const tab = chip.dataset.tab;
            const data = tabData[tab];

            if (data && afterImg && tabIndicator && browserUrl) {
                // Update indicator and URL
                tabIndicator.textContent = data.name;
                browserUrl.textContent = data.url;

                // Swap image with fade effect
                afterImg.style.opacity = '0.5';
                setTimeout(() => {
                    afterImg.src = data.img;
                    afterImg.style.opacity = '1';
                }, 150);

                // Reset slider to show full "after" view (#108, #111)
                // Use setTimeout to let the image swap start first
                if (comparisonSliderRef) {
                    setTimeout(() => {
                        comparisonSliderRef.value = 0;
                    }, 250);
                }
            }
        });
    });

    // Slider animation on page load - sweeping motion to catch attention
    const comparisonSlider = document.getElementById('comparisonSlider');
    if (comparisonSlider) {
        // Wait for component to initialize, then animate
        setTimeout(() => {
            // Animate slider: 50 -> 15 -> 85 -> 50 (sweep left, then right, back to center)
            const animateSlider = () => {
                const duration = 600; // ms per segment
                const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

                const animate = (from, to, onComplete) => {
                    const startTime = performance.now();
                    const step = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const easedProgress = easeInOut(progress);
                        const currentValue = from + (to - from) * easedProgress;
                        comparisonSlider.value = currentValue;

                        if (progress < 1) {
                            requestAnimationFrame(step);
                        } else if (onComplete) {
                            onComplete();
                        }
                    };
                    requestAnimationFrame(step);
                };

                // Chain: 50 -> 15 -> 85 -> 50
                animate(50, 15, () => {
                    animate(15, 85, () => {
                        animate(85, 50);
                    });
                });
            };

            animateSlider();
        }, 800); // Wait for page to settle
    }

    // ========================================
    // IMPORT MODAL
    // ========================================

    const importModal = document.getElementById('importModal');
    const openImportBtn = document.getElementById('openImportBtn');
    const closeImportBtn = document.getElementById('closeImportBtn');

    function openImportModal() {
        if (importModal) {
            importModal.classList.add('visible');
            document.body.style.overflow = 'hidden';
            // Update backup UI (show/hide restore button)
            updateBackupUI();
            // Focus the textarea for immediate pasting
            const pasteInput = document.getElementById('pasteInput');
            if (pasteInput) {
                setTimeout(() => pasteInput.focus(), 100);
            }
        }
    }

    function closeImportModal() {
        if (importModal) {
            importModal.classList.remove('visible');
            document.body.style.overflow = '';

            // Reset legal consent checkbox when closing modal
            const legalConsentCheckbox = document.getElementById('legalConsentCheckbox');
            if (legalConsentCheckbox) {
                legalConsentCheckbox.checked = false;
            }
        }
    }

    if (openImportBtn) {
        openImportBtn.addEventListener('click', openImportModal);
    }

    if (closeImportBtn) {
        closeImportBtn.addEventListener('click', closeImportModal);
    }

    // Close modal on backdrop click
    if (importModal) {
        importModal.addEventListener('click', (e) => {
            if (e.target === importModal) {
                closeImportModal();
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && importModal && importModal.classList.contains('visible')) {
            closeImportModal();
        }
    });

    // Download offline button
    const btnDownloadOffline = document.querySelector('.btn-download-offline');
    if (btnDownloadOffline) {
        btnDownloadOffline.addEventListener('click', downloadHtmlFile);
    }

    // Demo buttons (handle multiple on page)
    document.querySelectorAll('.btn-demo').forEach(btn => {
        btn.addEventListener('click', () => {
            closeImportModal(); // Close modal if open
            loadDemoData();
        });
    });

    // Generate button
    const btnGenerate = document.getElementById('generateBtn');
    if (btnGenerate) {
        btnGenerate.addEventListener('click', parseAndGenerate);
    }

    // Load JSON text button
    const btnLoadJsonText = document.querySelector('.btn-text-alt');
    if (btnLoadJsonText) {
        btnLoadJsonText.addEventListener('click', () => {
            document.getElementById('jsonFileInput').click();
        });
    }

    // Demo regenerate button
    const btnDemoRegen = document.querySelector('.demo-regenerate-btn');
    if (btnDemoRegen) {
        btnDemoRegen.addEventListener('click', cycleNextScenario);
    }

    // Demo banner close button
    const btnDemoBannerClose = document.querySelector('.demo-banner-close');
    if (btnDemoBannerClose) {
        btnDemoBannerClose.addEventListener('click', () => {
            document.getElementById('demoBanner').classList.add('hidden');
        });
    }

    // Dashboard view mode buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => setViewMode(btn.dataset.view));
    });

    // Dashboard theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });

    // Save data button
    const btnSaveData = document.querySelector('.btn-save-data');
    if (btnSaveData) {
        btnSaveData.addEventListener('click', downloadData);
    }

    // Start over button with confirmation (#20, #142)
    const btnStartOver = document.querySelector('.btn-start-over');
    if (btnStartOver) {
        btnStartOver.addEventListener('click', () => {
            const backup = loadBackup();
            const backupMsg = backup
                ? '\n\nNote: A backup was saved and can be restored later.'
                : '';

            if (confirm(`Start over? This will clear your current data.${backupMsg}\n\nYou can save your data first using the "Save Data" button.`)) {
                resetDashboard();
                // Don't clear backup - let user restore if needed
            }
        });
    }

    // Footer Security & Privacy link (#144)
    const footerSecurityLink = document.getElementById('footerSecurityLink');
    if (footerSecurityLink) {
        footerSecurityLink.addEventListener('click', (e) => {
            e.preventDefault();
            setTab('help');
            setTimeout(() => {
                const securitySection = document.getElementById('security-privacy-section');
                if (securitySection) {
                    securitySection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 100); // Small delay to ensure tab is rendered
        });
    }

    // Import modal "How to verify" link (#144)
    const importModalVerifyLink = document.getElementById('importModalVerifyLink');
    if (importModalVerifyLink) {
        importModalVerifyLink.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = document.getElementById('importModal');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('visible');
            }
            setTab('help');
            setTimeout(() => {
                const securitySection = document.getElementById('security-privacy-section');
                if (securitySection) {
                    securitySection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 100);
        });
    }

    // JSON file input
    const jsonFileInput = document.getElementById('jsonFileInput');
    if (jsonFileInput) {
        jsonFileInput.addEventListener('change', loadJsonFile);
    }

    // Restore backup button (#142)
    const restoreBackupBtn = document.getElementById('restoreBackupBtn');
    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener('click', restoreFromBackup);
    }

    // Custom rate slider
    // #149: Debounced to prevent chart rebuild on every pixel of drag (was 10-15 rebuilds per adjustment)
    const customRateSlider = document.getElementById('customRateSlider');
    if (customRateSlider) {
        const debouncedUpdateCustomRate = debounce(updateCustomRate, 100);
        customRateSlider.addEventListener('input', debouncedUpdateCustomRate);
    }

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => setTab(btn.dataset.tab));
    });

    // Main chart type buttons
    document.querySelectorAll('.chart-type-btn[data-chart]').forEach(btn => {
        const chartType = btn.dataset.chart;
        if (chartType && ['line', 'area', 'bar', 'step'].includes(chartType)) {
            btn.addEventListener('click', () => setChartType(chartType));
        } else if (chartType && ['yoy-bar', 'yoy-line'].includes(chartType)) {
            btn.addEventListener('click', () => setYoyChartType(chartType.replace('yoy-', '')));
        }
    });

    // Projection years buttons
    document.querySelectorAll('.interval-btn[data-years]').forEach(btn => {
        btn.addEventListener('click', () => setProjectionYears(parseInt(btn.dataset.years, 10)));
    });

    // Projection view buttons
    document.querySelectorAll('.chart-type-btn[data-view]').forEach(btn => {
        btn.addEventListener('click', () => setProjectionView(btn.dataset.view));
    });

    // Paste input textarea
    const pasteInput = document.getElementById('pasteInput');
    if (pasteInput) {
        pasteInput.addEventListener('input', validatePasteInput);
    }

    // Legal consent checkbox
    const legalConsentCheckbox = document.getElementById('legalConsentCheckbox');
    if (legalConsentCheckbox) {
        legalConsentCheckbox.addEventListener('change', validatePasteInput);
    }
}

// Initialize from URL on page load (only in browser, not during tests)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Global error handler for unhandled promise rejections (#56)
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        showUserMessage('An unexpected error occurred. Please refresh the page.', 'error');
        event.preventDefault();
    });

    initFromUrl();

    // Update backup UI on page load (#142)
    updateBackupUI();

    // Initialize event listeners when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEventListeners);
    } else {
        initEventListeners();
    }
}

// Export functions for testing (ES Modules)
export {
    // Parser functions
    parsePaylocityData,
    parseRecord,
    validateSalaryRange,
    escapeHTML,

    // Calculation functions
    calculateCAGR,
    calculateInflationOverPeriod,
    calculateRealGrowth,
    calculateInflationAdjustedSalary,

    // Helper functions
    calculateYearsOfService,
    getStartingSalary,
    getCurrentSalary,

    // Constants
    CONSTANTS
};
