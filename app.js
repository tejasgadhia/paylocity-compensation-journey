/**
 * Global type declarations for external libraries
 * Chart.js is loaded globally via script tag in index.html
 * @global
 */
/* global Chart */

// ========================================
// IMPORTS
// ========================================

import { CONSTANTS } from './js/constants.js';
import {
    calculateInflationAdjustedSalary,
    getStartingSalary,
    getCurrentSalary,
    calculateYearsOfService,
    calculateCAGR,
    calculateAverageMonthsBetweenDates,
    formatDateSummary,
    formatDateDetail
} from './js/calculations.js';
import {
    validateSalaryRange,
    parseRecord,
    parsePaylocityData
} from './js/parser.js';
import {
    initCharts,
    updateMainChartType,
    updateYoyChartType,
    buildMainChart,
    buildYoyChart,
    buildProjectionChart,
    updateProjectionChartData
} from './js/charts.js';
import {
    showUserMessage,
    checkCPIDataFreshness
} from './js/notifications.js';
// Phase 2: Demo data module is dynamically imported (#180)
// import { initDemoData, loadDemoData, cycleNextScenario } from './js/demo-data.js';
import {
    initTheme,
    setTheme
} from './js/theme.js';
import {
    initView,
    setViewMode,
    togglePrivacy
} from './js/view.js';
// Phase 2: I/O module is dynamically imported (#180)
// import { initIO, downloadHtmlFile, loadJsonFile, downloadData } from './js/io.js';
import {
    initDataPersistence,
    saveBackup,
    loadBackup,
    updateBackupUI,
    restoreFromBackup
} from './js/data-persistence.js';
import {
    initKeyboard,
    setupKeyboardShortcuts
} from './js/keyboard.js';
import {
    initNavigation,
    setTab,
    updateUrlParams,
    initFromUrl,
    resetRenderedTabs,
    VALID_TABS
} from './js/navigation.js';
import {
    initContent,
    formatCurrency,
    formatPercent,
    updateStory,
    updateMarket
} from './js/content.js';
import {
    initEventHandlers,
    initEventListeners
} from './js/event-handlers.js';

// ========================================
// DESKTOP BLOCK OVERLAY (#146)
// ========================================

// Only run viewport detection in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    (function() {
        let viewportCheckTimeout;

        function checkViewportSupport() {
            const overlay = document.getElementById('desktopBlockOverlay');
            const widthDisplay = document.getElementById('currentViewportWidth');
            const currentWidth = window.innerWidth;

            // Update displayed width
            if (widthDisplay) {
                widthDisplay.textContent = currentWidth + 'px';
            }

            if (currentWidth >= CONSTANTS.MIN_VIEWPORT_WIDTH) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        // Debounced resize handler
        window.addEventListener('resize', function() {
            clearTimeout(viewportCheckTimeout);
            viewportCheckTimeout = setTimeout(checkViewportSupport, 100);
        });

        // Initial check
        checkViewportSupport();
    })();
}

// ========================================
// STATE MANAGEMENT
// ========================================

/**
 * Application state - simple globals appropriate for this app's complexity.
 *
 * Why globals instead of a state management library?
 * - Single-page app with no routing complexity
 * - State accessed by ~10 modules makes prop-drilling impractical
 * - No server sync, undo/redo, or time-travel debugging needs
 * - Dependency injection via init functions provides testability
 *
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

// ========================================
// PHASE 2: LAZY-LOADED MODULES (#180)
// ========================================

/**
 * Demo data module - loaded on first use (View Demo button, URL ?demo=true)
 * Saves ~200 lines from initial bundle
 */
let demoDataModule = null;

async function getDemoDataModule() {
    if (!demoDataModule) {
        try {
            demoDataModule = await import('./js/demo-data.js');
            demoDataModule.initDemoData({
                state,
                charts,
                getEmployeeData: () => employeeData,
                setEmployeeData: (data) => { employeeData = data; },
                showDashboard: () => showDashboard(),
                updateUrlParams: () => updateUrlParams(),
                loadChartJS: () => loadChartJS()
            });
        } catch (error) {
            console.error('Failed to load demo module:', error);
            showUserMessage('Failed to load demo. Please refresh the page.', 'error');
            throw error;
        }
    }
    return demoDataModule;
}

async function loadDemoData(scenarioIndex = null) {
    const module = await getDemoDataModule();
    return module.loadDemoData(scenarioIndex);
}

async function cycleNextScenario() {
    const module = await getDemoDataModule();
    return module.cycleNextScenario();
}

/**
 * I/O module - loaded on first use (Save Data, Load JSON, Download Offline)
 * Includes crypto for AES-256-GCM encryption - saves ~400 lines from initial bundle
 */
let ioModule = null;

