// ========================================
// HERO PREVIEW MODULE
// ========================================
// Live mini-dashboard in the landing page browser mockup.
// Renders Chart.js charts + animated KPI counters using demo data.

/* global Chart */

import { DEMO_SCENARIOS } from './demo-data.js';
import { getThemeColors, getTooltipConfig } from './charts.js';
import { CONSTANTS } from './constants.js';

// ========================================
// MODULE STATE
// ========================================

let _loadChartJS;
let _heroChart = null;
let _currentView = 'home';
let _chartReady = false;
let _pendingView = null;

// Demo scenario index 2 = "Established" (8 years, richest data)
const HERO_SCENARIO = DEMO_SCENARIOS[2];
const HERO_RECORDS = [...HERO_SCENARIO.records].reverse(); // Chronological order

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize the hero preview. Loads Chart.js via idle callback,
 * then renders the default timeline view.
 * @param {Object} deps
 * @param {Function} deps.loadChartJS - Async function to load Chart.js
 */
export async function initHeroPreview({ loadChartJS }) {
    _loadChartJS = loadChartJS;

    // Animate KPI counters immediately (no Chart.js needed)
    animateMetrics('home');

    // Load Chart.js, then render chart
    try {
        await _loadChartJS();
        _chartReady = true;

        // If a view switch was requested while loading, apply it
        const viewToRender = _pendingView || 'home';
        _pendingView = null;
        renderView(viewToRender);
    } catch (err) {
        console.error('Hero preview: Failed to load Chart.js', err);
    }
}

// ========================================
// VIEW SWITCHING
// ========================================

// View definitions: metrics + chart builder per feature chip
// Metrics chosen for emotional impact — what makes someone say "I need this"
const VIEW_CONFIG = {
    home: {
        metrics: [
            { value: 60000, prefix: '$', suffix: '', label: 'Started At', decimals: 0 },
            { value: 130000, prefix: '$', suffix: '', label: 'Now Earning', decimals: 0 },
            { value: 70000, prefix: '+$', suffix: '', label: 'Total Gained', decimals: 0 }
        ],
        buildChart: buildTimelineChart
    },
    market: {
        metrics: [
            { value: 118, prefix: '', suffix: '%', label: 'Of Market Rate', decimals: 0 },
            { value: 75, prefix: 'Top ', suffix: '%', label: 'Percentile', decimals: 0 },
            { value: 20000, prefix: '+$', suffix: '', label: 'Above Average', decimals: 0 }
        ],
        buildChart: buildMarketChart
    },
    analytics: {
        metrics: [
            { value: 2.2, prefix: '', suffix: 'x', label: 'Pay Multiplied', decimals: 1 },
            { value: 5.2, prefix: '+', suffix: '%', label: 'Beats Inflation', decimals: 1 },
            { value: 9, prefix: '', suffix: ' raises', label: 'In 8 Years', decimals: 0 }
        ],
        buildChart: buildYoYChart
    },
    projections: {
        metrics: [
            { value: 130000, prefix: '$', suffix: '', label: 'Today', decimals: 0 },
            { value: 210000, prefix: '$', suffix: '', label: 'In 5 Years', decimals: 0 },
            { value: 80000, prefix: '+$', suffix: '', label: 'Potential Gain', decimals: 0 }
        ],
        buildChart: buildProjectionChart
    }
};

/**
 * Switch the hero preview to a different view.
 * Called by feature chip click handlers.
 * @param {string} viewName - 'home' | 'market' | 'analytics' | 'projections'
 */
export function switchHeroView(viewName) {
    if (!VIEW_CONFIG[viewName]) return;
    _currentView = viewName;

    // Animate metrics immediately
    animateMetrics(viewName);

    // If Chart.js isn't loaded yet, queue the view
    if (!_chartReady) {
        _pendingView = viewName;
        return;
    }

    renderView(viewName);
}

/**
 * Update hero chart colors when theme changes.
 */
export function updateHeroTheme() {
    if (!_heroChart) return;

    // Rebuild the current view's chart with new theme colors
    renderView(_currentView);
}

/**
 * Destroy the hero chart (call when entering dashboard).
 */
export function destroyHeroPreview() {
    if (_heroChart) {
        _heroChart.destroy();
        _heroChart = null;
    }
}

// ========================================
// CHART RENDERERS
// ========================================

function renderView(viewName) {
    const config = VIEW_CONFIG[viewName];
    if (!config) return;

    const canvas = document.getElementById('heroChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart
    if (_heroChart) {
        _heroChart.destroy();
        _heroChart = null;
    }

    _heroChart = config.buildChart(ctx);
}

function getHeroScales(colors, yCallback) {
    return {
        x: {
            grid: { color: colors.grid, drawBorder: false },
            ticks: { color: colors.text, font: { size: 10 }, maxRotation: 45, minRotation: 45 }
        },
        y: {
            grid: { color: colors.grid, drawBorder: false },
            beginAtZero: false,
            ticks: { color: colors.text, font: { size: 10 }, callback: yCallback }
        }
    };
}

function buildTimelineChart(ctx) {
    const colors = getThemeColors();
    const labels = HERO_RECORDS.map(r => {
        const d = new Date(r.date + 'T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const values = HERO_RECORDS.map(r => r.annual);

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: values,
                borderColor: colors.line1,
                backgroundColor: colors.fill1,
                fill: true,
                tension: 0.3,
                borderWidth: 2,
                pointBackgroundColor: colors.line1,
                pointBorderColor: colors.line1,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: false },
                tooltip: getTooltipConfig({
                    labelCallback: (c) => '$' + c.raw.toLocaleString()
                })
            },
            scales: getHeroScales(colors, (v) => '$' + (v / 1000) + 'k')
        }
    });
}

