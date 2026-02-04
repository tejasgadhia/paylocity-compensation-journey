/**
 * Data Persistence Module
 * Handles backup and recovery of employee data using localStorage.
 * Provides automatic session persistence and restore functionality.
 */

import { showUserMessage } from './notifications.js';

// ========================================
// MODULE STATE (injected dependencies)
// ========================================

let _getEmployeeData;
let _setEmployeeData;
let _showDashboard;
let _updateUrlParams;
let _getDomCache;

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize the data persistence module with dependencies from app.js
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.getEmployeeData - Getter for employeeData
 * @param {Function} deps.setEmployeeData - Setter for employeeData
 * @param {Function} deps.showDashboard - Function to display dashboard
 * @param {Function} deps.updateUrlParams - Function to update URL parameters
 * @param {Function} deps.getDomCache - Getter for cached DOM elements (may be populated later)
 */
export function initDataPersistence({ getEmployeeData, setEmployeeData, showDashboard, updateUrlParams, getDomCache }) {
    _getEmployeeData = getEmployeeData;
    _setEmployeeData = setEmployeeData;
    _showDashboard = showDashboard;
    _updateUrlParams = updateUrlParams;
    _getDomCache = getDomCache;
}

// ========================================
// BACKUP FUNCTIONS
// ========================================

/**
 * Save employeeData to localStorage as backup
 * Called after successful parse or data load
 */
export function saveBackup() {
    const employeeData = _getEmployeeData();
    if (!employeeData) return;

    try {
        const backup = {
            data: employeeData,
            timestamp: Date.now(),
            version: 1
        };
        localStorage.setItem('cj-backup', JSON.stringify(backup));
        console.log('Data backup saved to localStorage');
    } catch (err) {
        // Quota exceeded or localStorage disabled - fail gracefully
        console.warn('Failed to save backup to localStorage:', err.message);
    }
}

/**
 * Load employeeData from localStorage backup
 * Returns null if no backup exists or backup is invalid
 * @returns {Object|null} Backup object with data, timestamp, version or null
 */
export function loadBackup() {
    try {
        const backupStr = localStorage.getItem('cj-backup');
        if (!backupStr) return null;

        const backup = JSON.parse(backupStr);
        if (!backup.data || !backup.data.records || !backup.data.hireDate) {
            throw new Error('Invalid backup format');
        }

        return backup;
    } catch (err) {
        console.warn('Failed to load backup from localStorage:', err.message);
        return null;
    }
}

/**
 * Clear localStorage backup
 * Called after successful restore or when user clicks "Start Over"
 */
export function clearBackup() {
    try {
        localStorage.removeItem('cj-backup');
        console.log('Backup cleared from localStorage');
    } catch (err) {
        console.warn('Failed to clear backup:', err.message);
    }
}

// ========================================
// UI FUNCTIONS
// ========================================

/**
 * Check if backup exists and update UI
 * Called on page load and when import modal opens
 */
export function updateBackupUI() {
    const backup = loadBackup();
    const restoreBtn = document.getElementById('restoreBackupBtn');

    if (restoreBtn) {
        if (backup) {
            const date = new Date(backup.timestamp);
            const dateStr = date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
            restoreBtn.textContent = `Restore Last Session (from ${dateStr})`;
            restoreBtn.classList.remove('hidden');
        } else {
            restoreBtn.classList.add('hidden');
        }
    }
}

/**
 * Restore data from localStorage backup
 * Called when user clicks "Restore Last Session" button
 */
export function restoreFromBackup() {
    const backup = loadBackup();
    if (!backup) {
        showUserMessage('No backup found', 'error');
        return;
    }

    try {
        _setEmployeeData(backup.data);
        // Mark as not demo data
        const employeeData = _getEmployeeData();
        employeeData.isDemo = false;
        _showDashboard();

        // Hide demo banner
        document.getElementById('demoBanner').classList.add('hidden');

        // Update URL (removes demo flag)
        _updateUrlParams();

        // Close import modal (#149: Use cached element)
        const domCache = _getDomCache();
        if (domCache.importModal) {
            domCache.importModal.classList.remove('visible');
            document.body.style.overflow = '';
        }

        // Clear backup after successful restore
        clearBackup();
        updateBackupUI();

        showUserMessage('Session restored successfully', 'success');
    } catch (err) {
        showUserMessage('Error restoring session: ' + err.message, 'error');
    }
}
