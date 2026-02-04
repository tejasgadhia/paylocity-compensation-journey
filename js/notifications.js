// ========================================
// NOTIFICATIONS MODULE
// ========================================

import { CONSTANTS, cpiMetadata } from './constants.js';

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
function escapeHTML(str) {
    if (typeof str !== 'string') return str;

    const htmlEscapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };

    return str.replace(/[&<>"'\/]/g, char => htmlEscapeMap[char]);
}

// ========================================
// USER MESSAGES
// ========================================

/**
 * Displays a user-facing message banner at the top of the page.
 * Automatically removes after 5 seconds.
 *
 * @param {string} message - The message to display
 * @param {string} type - Message type: 'error', 'warning', 'success', 'info'
 *
 * @example
 * showUserMessage('Chart rendering failed. Try refreshing.', 'error');
 * showUserMessage('Data saved successfully!', 'success');
 */
export function showUserMessage(message, type = 'error') {
    // Remove any existing messages
    document.querySelectorAll('.user-message').forEach(el => el.remove());

    const banner = document.createElement('div');
    // #174: Use CSS classes instead of inline styles (BEM modifier pattern)
    banner.className = `user-message user-message--${type}`;
    banner.innerHTML = `
        <span>${escapeHTML(message)}</span>
        <button class="user-message-dismiss" onclick="this.parentElement.remove()" aria-label="Dismiss message">✕</button>
    `;

    document.body.prepend(banner);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (banner.parentElement) {
            banner.remove();
        }
    }, 5000);
}

// ========================================
// CPI DATA FRESHNESS
// ========================================

/**
 * Checks if CPI inflation data is stale and shows a warning if needed.
 * Data is considered stale if older than threshold defined in cpiMetadata.
 * Warning can be dismissed and will be remembered in localStorage.
 */
export function checkCPIDataFreshness() {
    const dismissedTimestamp = localStorage.getItem(CONSTANTS.STORAGE_KEY_CPI_WARNING);

    // If dismissed recently (within 30 days), don't show again
    if (dismissedTimestamp) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTimestamp, 10)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 30) {
            return;
        }
    }

    // Parse lastUpdated date (YYYY-MM format)
    const lastUpdated = new Date(cpiMetadata.lastUpdated + '-01');
    const monthsOld = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30);

    if (monthsOld > cpiMetadata.staleThresholdMonths) {
        showStaleDataWarning(lastUpdated);
    }
}

/**
 * Displays a subtle warning banner when CPI data is stale.
 * @param {Date} lastUpdated - Date when CPI data was last updated
 */
function showStaleDataWarning(lastUpdated) {

    // Remove any existing stale warning
    document.querySelectorAll('.stale-data-warning').forEach(el => el.remove());

    const formattedDate = lastUpdated.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
    });

    const banner = document.createElement('div');
    banner.className = 'stale-data-warning';
    banner.setAttribute('role', 'alert');
    // #174: Use CSS classes instead of inline styles
    banner.innerHTML = `
        <span class="stale-warning-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
        </span>
        <span class="stale-warning-text">
            Inflation data last updated ${formattedDate}.
            <a class="stale-warning-link" href="https://www.bls.gov/cpi/" target="_blank" rel="noopener noreferrer">View latest</a>
        </span>
        <button class="stale-warning-dismiss" aria-label="Dismiss stale data warning">✕</button>
    `;

    const dismissBtn = banner.querySelector('.stale-warning-dismiss');
    dismissBtn.addEventListener('click', () => {
        localStorage.setItem(CONSTANTS.STORAGE_KEY_CPI_WARNING, Date.now().toString());
        banner.remove();
    });

    document.body.appendChild(banner);
}
