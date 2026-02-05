/**
 * Utility Functions Module
 *
 * Pure utility functions with no external dependencies.
 * Easily testable without mocking.
 */

/**
 * Creates a debounced version of a function that delays execution
 * until after a specified wait time has elapsed since the last call.
 *
 * Useful for rate-limiting expensive operations triggered by rapid events
 * like typing, scrolling, or window resizing.
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait before executing
 * @returns {Function} Debounced function
 *
 * @example
 * // Debounce search input
 * const debouncedSearch = debounce(performSearch, 300);
 * searchInput.addEventListener('input', debouncedSearch);
 *
 * @example
 * // Debounce chart updates for slider
 * const debouncedUpdate = debounce(updateChart, 150);
 * slider.addEventListener('input', debouncedUpdate);
 */
export function debounce(func, wait) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), wait);
    };
}
