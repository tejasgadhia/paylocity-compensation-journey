// ========================================
// VIEW MODE FUNCTIONS MODULE
// ========================================

import { getCurrentSalary } from './calculations.js';
import { updateMainChartData, updateProjectionChartData } from './charts.js';

// ========================================
// MODULE STATE (injected via initView)
// ========================================

let _state, _charts, _getEmployeeData, _formatCurrency, _buildHistoryTable, _updateAnalytics, _updateStory, _buildProjectionTable, _updateUrlParams;

/**
 * Initializes the view module with required dependencies.
 * Must be called once before using any view functions.
 *
 * @param {Object} deps - Dependencies to inject
 * @param {Object} deps.state - UI state object
 * @param {Object} deps.charts - Chart.js instances storage
 * @param {Function} deps.getEmployeeData - Function that returns employee data
 * @param {Function} deps.formatCurrency - Function to format currency values
 * @param {Function} deps.buildHistoryTable - Function to build history table
 * @param {Function} deps.updateAnalytics - Function to update analytics display
 * @param {Function} deps.updateStory - Function to update story content
 * @param {Function} deps.buildProjectionTable - Function to build projection table
 * @param {Function} deps.updateUrlParams - Function to update URL parameters
 */
export function initView({ state, charts, getEmployeeData, formatCurrency, buildHistoryTable, updateAnalytics, updateStory, buildProjectionTable, updateUrlParams }) {
    _state = state;
    _charts = charts;
    _getEmployeeData = getEmployeeData;
    _formatCurrency = formatCurrency;
    _buildHistoryTable = buildHistoryTable;
    _updateAnalytics = updateAnalytics;
    _updateStory = updateStory;
    _buildProjectionTable = buildProjectionTable;
    _updateUrlParams = updateUrlParams;
}

/**
 * Sets the view mode (dollars vs index) and updates all displays.
 *
 * @param {string} mode - View mode ('dollars' or 'index')
 * @returns {void}
 *
 * @example
 * setViewMode('dollars'); // Show actual dollar amounts
 * setViewMode('index');   // Show indexed values (privacy mode)
 */
export function setViewMode(mode) {
    _state.showDollars = (mode === 'dollars');

    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        const isActive = btn.dataset.view === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });

    updateAllDisplays();
    _updateUrlParams();
}

/**
 * Toggles between dollars and index view modes.
 * Convenience function for keyboard shortcut.
 *
 * @returns {void}
 */
export function togglePrivacy() {
    // Toggle for keyboard shortcut
    setViewMode(_state.showDollars ? 'index' : 'dollars');
}

/**
 * Updates all salary displays throughout the application.
 * Called after view mode changes to refresh all visible values.
 *
 * @returns {void}
 */
export function updateAllDisplays() {
    const employeeData = _getEmployeeData();
    const current = getCurrentSalary(employeeData);

    document.getElementById('currentSalary').textContent = _state.showDollars
        ? _formatCurrency(current)
        : `Index: ${_formatCurrency(current, false)}`;

    document.getElementById('currentSalaryIndexed').textContent = _state.showDollars
        ? `Index: ${_formatCurrency(current, false)}`
        : `Base 100 = Starting salary`;

    _buildHistoryTable();
    _updateAnalytics();
    _updateStory();
    updateMainChartData();  // #150: Use update() instead of destroy/rebuild for better performance
    if (_charts.projection) {
        updateProjectionChartData();  // #150: Use update() for better performance
        _buildProjectionTable();
    }
}
