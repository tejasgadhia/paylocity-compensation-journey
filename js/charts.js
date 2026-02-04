// ========================================
// CHART FUNCTIONS MODULE
// ========================================

/* global Chart */

import { CONSTANTS } from './constants.js';
import { calculateCAGR, getCurrentSalary, getStartingSalary, formatDateCompact } from './calculations.js';

// ========================================
// MODULE STATE (injected via initCharts)
// ========================================

let _state, _charts, _getEmployeeData, _showUserMessage;

/**
 * Initializes the charts module with required dependencies.
 * Must be called once before using any chart functions.
 *
 * @param {Object} deps - Dependencies to inject
 * @param {Object} deps.state - UI state object
 * @param {Object} deps.charts - Chart.js instances storage
 * @param {Function} deps.getEmployeeData - Function that returns employee data
 * @param {Function} deps.showUserMessage - Function to display user messages
 */
export function initCharts({ state, charts, getEmployeeData, showUserMessage }) {
    _state = state;
    _charts = charts;
    _getEmployeeData = getEmployeeData;
    _showUserMessage = showUserMessage;
}

// ========================================
// THEME & UTILITY HELPERS
// ========================================

/**
 * Gets theme-aware colors from CSS custom properties.
 *
 * @returns {Object} Theme colors for charts
 */
export function getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
        line1: style.getPropertyValue('--chart-line-1').trim(),
        line2: style.getPropertyValue('--chart-line-2').trim(),
        fill1: style.getPropertyValue('--chart-fill-1').trim(),
        fill2: style.getPropertyValue('--chart-fill-2').trim(),
        grid: style.getPropertyValue('--chart-grid').trim(),
        text: style.getPropertyValue('--text-secondary').trim(),
        accent: style.getPropertyValue('--accent-primary').trim()
    };
}

/**
 * Gets canvas 2D context with validation and error handling.
 * Consolidates repeated canvas/context checks across chart functions.
 *
 * @param {string} canvasId - DOM ID of the canvas element
 * @param {string} chartName - Human-readable name for error messages
 * @returns {CanvasRenderingContext2D|null} The 2D context, or null if unavailable
 */
export function getChartContext(canvasId, chartName) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`${chartName}: Canvas element not found`);
        _showUserMessage(`${chartName} rendering failed. Please refresh the page.`, 'error');
        return null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error(`${chartName}: Canvas 2D context not available`);
        _showUserMessage(`${chartName} rendering failed. Your browser may not support this feature.`, 'error');
        return null;
    }

    return ctx;
}

/**
 * Factory function for Chart.js tooltip configuration.
 * Eliminates DRY violation across multiple charts.
 *
 * @param {Object} options - Optional configuration overrides
 * @param {Function} options.labelCallback - Custom label formatter (receives Chart.js context)
 * @param {number} options.padding - Tooltip padding (default: 12)
 * @param {boolean} options.displayColors - Show dataset colors (default: false)
 * @returns {Object} Chart.js tooltip configuration object
 */
export function getTooltipConfig(options = {}) {
    const {
        labelCallback = (ctx) => `${ctx.raw}`,
        padding = 12,
        displayColors = false
    } = options;

    return {
        backgroundColor: _state.theme === 'tactical' ? '#1a1a1d' : '#ffffff',
        titleColor: _state.theme === 'tactical' ? '#e8e8e8' : '#2d2a26',
        bodyColor: _state.theme === 'tactical' ? '#a0a0a0' : '#5c5650',
        borderColor: _state.theme === 'tactical' ? '#2a2a2d' : '#e8e2da',
        borderWidth: 1,
        padding,
        displayColors,
        callbacks: { label: labelCallback }
    };
}

// ========================================
// THEME UPDATE FUNCTIONS
// ========================================

/**
 * Updates chart colors to match current theme without rebuilding.
 * Uses Chart.js in-place updates for performance.
 *
 * @param {Object} chart - Chart.js instance to update
 */
