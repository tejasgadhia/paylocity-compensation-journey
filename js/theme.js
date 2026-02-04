// ========================================
// THEME FUNCTIONS MODULE
// ========================================

import { updateChartTheme } from './charts.js';

// ========================================
// MODULE STATE (injected via initTheme)
// ========================================

let _state, _charts, _getEmployeeData, _updateStory, _updateUrlParams;

/**
 * Initializes the theme module with required dependencies.
 * Must be called once before using any theme functions.
 *
 * @param {Object} deps - Dependencies to inject
 * @param {Object} deps.state - UI state object
 * @param {Object} deps.charts - Chart.js instances storage
 * @param {Function} deps.getEmployeeData - Function that returns employee data
 * @param {Function} deps.updateStory - Function to update story content
 * @param {Function} deps.updateUrlParams - Function to update URL parameters
 */
export function initTheme({ state, charts, getEmployeeData, updateStory, updateUrlParams }) {
    _state = state;
    _charts = charts;
    _getEmployeeData = getEmployeeData;
    _updateStory = updateStory;
    _updateUrlParams = updateUrlParams;
}

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
export function setTheme(theme) {
    _state.theme = theme;
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
    _updateUrlParams();

    if (_getEmployeeData()) {
        _updateStory();
        // Instantly update chart colors without rebuilding (performance optimization)
        updateChartTheme(_charts.main);
        updateChartTheme(_charts.yoy);
        updateChartTheme(_charts.projection);
    }
}
