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
import { escapeHTML } from './js/security.js';
import { debounce } from './js/utils.js';
import {
    initTables,
    buildHistoryTable,
    buildProjectionTable,
    getBadgeClass
} from './js/tables.js';
import {
    initProjectionsModule,
    initProjections,
    setChartType,
    setYoyChartType,
    setProjectionYears,
    setProjectionView,
    updateCustomRate
} from './js/projections.js';
import {
    initValidation,
    parseAndGenerate,
    validatePasteInput
} from './js/validation.js';
import {
    initDashboardModule,
    showDashboard,
    resetDashboard,
    initDashboard,
    updateAnalytics
} from './js/dashboard.js';

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

// Initialize tables module with dependencies
initTables({
    state,
    getEmployeeData: () => employeeData,
    escapeHTML,
    formatCurrency: (amount, showDollars) => formatCurrency(amount, showDollars),
    getStartingSalary,
    getCurrentSalary,
    calculateCAGR
});

// Initialize projections module with dependencies
initProjectionsModule({
    state,
    getEmployeeData: () => employeeData,
    updateMainChartType,
    updateYoyChartType,
    updateProjectionChartData,
    buildProjectionTable: () => buildProjectionTable()
});

// Initialize validation module with dependencies
initValidation({
    setEmployeeData: (data) => { employeeData = data; },
    getDomCache: () => domCache,
    showDashboard: () => showDashboard(),
    updateUrlParams: () => updateUrlParams(),
    saveBackup: () => saveBackup(),
    loadChartJS: () => loadChartJS(),
    showUserMessage
});

// Initialize dashboard module with dependencies
initDashboardModule({
    state,
    charts,
    getEmployeeData: () => employeeData,
    setEmployeeData: (data) => { employeeData = data; },
    getDomCache: () => domCache,
    setTab: (tabId, pushHistory) => setTab(tabId, pushHistory),
    resetRenderedTabs,
    buildMainChart,
    formatCurrency: (amount, showDollars) => formatCurrency(amount, showDollars),
    formatPercent,
    checkCPIDataFreshness
});

// ========================================
// BENCHMARK CALCULATION FUNCTIONS
// ========================================
// All calculation functions moved to js/calculations.js for better modularity and testability

// ========================================
// SECURITY HELPERS
// ========================================
// escapeHTML moved to js/security.js
// validateTemplateData moved to js/security.js

// ========================================
// PARSER
// ========================================
// (Moved to js/parser.js - imported above)

// ========================================
// UTILITY FUNCTIONS
// ========================================
// debounce moved to js/utils.js

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
// PARSE AND GENERATE (Moved to js/validation.js)
// ========================================
// parseAndGenerate, validatePasteInput moved to js/validation.js

// ========================================
// VIEW SWITCHING (Moved to js/dashboard.js)
// ========================================
// showDashboard, resetDashboard moved to js/dashboard.js

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
// CHART FUNCTIONS (Moved to js/projections.js)
// ========================================
// setChartType, setYoyChartType, initProjections moved to js/projections.js
// Chart build functions moved to js/charts.js

// ========================================
// TABLE FUNCTIONS (Moved to js/tables.js)
// ========================================
// buildHistoryTable, getBadgeClass, buildProjectionTable moved to js/tables.js

// ========================================
// ANALYTICS UPDATE (Moved to js/dashboard.js)
// ========================================
// updateAnalytics moved to js/dashboard.js

// ========================================
// PROJECTION CONTROLS (Moved to js/projections.js)
// ========================================
// setProjectionYears, updateCustomRate, setProjectionView moved to js/projections.js

// ========================================
// DASHBOARD INITIALIZATION (Moved to js/dashboard.js)
// ========================================
// initDashboard moved to js/dashboard.js

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