export function updateChartTheme(chart) {
    if (!chart) return;

    const colors = getThemeColors();

    // Update dataset colors using metadata (closes #29)
    chart.data.datasets.forEach((dataset) => {
        // Update border colors based on dataset type (metadata-driven, not label-matching)
        if (dataset.borderColor && dataset.datasetType) {
            switch (dataset.datasetType) {
                case 'mainSalary':
                    dataset.borderColor = colors.line1;
                    dataset.pointBackgroundColor = colors.line1;
                    dataset.pointBorderColor = colors.line1;
                    break;
                case 'yoyGrowth':
                    dataset.borderColor = colors.line2;
                    break;
                case 'historicalCAGR':
                    dataset.borderColor = colors.line1;
                    break;
                case 'custom':
                    dataset.borderColor = colors.line2;
                    break;
                case 'conservative':
                    dataset.borderColor = _state.theme === 'tactical' ? '#666' : '#8a837a';
                    break;
                case 'optimistic':
                    dataset.borderColor = _state.theme === 'tactical' ? '#4598d4' : '#7b2cbf';
                    break;
            }
        }

        // Update background colors for bar/area charts
        if (dataset.backgroundColor && dataset.backgroundColor !== 'transparent') {
            // Use dataset type for precise color matching
            switch (dataset.datasetType) {
                case 'mainSalary':
                    if (_state.mainChartType === 'area') {
                        dataset.backgroundColor = colors.fill1;
                    } else if (_state.mainChartType === 'bar') {
                        dataset.backgroundColor = colors.line1;
                    }
                    break;
                case 'yoyGrowth':
                    if (_state.yoyChartType === 'bar') {
                        dataset.backgroundColor = colors.line2;
                    }
                    break;
            }
        }
    });

    // Update grid and axis colors
    if (chart.options.scales) {
        Object.keys(chart.options.scales).forEach(scaleKey => {
            const scale = chart.options.scales[scaleKey];
            if (scale.grid) {
                scale.grid.color = colors.grid;
            }
            if (scale.ticks) {
                scale.ticks.color = colors.text;
            }
        });
    }

    // Update tooltip colors
    if (chart.options.plugins?.tooltip) {
        chart.options.plugins.tooltip.backgroundColor = _state.theme === 'tactical' ? '#1a1a1d' : '#ffffff';
        chart.options.plugins.tooltip.titleColor = _state.theme === 'tactical' ? '#e8e8e8' : '#2d2a26';
        chart.options.plugins.tooltip.bodyColor = _state.theme === 'tactical' ? '#a0a0a0' : '#5c5650';
        chart.options.plugins.tooltip.borderColor = _state.theme === 'tactical' ? '#2a2a2d' : '#e8e2da';
    }

    // Update legend colors
    if (chart.options.plugins?.legend?.labels) {
        chart.options.plugins.legend.labels.color = colors.text;
    }

    // Fast update without animation
    chart.update('none');
}

// ========================================
// CHART UPDATER FACTORY (#166)
// ========================================

/**
 * Factory for chart updaters with standardized error handling.
 * Pattern: check data → check existence → try update → fallback to rebuild
 *
 * DRY pattern used by all chart update functions to eliminate repetitive
 * boilerplate for data checking, chart existence checking, and error recovery.
 *
 * @param {string} chartKey - Key in _charts ('main', 'yoy', 'projection')
 * @param {Function} buildFn - Build function to call on fallback
 * @param {Function} updateFn - Update logic (receives chart instance)
 * @param {Object} options - Configuration options
 * @param {boolean} [options.requiresData=true] - Whether to check employeeData first
 * @returns {Function} Wrapped updater function
 */
function createChartUpdater(chartKey, buildFn, updateFn, options = {}) {
    const { requiresData = true } = options;

    return function() {
        if (requiresData) {
            const employeeData = _getEmployeeData();
            if (!employeeData) return;
        }

        const chart = _charts[chartKey];
        if (!chart) {
            buildFn();
            return;
        }

        try {
            updateFn(chart);
            chart.update('none');
        } catch (error) {
            console.warn(`Chart update failed for ${chartKey}, rebuilding:`, error.message);
            buildFn();
        }
    };
}

// ========================================
// CHART TYPE UPDATE FUNCTIONS
// ========================================

/**
 * Efficiently updates main chart type without full rebuild.
 * Uses Chart.js in-place updates for type and dataset properties.
 * Falls back to full rebuild if chart doesn't exist.
 *
 * Performance: ~5-10ms vs 20-40ms for full rebuild
 */
