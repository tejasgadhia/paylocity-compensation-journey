// ========================================
// NAVIGATION MODULE
// ========================================

import { VALID_TABS } from './constants.js';

// Module-level dependencies (injected via initNavigation)
let _state;
let _getEmployeeData;
let _updateMarket;
let _buildYoyChart;
let _initProjections;
let _buildProjectionChart;
let _buildProjectionTable;
let _setTheme;
let _setViewMode;
let _loadDemoData;
let _charts;
// Phase 1: Lazy tab rendering deps (#181)
let _buildHistoryTable;
let _updateStory;

// Track which tabs have been rendered (Home pre-rendered on dashboard init)
let _renderedTabs = new Set(['home']);

/**
 * Initializes the navigation module with required dependencies.
 * Must be called before using any navigation functions.
 *
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.state - Application state object
 * @param {Function} deps.getEmployeeData - Function to get current employee data
 * @param {Function} deps.updateMarket - Function to update market tab content
 * @param {Function} deps.buildYoyChart - Function to build YoY analytics chart
 * @param {Function} deps.initProjections - Function to initialize projection controls
 * @param {Function} deps.buildProjectionChart - Function to build projection chart
 * @param {Function} deps.buildProjectionTable - Function to build projection table
 * @param {Function} deps.setTheme - Function to set application theme
 * @param {Function} deps.setViewMode - Function to set view mode (dollars/index)
 * @param {Function} deps.loadDemoData - Function to load demo data
 * @param {Object} deps.charts - Charts object reference
 * @param {Function} deps.buildHistoryTable - Function to build history table (#181)
 * @param {Function} deps.updateStory - Function to update story content (#181)
 */
export function initNavigation({
    state,
    getEmployeeData,
    updateMarket,
    buildYoyChart,
    initProjections,
    buildProjectionChart,
    buildProjectionTable,
    setTheme,
    setViewMode,
    loadDemoData,
    charts,
    buildHistoryTable,
    updateStory
}) {
    _state = state;
    _getEmployeeData = getEmployeeData;
    _updateMarket = updateMarket;
    _buildYoyChart = buildYoyChart;
    _initProjections = initProjections;
    _buildProjectionChart = buildProjectionChart;
    _buildProjectionTable = buildProjectionTable;
    _setTheme = setTheme;
    _setViewMode = setViewMode;
    _loadDemoData = loadDemoData;
    _charts = charts;
    _buildHistoryTable = buildHistoryTable;
    _updateStory = updateStory;
}

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
export function setTab(tabId, pushHistory = true) {
    _state.currentTab = tabId;

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

    // Lazy render on first visit (#181)
    if (!_renderedTabs.has(tabId)) {
        _renderedTabs.add(tabId);
        renderTabContent(tabId);
    }
}

/**
 * Renders tab-specific content on first visit.
 * Uses setTimeout to allow UI thread to update first.
 * @private
 * @param {string} tabId - Tab identifier
 */
function renderTabContent(tabId) {
    setTimeout(() => {
        switch(tabId) {
            case 'story':
                _updateStory();
                break;
            case 'market':
                _updateMarket();
                break;
            case 'history':
                _buildHistoryTable();
                break;
            case 'analytics':
                if (!_charts.yoy) _buildYoyChart();
                break;
            case 'projections':
                if (!_charts.projection) {
                    _initProjections();
                    _buildProjectionChart();
                    _buildProjectionTable();
                }
                break;
        }
    }, 50);
}

/**
 * Handles tab navigation from URL parameters.
 * Called on initial page load and browser navigation events.
 * @internal
 */
function handleTabFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const employeeData = _getEmployeeData();
    if (tab && VALID_TABS.includes(tab) && employeeData) {
        setTab(tab, false); // false = don't push history (initial load)
    }
}

/**
 * Checks for tab specification in URL on initial dashboard load.
 * Uses a small delay to ensure dashboard is fully rendered.
 */
export function checkInitialHash() {
    setTimeout(handleTabFromUrl, 100);
}

/**
 * Update URL parameters to reflect current state.
 *
 * @param {boolean} [pushHistory=false] - If true, create new history entry (for back/forward nav).
 *                                        If false, replace current entry (for non-navigation updates).
 */
export function updateUrlParams(pushHistory = false) {
    const params = new URLSearchParams();
    const employeeData = _getEmployeeData();

    // Always include theme
    params.set('theme', _state.theme);

    // Include view mode (only if not default 'dollars')
    if (!_state.showDollars) {
        params.set('view', 'index');
    }

    // Include demo flag if in demo mode
    if (employeeData && employeeData.isDemo) {
        params.set('demo', 'true');
    }

    // Include tab if on dashboard and not home
    if (!document.getElementById('dashboardPage').classList.contains('hidden') && _state.currentTab !== 'home') {
        params.set('tab', _state.currentTab);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;

    if (pushHistory) {
        history.pushState({ tab: _state.currentTab }, '', newUrl);
    } else {
        history.replaceState({ tab: _state.currentTab }, '', newUrl);
    }
}

/**
 * Parses URL parameters into an object.
 *
 * @returns {Object} Parsed URL parameters
 * @returns {string|null} return.theme - Theme name or null
 * @returns {boolean} return.demo - Whether demo mode is enabled
 * @returns {string|null} return.tab - Tab name or null
 * @returns {string|null} return.view - View mode or null
 */
export function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        theme: params.get('theme'),
        demo: params.get('demo') === 'true',
        tab: params.get('tab'),
        view: params.get('view')
    };
}

/**
 * Initializes application state from URL parameters on page load.
 * Handles theme, view mode, tab selection, and demo mode.
 */
export function initFromUrl() {
    const params = getUrlParams();

    // Apply theme from URL if specified
    if (params.theme && (params.theme === 'tactical' || params.theme === 'artistic')) {
        _setTheme(params.theme);
    }

    // Apply view mode from URL if specified
    if (params.view === 'index') {
        _setViewMode('index');
    }

    // Set tab from URL BEFORE loading demo (so showDashboard can use it)
    if (params.tab && VALID_TABS.includes(params.tab)) {
        _state.currentTab = params.tab;
    }

    // Auto-load demo if specified
    if (params.demo) {
        _loadDemoData();
    }
}

/**
 * Resets the rendered tabs tracker.
 * Called when dashboard is reset (Start Over) to ensure tabs re-render on next visit.
 * @export
 */
export function resetRenderedTabs() {
    _renderedTabs = new Set(['home']);
}

// Export VALID_TABS for use by event handlers in app.js
export { VALID_TABS };