function buildMarketChart(ctx) {
    const colors = getThemeColors();
    const style = getComputedStyle(document.documentElement);
    const successColor = style.getPropertyValue('--color-success').trim();

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Your Salary', 'Market Average', '75th Percentile', '90th Percentile'],
            datasets: [{
                data: [130000, 110000, 125000, 150000],
                backgroundColor: [
                    successColor || colors.line1,
                    colors.grid,
                    colors.grid,
                    colors.grid
                ],
                borderWidth: 0,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: getTooltipConfig({
                    labelCallback: (c) => '$' + c.raw.toLocaleString()
                })
            },
            scales: {
                x: {
                    grid: { color: colors.grid, drawBorder: false },
                    ticks: { color: colors.text, font: { size: 10 }, callback: (v) => '$' + (v / 1000) + 'k' },
                    min: 80000
                },
                y: {
                    grid: { display: false },
                    ticks: { color: colors.text, font: { size: 10, weight: '600' } }
                }
            }
        }
    });
}

function buildYoYChart(ctx) {
    const colors = getThemeColors();

    // Calculate YoY growth from records
    const yoyData = [];
    const yoyLabels = [];
    for (let i = 1; i < HERO_RECORDS.length; i++) {
        const prev = HERO_RECORDS[i - 1];
        const curr = HERO_RECORDS[i];
        const growth = ((curr.annual - prev.annual) / prev.annual) * 100;
        const d = new Date(curr.date + 'T00:00:00');
        yoyLabels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        yoyData.push(parseFloat(growth.toFixed(1)));
    }

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: yoyLabels,
            datasets: [{
                data: yoyData,
                backgroundColor: colors.line2,
                borderColor: colors.line2,
                borderWidth: 1,
                borderRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: getTooltipConfig({
                    labelCallback: (c) => '+' + c.raw + '%'
                })
            },
            scales: getHeroScales(colors, (v) => v + '%')
        }
    });
}

function buildProjectionChart(ctx) {
    const colors = getThemeColors();
    const currentSalary = 130000;
    const cagr = 0.101; // 10.1%
    const conservative = CONSTANTS.PROJECTION_RATE_CONSERVATIVE;
    const years = 5;

    const labels = ['Now'];
    const historicalData = [currentSalary];
    const conservativeData = [currentSalary];

    for (let i = 1; i <= years; i++) {
        labels.push('+' + i + 'yr');
        historicalData.push(currentSalary * Math.pow(1 + cagr, i));
        conservativeData.push(currentSalary * Math.pow(1 + conservative, i));
    }

    const style = getComputedStyle(document.documentElement);
    const theme = document.documentElement.getAttribute('data-theme');
    const conservativeColor = theme === 'tactical' ? '#666' : '#8a837a';

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Historical CAGR',
                    data: historicalData,
                    borderColor: colors.line1,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: colors.line1
                },
                {
                    label: 'Conservative (3%)',
                    data: conservativeData,
                    borderColor: conservativeColor,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.3,
                    pointRadius: 2,
                    pointBackgroundColor: conservativeColor
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { color: colors.text, font: { size: 10 }, boxWidth: 12, padding: 8 }
                },
                tooltip: getTooltipConfig({
                    labelCallback: (c) => c.dataset.label + ': $' + Math.round(c.raw).toLocaleString()
                })
            },
            scales: getHeroScales(colors, (v) => '$' + (v / 1000) + 'k')
        }
    });
}

// ========================================
// KPI COUNTER ANIMATION
// ========================================

function animateMetrics(viewName) {
    const config = VIEW_CONFIG[viewName];
    if (!config) return;

    const metricEls = document.querySelectorAll('.mini-metric');
    config.metrics.forEach((metric, i) => {
        const el = metricEls[i];
        if (!el) return;

        const valueEl = el.querySelector('.mini-metric-value');
        const labelEl = el.querySelector('.mini-metric-label');
        if (!valueEl || !labelEl) return;

        labelEl.textContent = metric.label;
        animateCountUp(valueEl, metric.value, metric.prefix, metric.suffix, metric.decimals);
    });
}

function animateCountUp(element, target, prefix, suffix, decimals) {
    const duration = 800;
    const startTime = performance.now();
    const startValue = 0;

    // For large numbers, format with commas
    const formatValue = (v) => {
        if (decimals > 0) {
            return v.toFixed(decimals);
        }
        return v >= 1000 ? Math.round(v).toLocaleString() : Math.round(v).toString();
    };

    const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startValue + (target - startValue) * eased;

        element.textContent = prefix + formatValue(current) + suffix;

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };

    requestAnimationFrame(step);
}