export const updateMainChartType = createChartUpdater(
    'main',
    buildMainChart,
    (chart) => {
        const colors = getThemeColors();
        const type = _state.mainChartType;

        // Update chart type (Chart.js 3+ supports this)
        chart.config.type = type === 'bar' ? 'bar' : 'line';

        // Update dataset properties based on chart type
        const dataset = chart.data.datasets[0];
        dataset.backgroundColor = type === 'area' ? colors.fill1 :
                                  type === 'bar' ? colors.line1 : 'transparent';
        dataset.fill = type === 'area';
        dataset.tension = type === 'step' ? 0 : 0.3;
        dataset.stepped = type === 'step' ? 'before' : false;
        dataset.pointRadius = type === 'bar' ? 0 : 4;
    },
    { requiresData: false }
);

/**
 * Efficiently updates YoY chart type without full rebuild.
 * Uses Chart.js in-place updates for type and dataset properties.
 * Falls back to full rebuild if chart doesn't exist.
 *
 * Performance: ~5-10ms vs 20-40ms for full rebuild
 */
export const updateYoyChartType = createChartUpdater(
    'yoy',
    buildYoyChart,
    (chart) => {
        const colors = getThemeColors();
        const type = _state.yoyChartType;

        // Update chart type
        chart.config.type = type;

        // Update dataset properties based on chart type
        const dataset = chart.data.datasets[0];
        dataset.backgroundColor = type === 'bar' ? colors.line2 : 'transparent';

        // #137: Toggle tooltip based on chart type (bar has data labels, line needs tooltips)
        chart.options.plugins.tooltip = type === 'bar'
            ? { enabled: false }
            : getTooltipConfig({
                labelCallback: (ctx) => `${ctx.raw.toFixed(1)}% growth`
            });
    },
    { requiresData: false }
);

// ========================================
// CHART BUILD FUNCTIONS
// ========================================

/**
 * Builds the main compensation timeline chart with theme-aware styling.
 *
 * Supports 4 chart types (line, bar, area, step) and 2 view modes (dollars vs indexed).
 * Destroys previous chart instance before creating new one to prevent memory leaks.
 * Automatically adjusts colors, tooltips, and formatting based on current theme.
 *
 * @returns {void}
 */
export function buildMainChart() {
    const employeeData = _getEmployeeData();
    if (!employeeData) return;

    try {
        const ctx = getChartContext('mainChart', 'Main chart');
        if (!ctx) return;

        const colors = getThemeColors();

        const data = [...employeeData.records].reverse();

        const labels = data.map(r => formatDateCompact(r.date));

        const values = data.map(r => _state.showDollars ? r.annual : (r.annual / getStartingSalary(employeeData)) * 100);

        if (_charts.main) {
            _charts.main.destroy();
        }

        _charts.main = new Chart(ctx, {
            type: _state.mainChartType === 'bar' ? 'bar' : 'line',
            data: {
                labels,
                datasets: [{
                    label: _state.showDollars ? 'Annual Salary' : 'Index Value',
                    data: values,
                    datasetType: 'mainSalary', // Metadata for theme updates (closes #29)
                    borderColor: colors.line1,
                    backgroundColor: _state.mainChartType === 'area' ? colors.fill1 :
                                    _state.mainChartType === 'bar' ? colors.line1 : 'transparent',
                    fill: _state.mainChartType === 'area',
                    tension: _state.mainChartType === 'step' ? 0 : 0.3,
                    stepped: _state.mainChartType === 'step' ? 'before' : false,
                    borderWidth: 2,
                    pointBackgroundColor: colors.line1,
                    pointBorderColor: colors.line1,
                    pointRadius: _state.mainChartType === 'bar' ? 0 : 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 80 } },  // #139: Reserve space for Line/Bar/Step toggle buttons (increased from 50px to prevent overlap at high salaries)
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: false },
                    tooltip: getTooltipConfig({
                        labelCallback: (ctx) => _state.showDollars ? `$${ctx.raw.toLocaleString()}` : `Index: ${ctx.raw.toFixed(0)}`
                    })
                },
                scales: {
                    x: {
                        grid: { color: colors.grid, drawBorder: false },
                        ticks: {
                            color: colors.text,
                            maxRotation: 45,
                            minRotation: 45,
                            font: { size: 13, weight: 'bold' }  // #71: Increased from 12px, made bold for consistency
                        }
                    },
                    y: {
                        grid: { color: colors.grid, drawBorder: false },
                        beginAtZero: true,  // Start Y-axis at $0 for better context
                        ticks: {
                            color: colors.text,
                            font: { size: 14, weight: 'bold' },  // #71: Increased from 12px, made bold
                            callback: (v) => _state.showDollars ? '$' + (v / 1000) + 'k' : v
                        }
                    }
                }
            }
        });

        // Hide loading state
        const loading = document.getElementById('mainChartLoading');
        if (loading) loading.classList.add('hidden');
    } catch (error) {
        console.error('buildMainChart: Chart creation failed', error);
        _showUserMessage('Chart rendering failed. Please try refreshing the page.', 'error');

        // Attempt to show a fallback message in the chart container
        const canvas = document.getElementById('mainChart');
        if (canvas && canvas.parentElement) {
            const fallback = document.createElement('div');
            fallback.style.cssText = 'padding: 2rem; text-align: center; color: var(--text-muted);';
            fallback.textContent = 'Chart could not be rendered. Please refresh the page or try a different browser.';
            canvas.parentElement.appendChild(fallback);
        }
    }
}

