/**
 * Demo Data Module
 * Handles demo scenarios for showcasing the compensation journey dashboard
 * without requiring actual Paylocity data.
 */

import { VALID_TABS } from './constants.js';

// ========================================
// DEMO SCENARIOS
// ========================================

export const DEMO_SCENARIOS = [
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

// ========================================
// PRIVATE MODULE STATE (set via init)
// ========================================

let _state;
let _charts;
let _getEmployeeData;
let _setEmployeeData;
let _showDashboard;
let _updateUrlParams;
let _loadChartJS;

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize the demo data module with dependencies from app.js
 * @param {Object} deps - Dependencies object
 * @param {Object} deps.state - Application state object
 * @param {Object} deps.charts - Charts object for chart instances
 * @param {Function} deps.getEmployeeData - Getter for employeeData
 * @param {Function} deps.setEmployeeData - Setter for employeeData
 * @param {Function} deps.showDashboard - Function to display dashboard
 * @param {Function} deps.updateUrlParams - Function to update URL parameters
 * @param {Function} deps.loadChartJS - Function to lazy-load Chart.js
 */
export function initDemoData({ state, charts, getEmployeeData, setEmployeeData, showDashboard, updateUrlParams, loadChartJS }) {
    _state = state;
    _charts = charts;
    _getEmployeeData = getEmployeeData;
    _setEmployeeData = setEmployeeData;
    _showDashboard = showDashboard;
    _updateUrlParams = updateUrlParams;
    _loadChartJS = loadChartJS;
}

// ========================================
// DEMO DATA FUNCTIONS
// ========================================

/**
 * Load demo data for the specified scenario
 * @param {number|null} scenarioIndex - Index of scenario to load (0-3), or null to use current state
 */
export async function loadDemoData(scenarioIndex = null) {
    // If no valid index provided, use current state index
    // Note: When used as event handler, scenarioIndex receives Event object
    if (typeof scenarioIndex !== 'number') {
        scenarioIndex = _state.currentScenarioIndex;
    } else {
        _state.currentScenarioIndex = scenarioIndex;
    }

    // #79 fix: Preserve tab from URL before it gets overwritten
    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get('tab');
    if (initialTab && VALID_TABS.includes(initialTab)) {
        _state.currentTab = initialTab;
    }

    const scenario = DEMO_SCENARIOS[scenarioIndex];

    _setEmployeeData({
        hireDate: scenario.hireDate,
        currentDate: scenario.currentDate,
        records: [...scenario.records], // Clone to prevent mutation
        isDemo: true,
        scenarioId: scenario.id
    });

    // Lazy-load Chart.js before showing dashboard (performance optimization)
    await _loadChartJS();

    _showDashboard();

    // Update demo banner
    document.getElementById('demoBanner').classList.remove('hidden');
    updateScenarioLabel();

    // Update URL (now preserves the tab since state.currentTab was set above)
    _updateUrlParams();
}

/**
 * Cycle to the next demo scenario
 * Wraps around to the first scenario after reaching the last
 */
export async function cycleNextScenario() {
    // Move to next scenario (wrap around)
    _state.currentScenarioIndex = (_state.currentScenarioIndex + 1) % DEMO_SCENARIOS.length;

    // Destroy existing charts before regenerating
    Object.values(_charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    // Reset charts object (note: this modifies the shared reference)
    _charts.main = null;
    _charts.yoy = null;
    _charts.projection = null;

    // Load the new scenario
    await loadDemoData(_state.currentScenarioIndex);
}

/**
 * Update the scenario label in the demo banner
 */
export function updateScenarioLabel() {
    const scenario = DEMO_SCENARIOS[_state.currentScenarioIndex];
    const label = document.getElementById('scenarioLabel');
    if (label) {
        label.textContent = `Scenario ${scenario.id}: ${scenario.name} (${scenario.description})`;
    }
}
