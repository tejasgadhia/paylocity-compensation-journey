// js/keyboard.js
// Keyboard shortcuts module - extracted from app.js

let _getEmployeeData;
let _setTab;
let _setTheme;
let _togglePrivacy;
let _state;

/**
 * Initializes the keyboard module with dependencies.
 * Must be called before setupKeyboardShortcuts().
 *
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.getEmployeeData - Function to get current employee data
 * @param {Function} deps.setTab - Function to switch dashboard tabs
 * @param {Function} deps.setTheme - Function to set theme (tactical/artistic)
 * @param {Function} deps.togglePrivacy - Function to toggle privacy mode
 * @param {Object} deps.state - Application state object
 */
export function initKeyboard({ getEmployeeData, setTab, setTheme, togglePrivacy, state }) {
    _getEmployeeData = getEmployeeData;
    _setTab = setTab;
    _setTheme = setTheme;
    _togglePrivacy = togglePrivacy;
    _state = state;
}

/**
 * Sets up keyboard shortcuts for tab navigation and theme/privacy toggles.
 * Only active when dashboard has data loaded.
 * Call this function once after DOM is ready.
 *
 * Shortcuts:
 * - 1-7: Switch to tabs (home, story, market, history, analytics, projections, help)
 * - t/T: Toggle theme (tactical/artistic)
 * - v/V/p/P: Toggle privacy mode (dollars/indexed values)
 */
export function setupKeyboardShortcuts() {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        // Only work when data is loaded
        if (!_getEmployeeData()) return;

        switch(e.key) {
            case '1': _setTab('home'); break;
            case '2': _setTab('story'); break;
            case '3': _setTab('market'); break;
            case '4': _setTab('history'); break;
            case '5': _setTab('analytics'); break;
            case '6': _setTab('projections'); break;
            case '7': _setTab('help'); break;
            case 't':
            case 'T': _setTheme(_state.theme === 'tactical' ? 'artistic' : 'tactical'); break;
            case 'v':
            case 'V':
            case 'p':
            case 'P': _togglePrivacy(); break;
        }
    });
}