/**
 * Efficiently updates main chart data (salary values and labels) without full rebuild.
 * Uses Chart.js in-place updates for better performance and smoother transitions.
 * Falls back to full rebuild if chart doesn't exist.
 *
 * Primary use case: Privacy toggle (showDollars true/false)
 * Performance: ~5-10ms vs 20-40ms for full rebuild
 *
 * @returns {void}
 */
export const updateMainChartData = createChartUpdater(
    'main',
    buildMainChart,
    (chart) => {
        const employeeData = _getEmployeeData();
        const data = [...employeeData.records].reverse();
        const labels = data.map(r => formatDateCompact(r.date));
        const values = data.map(r =>
            _state.showDollars ? r.annual : (r.annual / getStartingSalary(employeeData)) * 100
        );

        // Update data in place
        chart.data.labels = labels;
        chart.data.datasets[0].data = values;
        chart.data.datasets[0].label = _state.showDollars ? 'Annual Salary' : 'Index Value';

        // Update Y-axis formatting
        chart.options.scales.y.ticks.callback = (v) =>
            _state.showDollars ? '$' + (v / 1000) + 'k' : v;

        // Update tooltip formatting
        chart.options.plugins.tooltip = getTooltipConfig({
            labelCallback: (ctx) => _state.showDollars ?
                `$${ctx.raw.toLocaleString()}` : `Index: ${ctx.raw.toFixed(0)}`
        });
    }
);

/**
 * Builds the year-over-year salary growth chart.
 *
 * Calculates annual growth percentages by comparing end-of-year salaries.
 * Supports bar and line chart types via state.yoyChartType.
 * Destroys existing chart before creation to prevent memory leaks.
 *
 * @returns {void}
 */
