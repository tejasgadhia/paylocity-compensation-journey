/**
 * Dashboard Lifecycle Module
 *
 * Manages dashboard initialization, display, and reset.
 * Uses dependency injection for testability.
 */

import { CONSTANTS } from './constants.js';
import {
    getCurrentSalary,
    getStartingSalary,
    calculateYearsOfService,
    calculateCAGR,
    formatDateSummary,
    calculateAverageMonthsBetweenDates
} from './calculations.js';

// ========================================
// MODULE STATE (injected via init)
// ========================================

let _state;
let _charts;
let _getEmployeeData;
let _getDomCache;
let _setTab;
let _resetRenderedTabs;
let _buildMainChart;
let _formatCurrency;
let _formatPercent;
let _checkCPIDataFreshness;

/**
 * Initialize the dashboard module with dependencies.
 *
 * @param {Object} deps - Dependencies
 * @param {Object} deps.state - Application state
 * @param {Object} deps.charts - Chart.js instances
 * @param {Function} deps.getEmployeeData - Function to get employee data
 * @param {Function} deps.setEmployeeData - Function to set employee data
 * @param {Function} deps.getDomCache - Function to get DOM cache
 * @param {Function} deps.setTab - Function to set active tab
 * @param {Function} deps.resetRenderedTabs - Function to reset lazy rendering tracker
 * @param {Function} deps.buildMainChart - Function to build main chart
 * @param {Function} deps.formatCurrency - Currency formatting function
 * @param {Function} deps.formatPercent - Percent formatting function
 * @param {Function} deps.checkCPIDataFreshness - Check CPI data freshness
 */
export function initDashboardModule({
    state,
    charts,
    getEmployeeData,
    setEmployeeData,
    getDomCache,
    setTab,
    resetRenderedTabs,
    buildMainChart,
    formatCurrency,
    formatPercent,
    checkCPIDataFreshness
}) {
    _state = state;
    _charts = charts;
    _getEmployeeData = getEmployeeData;
    _getDomCache = getDomCache;
    _setTab = setTab;
    _resetRenderedTabs = resetRenderedTabs;
    _buildMainChart = buildMainChart;
    _formatCurrency = formatCurrency;
    _formatPercent = formatPercent;
    _checkCPIDataFreshness = checkCPIDataFreshness;

    // Store setEmployeeData for resetDashboard
    _setEmployeeData = setEmployeeData;
}

// Private reference for resetDashboard
let _setEmployeeData;

// ========================================
// DASHBOARD DISPLAY
// ========================================

/**
 * Shows the dashboard and initializes all components.
 *
 * Hides landing page, shows dashboard, initializes KPIs,
 * and handles focus management for accessibility.
 */
export function showDashboard() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    window.scrollTo(0, 0);
    initDashboard();

    // If a non-home tab was specified (e.g., from URL), switch to it immediately
    if (_state.currentTab && _state.currentTab !== 'home') {
        _setTab(_state.currentTab, false);
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
    _checkCPIDataFreshness();
}

/**
 * Resets the dashboard to initial state.
 *
 * Destroys all charts, clears employee data, resets state,
 * updates URL, and shows the landing page.
 */
export function resetDashboard() {
    // Destroy all charts
    Object.values(_charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    // Reset chart references
    _charts.main = null;
    _charts.yoy = null;
    _charts.projection = null;

    // Reset lazy rendering tracker (#181)
    _resetRenderedTabs();

    // Reset state
    _state.currentTab = 'home';
    _setEmployeeData(null);

    // Update URL - keep theme, remove demo
    const params = new URLSearchParams();
    params.set('theme', _state.theme);
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
// DASHBOARD INITIALIZATION
// ========================================

/**
 * Initializes the main dashboard with KPI cards and summary statistics.
 *
 * Calculates and displays current salary, total growth percentage, tenure,
 * adjustment count, CAGR, and real (inflation-adjusted) growth. Populates
 * the Home tab KPI cards. Called after parsing data or loading demo.
 *
 * @returns {void}
 */
export function initDashboard() {
    const employeeData = _getEmployeeData();
    if (!employeeData) return;

    const current = getCurrentSalary(employeeData);
    const start = getStartingSalary(employeeData);
    const growth = ((current - start) / start) * 100;
    const years = calculateYearsOfService(employeeData);

    // Exclude "New Hire" from adjustment counts - it's the starting point, not an adjustment
    const adjustments = employeeData.records.filter(r => r.reason !== 'New Hire');
    const adjustmentCount = adjustments.length;

    document.getElementById('currentSalary').textContent = _formatCurrency(current);
    document.getElementById('currentSalaryIndexed').textContent = `Index: ${_formatCurrency(current, false)}`;
    document.getElementById('totalGrowth').textContent = `+${growth.toFixed(0)}%`;
    document.getElementById('yearsService').textContent = years.toFixed(1);
    document.getElementById('hireDateText').textContent = `Since ${formatDateSummary(employeeData.hireDate)}`;
    document.getElementById('totalRaises').textContent = adjustmentCount;
    document.getElementById('avgRaisesPerYear').textContent = `Avg: ${(adjustmentCount / years).toFixed(1)} per year`;

    // Only render Home tab content immediately (#181)
    // Story, History, Market, Analytics, Projections are lazy-loaded on first tab visit
    _buildMainChart();
    updateAnalytics();
}

// ========================================
// ANALYTICS UPDATE
// ========================================

/**
 * Updates the analytics tab with calculated statistics.
 *
 * Computes and displays:
 * - CAGR
 * - Average/median/largest raise percentages
 * - Average time between raises
 * - Merit increase count and percentage
 */
export function updateAnalytics() {
    const employeeData = _getEmployeeData();
    if (!employeeData) return;

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

    document.getElementById('cagr').textContent = _formatPercent(calculateCAGR(employeeData));
    document.getElementById('avgRaise').textContent = _formatPercent(avgRaisePercent);

    const avgRaiseDollar = (avgRaisePercent / 100) * getCurrentSalary(employeeData);
    const state = _state; // Local reference for showDollars check
    document.getElementById('avgRaiseDollar').textContent = state.showDollars
        ? `~${_formatCurrency(avgRaiseDollar)} per adjustment`
        : `~${((avgRaiseDollar / startingSalary) * 100).toFixed(1)} index points`;

    document.getElementById('medianRaise').textContent = _formatPercent(medianRaise);
    document.getElementById('largestRaise').textContent = _formatPercent(largestRaise);
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
