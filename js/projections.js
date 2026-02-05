/**
 * Projection Controls Module
 *
 * Manages projection tab interactions including:
 * - Time period selection (5, 10, 15, 20 years)
 * - Custom rate slider
 * - Chart/table view switching
 * - Chart type selection
 *
 * Uses dependency injection for testability.
 */

import { calculateCAGR } from './calculations.js';
import { debounce } from './utils.js';

// ========================================
// MODULE STATE (injected via init)
// ========================================

let _state;
let _getEmployeeData;
let _updateMainChartType;
let _updateYoyChartType;
let _updateProjectionChartData;
let _buildProjectionTable;

/**
 * Initialize the projections module with dependencies.
 *
 * @param {Object} deps - Dependencies
 * @param {Object} deps.state - Application state
 * @param {Function} deps.getEmployeeData - Function to get employee data
 * @param {Function} deps.updateMainChartType - Update main chart type
 * @param {Function} deps.updateYoyChartType - Update YoY chart type
 * @param {Function} deps.updateProjectionChartData - Update projection chart data
 * @param {Function} deps.buildProjectionTable - Build projection table
 */
export function initProjectionsModule({
    state,
    getEmployeeData,
    updateMainChartType,
    updateYoyChartType,
    updateProjectionChartData,
    buildProjectionTable
}) {
    _state = state;
    _getEmployeeData = getEmployeeData;
    _updateMainChartType = updateMainChartType;
    _updateYoyChartType = updateYoyChartType;
    _updateProjectionChartData = updateProjectionChartData;
    _buildProjectionTable = buildProjectionTable;
}

// ========================================
// CHART TYPE CONTROLS
// ========================================

/**
 * Sets the main chart type (line, bar, area, step).
 *
 * Updates state, toggles active button styling, and triggers
 * efficient chart type update (no full rebuild).
 *
 * @param {string} type - Chart type ('line', 'bar', 'area', 'step')
 */
export function setChartType(type) {
    _state.mainChartType = type;
    document.querySelectorAll('.chart-controls .chart-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.chart === type);
    });
    // Use efficient type update instead of full rebuild
    _updateMainChartType();
}

/**
 * Sets the Year-over-Year chart type (bar, line).
 *
 * Updates state, toggles active button styling, and triggers
 * efficient chart type update (no full rebuild).
 *
 * @param {string} type - Chart type ('bar', 'line')
 */
export function setYoyChartType(type) {
    _state.yoyChartType = type;
    document.querySelectorAll('[data-chart^="yoy-"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.chart === `yoy-${type}`);
    });
    // Use efficient type update instead of full rebuild
    _updateYoyChartType();
}

// ========================================
// PROJECTION INITIALIZATION
// ========================================

/**
 * Initializes projection controls with historical CAGR.
 *
 * Sets the custom rate slider to a value between historical CAGR
 * and conservative rate (3%) to prevent overlap with historical line.
 * Updates all displays and slider styling.
 */
export function initProjections() {
    const employeeData = _getEmployeeData();
    if (!employeeData) return;

    // Set slider to historical CAGR
    const historicalCAGR = Math.round(calculateCAGR(employeeData));
    _state.cagr = historicalCAGR;

    // Set custom rate to halfway between historical and conservative (3%)
    // This prevents custom line from overlapping with historical line
    const conservativeRate = 3;
    _state.customRate = Math.round((historicalCAGR + conservativeRate) / 2);

    // Update slider and display
    const slider = document.getElementById('customRateSlider');
    if (slider) {
        slider.value = _state.customRate;
        // Initialize slider track fill
        const progress = (_state.customRate / 25) * 100;
        slider.style.setProperty('--range-progress', `${progress}%`);
    }

    const customRateValue = document.getElementById('customRateValue');
    if (customRateValue) {
        customRateValue.textContent = _state.customRate + '%';
    }

    const historicalRateDisplay = document.getElementById('historicalRateDisplay');
    if (historicalRateDisplay) {
        historicalRateDisplay.textContent = historicalCAGR + '%';
    }
}

// ========================================
// PROJECTION CONTROLS
// ========================================

/**
 * Sets the projection time horizon.
 *
 * Updates state, toggles active button styling, and triggers
 * efficient chart data update (no full rebuild).
 *
 * @param {number} years - Number of years to project (5, 10, 15, 20)
 */
export function setProjectionYears(years) {
    _state.projectionYears = years;
    document.querySelectorAll('.interval-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.years, 10) === years);
    });
    // Use efficient update instead of full rebuild
    _updateProjectionChartData();
}

// Debounced chart update for smoother slider interaction
const debouncedProjectionUpdate = debounce(() => {
    if (_updateProjectionChartData) _updateProjectionChartData();
    if (_buildProjectionTable) _buildProjectionTable();
}, 150);

/**
 * Updates custom growth rate from slider input.
 *
 * Updates state and display immediately for responsive feel,
 * then debounces chart/table updates for smooth interaction.
 */
export function updateCustomRate() {
    const slider = document.getElementById('customRateSlider');
    if (!slider) return;

    _state.customRate = parseInt(slider.value, 10);

    // Update display immediately for responsive feel
    const customRateValue = document.getElementById('customRateValue');
    if (customRateValue) {
        customRateValue.textContent = _state.customRate + '%';
    }

    // Update slider track fill (CSS variable for gradient)
    const progress = (_state.customRate / 25) * 100;
    slider.style.setProperty('--range-progress', `${progress}%`);

    // Debounce chart data updates (uses efficient update() instead of rebuild)
    debouncedProjectionUpdate();
}

/**
 * Switches between chart and table view in projections tab.
 *
 * @param {string} view - 'chart' or 'table'
 */
export function setProjectionView(view) {
    const chartWrapper = document.getElementById('projectionChartWrapper');
    const tableWrapper = document.getElementById('projectionTableWrapper');
    const buttons = document.querySelectorAll('#tab-projections .chart-type-btn');

    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    if (chartWrapper && tableWrapper) {
        if (view === 'chart') {
            chartWrapper.classList.remove('hidden');
            tableWrapper.classList.add('hidden');
        } else {
            chartWrapper.classList.add('hidden');
            tableWrapper.classList.remove('hidden');
        }
    }
    // Note: Time period buttons always stay visible (affects both chart and table)
}