export function buildYoyChart() {
    const employeeData = _getEmployeeData();
    if (!employeeData) return;

    try {
        const ctx = getChartContext('yoyChart', 'YoY chart');
        if (!ctx) return;

        const colors = getThemeColors();

        const yoyData = {};
        employeeData.records.forEach(r => {
            const year = new Date(r.date).getFullYear();
            if (!yoyData[year]) {
                yoyData[year] = { start: r.annual, end: r.annual };
            } else {
                yoyData[year].start = r.annual;
            }
        });

        const years = Object.keys(yoyData).sort();
        const growthRates = [];

        for (let i = 1; i < years.length; i++) {
            const prevYear = years[i - 1];
            const currYear = years[i];
            const growth = ((yoyData[currYear].end - yoyData[prevYear].end) / yoyData[prevYear].end) * 100;
            growthRates.push({ year: currYear, growth });
        }

        if (_charts.yoy) _charts.yoy.destroy();

        _charts.yoy = new Chart(ctx, {
            type: _state.yoyChartType,
            data: {
                labels: growthRates.map(d => d.year),
                datasets: [{
                    label: 'YoY Growth %',
                    data: growthRates.map(d => d.growth),
                    datasetType: 'yoyGrowth', // Metadata for theme updates (closes #29)
                    borderColor: colors.line2,
                    backgroundColor: _state.yoyChartType === 'bar' ? colors.line2 : 'transparent',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 20 } },  // #88: Room for data labels
                plugins: {
                    legend: { display: false },
                    // #137: Disable tooltip for bar chart since data labels show values
                    tooltip: _state.yoyChartType === 'bar'
                        ? { enabled: false }
                        : getTooltipConfig({
                            labelCallback: (ctx) => `${ctx.raw.toFixed(1)}% growth`
                        })
                },
                scales: {
                    x: { grid: { color: colors.grid, drawBorder: false }, ticks: { color: colors.text, font: { size: 13, weight: 'bold' } } },  // #71: Bold for consistency
                    y: { grid: { color: colors.grid, drawBorder: false }, ticks: { color: colors.text, font: { size: 14, weight: 'bold' }, callback: (v) => v + '%' }, grace: '10%' }
                }
            },
            // #88: Inline plugin to draw data labels above bars
            plugins: [{
                id: 'yoyDataLabels',
                afterDatasetsDraw(chart) {
                    if (_state.yoyChartType !== 'bar') return; // Only for bar chart

                    const ctx = chart.ctx;
                    const themeColors = getThemeColors();

                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((bar, index) => {
                            const value = dataset.data[index];
                            const text = value.toFixed(1) + '%';

                            ctx.save();
                            ctx.fillStyle = themeColors.text;
                            ctx.font = '11px var(--font-mono, monospace)';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            ctx.fillText(text, bar.x, bar.y - 4);
                            ctx.restore();
                        });
                    });
                }
            }]
        });
    } catch (error) {
        console.error('Failed to build YoY chart:', error);
        _showUserMessage('YoY chart rendering failed. Try refreshing the page.', 'error');
    }
}

/**
 * Efficiently updates YoY chart data without full rebuild.
 * Uses Chart.js in-place updates for better performance.
 * Falls back to full rebuild if chart doesn't exist.
 *
 * Primary use case: Privacy toggle (showDollars affects tooltips only, not data)
 * Performance: ~5-10ms vs 20-40ms for full rebuild
 *
 * Note: YoY chart always shows percentages, so privacy toggle only affects tooltip display
 *
 * @returns {void}
 */
export const updateYoyChartData = createChartUpdater(
    'yoy',
    buildYoyChart,
    (chart) => {
        // YoY chart data doesn't change with privacy toggle (always percentages)
        // But we update tooltips to maintain consistency
        chart.options.plugins.tooltip = _state.yoyChartType === 'bar'
            ? { enabled: false }
            : getTooltipConfig({
                labelCallback: (ctx) => `${ctx.raw.toFixed(1)}% growth`
            });
    }
);

/**
 * Builds the salary projection chart with multiple scenarios.
 *
 * Displays 4 projection lines: historical CAGR, conservative (5%),
 * custom (user-adjustable via slider), and optimistic (12%).
 * Shows projected salary values over configurable year range.
 *
 * @returns {void}
 */