async function getIOModule() {
    if (!ioModule) {
        try {
            ioModule = await import('./js/io.js');
            ioModule.initIO({
                getEmployeeData: () => employeeData,
                setEmployeeData: (data) => { employeeData = data; },
                showDashboard: () => showDashboard(),
                updateUrlParams: () => updateUrlParams(),
                saveBackup: () => saveBackup()
            });
        } catch (error) {
            console.error('Failed to load I/O module:', error);
            showUserMessage('Failed to load save/export feature. Please refresh the page.', 'error');
            throw error;
        }
    }
    return ioModule;
}

async function downloadHtmlFile() {
    const module = await getIOModule();
    return module.downloadHtmlFile();
}

async function loadJsonFile(event) {
    const module = await getIOModule();
    return module.loadJsonFile(event);
}

async function downloadData() {
    const module = await getIOModule();
    return module.downloadData();
}

// Initialize charts module with dependencies
initCharts({
    state,
    charts,
    getEmployeeData: () => employeeData,
    showUserMessage
});

// Demo data module is now lazy-loaded (#180)
// initDemoData() is called inside getDemoDataModule() on first use

// Initialize theme module with dependencies
initTheme({
    state,
    charts,
    getEmployeeData: () => employeeData,
    updateStory: () => updateStory(),
    updateUrlParams: () => updateUrlParams()
});

// Initialize view module with dependencies
initView({
    state,
    charts,
    getEmployeeData: () => employeeData,
    formatCurrency: (amount, showDollars) => formatCurrency(amount, showDollars),
    buildHistoryTable: () => buildHistoryTable(),
    updateAnalytics: () => updateAnalytics(),
    updateStory: () => updateStory(),
    buildProjectionTable: () => buildProjectionTable(),
    updateUrlParams: () => updateUrlParams()
});

// I/O module is now lazy-loaded (#180)
// initIO() is called inside getIOModule() on first use

// Initialize data persistence module with dependencies
initDataPersistence({
    getEmployeeData: () => employeeData,
    setEmployeeData: (data) => { employeeData = data; },
    showDashboard: () => showDashboard(),
    updateUrlParams: () => updateUrlParams(),
    getDomCache: () => domCache
});

// Initialize keyboard module with dependencies
// Note: setTab is now imported from navigation.js
initKeyboard({
    getEmployeeData: () => employeeData,
    setTab: (tabId) => setTab(tabId),
    setTheme,
    togglePrivacy,
    state
});

// Initialize navigation module with dependencies
initNavigation({
    state,
    getEmployeeData: () => employeeData,
    updateMarket: () => updateMarket(),
    buildYoyChart,
    initProjections: () => initProjections(),
    buildProjectionChart,
    buildProjectionTable: () => buildProjectionTable(),
    setTheme,
    setViewMode,
    loadDemoData,
    charts,
    // Phase 1: Lazy tab rendering deps (#181)
    buildHistoryTable: () => buildHistoryTable(),
    updateStory: () => updateStory()
});

// Initialize content module with dependencies
initContent({
    state,
    getEmployeeData: () => employeeData
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

    // Check if CPI data is stale and show warning if needed
    checkCPIDataFreshness();
}

function resetDashboard() {
    // Destroy all charts
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    charts = { main: null, yoy: null, projection: null };

    // Reset lazy rendering tracker (#181)
    resetRenderedTabs();

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
// CONTENT RENDERING (Moved to js/content.js)
// ========================================
// storyContent, formatCurrency, formatPercent, detectMilestones, updateStory,
// updateMarket, buildInflationAnalysis, buildMilestones, buildMarketComparison
// moved to js/content.js

// ========================================
// TAB FUNCTIONS (Moved to js/navigation.js)
// ========================================
// setTab, handleTabFromUrl, checkInitialHash moved to js/navigation.js

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

        if (VALID_TABS.includes(tab)) {
            setTab(tab, false); // false = don't push another history entry
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

    // Only render Home tab content immediately (#181)
    // Story, History, Market, Analytics, Projections are lazy-loaded on first tab visit
    buildMainChart();
    updateAnalytics();
}

// ========================================
// URL PARAMETER HANDLING (Moved to js/navigation.js)
// ========================================
// updateUrlParams, getUrlParams, initFromUrl moved to js/navigation.js

// Initialize event handlers module with dependencies
initEventHandlers({
    setDomCache: (cache) => { domCache = cache; },
    setTheme,
    setViewMode,
    setTab,
    loadDemoData,
    cycleNextScenario,
    downloadHtmlFile,
    loadJsonFile,
    downloadData,
    saveBackup,
    loadBackup,
    updateBackupUI,
    restoreFromBackup,
    parseAndGenerate,
    validatePasteInput,
    resetDashboard,
    setChartType,
    setYoyChartType,
    setProjectionYears,
    setProjectionView,
    updateCustomRate,
    debounce
});

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
        document.addEventListener('DOMContentLoaded', () => {
            initEventListeners();
            setupKeyboardShortcuts();
        });
    } else {
        initEventListeners();
        setupKeyboardShortcuts();
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
    calculateInflationAdjustedSalary,

    // Helper functions
    calculateYearsOfService,
    getStartingSalary,
    getCurrentSalary,

    // Constants
    CONSTANTS
};