export function buildProjectionChart() {
    const employeeData = _getEmployeeData();
    if (!employeeData) return;

    try {
        const ctx = getChartContext('projectionChart', 'Projection chart');
        if (!ctx) return;

        const colors = getThemeColors();

        const currentSalaryRaw = getCurrentSalary(employeeData);
        const startingSalary = getStartingSalary(employeeData);

        // Convert to indexed values if privacy mode enabled (same as main chart)
        const currentSalary = _state.showDollars
            ? currentSalaryRaw
            : (currentSalaryRaw / startingSalary) * 100;

        const cagr = calculateCAGR(employeeData) / 100;
        const years = _state.projectionYears;
        const customRate = _state.customRate / 100;

        const labels = ['Now'];
        const historical = [currentSalary];
        const conservative = [currentSalary];
        const custom = [currentSalary];

        for (let i = 1; i <= years; i++) {
            labels.push(`+${i}yr`);
            historical.push(currentSalary * Math.pow(1 + cagr, i));
            conservative.push(currentSalary * Math.pow(1 + CONSTANTS.PROJECTION_RATE_CONSERVATIVE, i));
            custom.push(currentSalary * Math.pow(1 + customRate, i));
        }

        if (_charts.projection) _charts.projection.destroy();

        _charts.projection = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: `Historical CAGR (${(cagr * 100).toFixed(1)}%)`, data: historical, datasetType: 'historicalCAGR', borderColor: colors.line1, backgroundColor: 'transparent', borderWidth: 3, tension: 0.3, pointRadius: 4 },
                    { label: 'Conservative (3%)', data: conservative, datasetType: 'conservative', borderColor: _state.theme === 'tactical' ? '#666' : '#8a837a', backgroundColor: 'transparent', borderWidth: 2, tension: 0.3, pointRadius: 3 },
                    { label: `Custom (${_state.customRate}%)`, data: custom, datasetType: 'custom', borderColor: colors.line2, backgroundColor: 'transparent', borderWidth: 2, tension: 0.3, pointRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: colors.text,
                            padding: 20,
                            font: { family: _state.theme === 'tactical' ? 'JetBrains Mono' : 'Space Grotesk', size: 11 }
                        }
                    },
                    tooltip: getTooltipConfig({
                        labelCallback: (ctx) => _state.showDollars ?
                            `${ctx.dataset.label}: $${Math.round(ctx.raw).toLocaleString()}` :
                            `${ctx.dataset.label}: ${ctx.raw.toFixed(0)}`
                    })
                },
                scales: {
                    x: { grid: { color: colors.grid, drawBorder: false }, ticks: { color: colors.text, font: { size: 13, weight: 'bold' } } },  // #71: Bold for consistency
                    y: {
                        beginAtZero: true,  // Start Y-axis at $0 for consistency with home tab
                        grid: { color: colors.grid, drawBorder: false },
                        ticks: {
                            color: colors.text,
                            font: { size: 14, weight: 'bold' },
                            callback: (v) => _state.showDollars ? '$' + (v / 1000).toFixed(0) + 'k' : v.toFixed(0)
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Failed to build projection chart:', error);
        _showUserMessage('Projection chart rendering failed. Try refreshing the page.', 'error');
    }
}

/**
 * Efficiently updates projection chart data without full rebuild.
 * Uses Chart.js update() method instead of destroy/create pattern.
 * Falls back to full rebuild if chart doesn't exist.
 *
 * Performance: ~5-10ms vs 20-40ms for full rebuild
 *
 * @returns {void}
 */
export const updateProjectionChartData = createChartUpdater(
    'projection',
    buildProjectionChart,
    (chart) => {
        const employeeData = _getEmployeeData();
        const currentSalaryRaw = getCurrentSalary(employeeData);
        const startingSalary = getStartingSalary(employeeData);

        // Convert to indexed values if privacy mode enabled (same as main chart)
        const currentSalary = _state.showDollars
            ? currentSalaryRaw
            : (currentSalaryRaw / startingSalary) * 100;

        const cagr = calculateCAGR(employeeData) / 100;
        const years = _state.projectionYears;
        const customRate = _state.customRate / 100;

        const labels = ['Now'];
        const historical = [currentSalary];
        const conservative = [currentSalary];
        const custom = [currentSalary];

        for (let i = 1; i <= years; i++) {
            labels.push(`+${i}yr`);
            historical.push(currentSalary * Math.pow(1 + cagr, i));
            conservative.push(currentSalary * Math.pow(1 + CONSTANTS.PROJECTION_RATE_CONSERVATIVE, i));
            custom.push(currentSalary * Math.pow(1 + customRate, i));
        }

        // Update data in place
        chart.data.labels = labels;
        chart.data.datasets[0].data = historical;
        chart.data.datasets[1].data = conservative;
        chart.data.datasets[2].data = custom;
        chart.data.datasets[2].label = `Custom (${_state.customRate}%)`;

        // Update Y-axis and tooltip formatting based on privacy mode
        chart.options.scales.y.ticks.callback = (v) =>
            _state.showDollars ? '$' + (v / 1000).toFixed(0) + 'k' : v.toFixed(0);

        chart.options.plugins.tooltip = getTooltipConfig({
            labelCallback: (ctx) => _state.showDollars ?
                `$${ctx.raw.toLocaleString('en-US', { maximumFractionDigits: 0 })}` :
                `Index: ${ctx.raw.toFixed(0)}`
        });
    }
);
