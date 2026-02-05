// ========================================
// EVENT HANDLERS MODULE
// ========================================
// Extracted from app.js for better modularity (#149)
// Handles all DOM event listener setup

/**
 * Dependencies injected via initEventHandlers()
 * @type {Object}
 */
let _deps = {};

/**
 * Initialize event handlers module with dependencies
 * @param {Object} deps - Dependency injection object
 * @param {Function} deps.setDomCache - Function to set domCache in app.js
 * @param {Function} deps.setTheme - Theme setter from theme.js
 * @param {Function} deps.setViewMode - View mode setter from view.js
 * @param {Function} deps.setTab - Tab navigation from navigation.js
 * @param {Function} deps.loadDemoData - Demo data loader from demo-data.js
 * @param {Function} deps.cycleNextScenario - Demo scenario cycler from demo-data.js
 * @param {Function} deps.downloadHtmlFile - HTML download from io.js
 * @param {Function} deps.loadJsonFile - JSON file loader from io.js
 * @param {Function} deps.downloadData - Data download from io.js
 * @param {Function} deps.saveBackup - Backup saver from data-persistence.js
 * @param {Function} deps.loadBackup - Backup loader from data-persistence.js
 * @param {Function} deps.updateBackupUI - Backup UI updater from data-persistence.js
 * @param {Function} deps.restoreFromBackup - Backup restorer from data-persistence.js
 * @param {Function} deps.parseAndGenerate - Main parse function from app.js
 * @param {Function} deps.validatePasteInput - Input validator from app.js
 * @param {Function} deps.resetDashboard - Dashboard resetter from app.js
 * @param {Function} deps.setChartType - Main chart type setter from app.js
 * @param {Function} deps.setYoyChartType - YoY chart type setter from app.js
 * @param {Function} deps.setProjectionYears - Projection years setter from app.js
 * @param {Function} deps.setProjectionView - Projection view setter from app.js
 * @param {Function} deps.updateCustomRate - Custom rate updater from app.js
 * @param {Function} deps.debounce - Debounce utility from app.js
 */
export function initEventHandlers(deps) {
    _deps = deps;
}

// ========================================
// SUB-FUNCTIONS FOR EVENT LISTENER SETUP
// ========================================

/**
 * Create and return the DOM cache object
 * #149: Eliminates redundant getElementById calls
 * @returns {Object} domCache - Cached DOM element references
 */
function setupDomCache() {
    return {
        // Landing page
        landingPage: document.getElementById('landingPage'),
        dashboardPage: document.getElementById('dashboardPage'),
        desktopBlockOverlay: document.getElementById('desktopBlockOverlay'),

        // Import modal
        importModal: document.getElementById('importModal'),
        pasteInput: document.getElementById('pasteInput'),
        generateBtn: document.getElementById('generateBtn'),
        validationMessage: document.getElementById('validationMessage'),
        legalConsentCheckbox: document.getElementById('legalConsentCheckbox'),
        jsonFileInput: document.getElementById('jsonFileInput'),

        // Demo banner
        demoBanner: document.getElementById('demoBanner'),

        // Privacy toggle & displays
        privacyToggle: document.getElementById('privacyToggle'),
        currentSalary: document.getElementById('currentSalary'),
        currentSalaryIndexed: document.getElementById('currentSalaryIndexed'),

        // Projection controls
        customRateSlider: document.getElementById('customRateSlider'),
        customRateValue: document.getElementById('customRateValue'),

        // Other frequently accessed elements
        comparisonSlider: document.getElementById('comparisonSlider'),
        marketFootnote: document.getElementById('marketFootnote'),
        restoreBackupBtn: document.getElementById('restoreBackupBtn')
    };
}

/**
 * Load and apply saved theme preference from localStorage
 * Sets up landing page theme buttons
 */
function setupThemePreference() {
    // Load saved theme preference from localStorage
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && (savedTheme === 'tactical' || savedTheme === 'artistic')) {
            _deps.setTheme(savedTheme);
        } else {
            // Save initial theme to localStorage
            const initialTheme = document.documentElement.getAttribute('data-theme') || 'artistic';
            localStorage.setItem('theme', initialTheme);
        }
    } catch (e) {
        console.warn('Failed to load/save theme preference:', e);
    }

    // Landing page theme buttons
    document.querySelectorAll('.landing-theme-btn').forEach(btn => {
        btn.addEventListener('click', () => _deps.setTheme(btn.dataset.theme));
    });
}

/**
 * Set up landing page feature chips and comparison slider animation
 * Handles chip selection and image swapping
 */
function setupLandingPage() {
    // Tab data for feature chips - maps chip to screenshot and display name
    const tabData = {
        home: {
            name: 'Salary Timeline',
            img: 'screenshots/tab-home.webp',
            url: 'tejasgadhia.github.io/paylocity-compensation-journey/#home'
        },
        market: {
            name: 'Market Benchmarks',
            img: 'screenshots/tab-market.webp',
            url: 'tejasgadhia.github.io/paylocity-compensation-journey/#market'
        },
        history: {
            name: 'Pay History',
            img: 'screenshots/tab-history.webp',
            url: 'tejasgadhia.github.io/paylocity-compensation-journey/#history'
        },
        analytics: {
            name: 'Growth Analytics',
            img: 'screenshots/tab-analytics.webp',
            url: 'tejasgadhia.github.io/paylocity-compensation-journey/#analytics'
        },
        projections: {
            name: 'Future Projections',
            img: 'screenshots/tab-projections.webp',
            url: 'tejasgadhia.github.io/paylocity-compensation-journey/#projections'
        }
    };

    // Feature chip click handlers - switch "after" image in slider
    const featureChips = document.querySelectorAll('.feature-chip');
    const afterImg = document.getElementById('afterImg');
    const tabIndicator = document.getElementById('tabIndicator');
    const browserUrl = document.getElementById('browserUrl');

    // Get slider reference for reset on chip click (#108, #111)
    const comparisonSliderRef = document.getElementById('comparisonSlider');

    featureChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Update active state
            featureChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            // Get tab info
            const tab = chip.dataset.tab;
            const data = tabData[tab];

            if (data && afterImg && tabIndicator && browserUrl) {
                // Update indicator and URL
                tabIndicator.textContent = data.name;
                browserUrl.textContent = data.url;

                // Swap image with fade effect
                afterImg.style.opacity = '0.5';
                setTimeout(() => {
                    afterImg.src = data.img;
                    afterImg.style.opacity = '1';
                }, 150);

                // Reset slider to show full "after" view (#108, #111)
                // Use setTimeout to let the image swap start first
                if (comparisonSliderRef) {
                    setTimeout(() => {
                        comparisonSliderRef.value = 0;
                    }, 250);
                }
            }
        });
    });

    // Slider animation on page load - sweeping motion to catch attention
    const comparisonSlider = document.getElementById('comparisonSlider');
    if (comparisonSlider) {
        // Wait for component to initialize, then animate
        setTimeout(() => {
            // Animate slider: 50 -> 15 -> 85 -> 50 (sweep left, then right, back to center)
            const animateSlider = () => {
                const duration = 600; // ms per segment
                const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

                const animate = (from, to, onComplete) => {
                    const startTime = performance.now();
                    const step = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const easedProgress = easeInOut(progress);
                        const currentValue = from + (to - from) * easedProgress;
                        comparisonSlider.value = currentValue;

                        if (progress < 1) {
                            requestAnimationFrame(step);
                        } else if (onComplete) {
                            onComplete();
                        }
                    };
                    requestAnimationFrame(step);
                };

                // Chain: 50 -> 15 -> 85 -> 50
                animate(50, 15, () => {
                    animate(15, 85, () => {
                        animate(85, 50);
                    });
                });
            };

            animateSlider();
        }, 800); // Wait for page to settle
    }
}

/**
 * Set up import modal open/close, backdrop click, escape key, and download offline
 * @returns {Function} closeImportModal - Exposed for use by demo controls
 */
function setupImportModal() {
    const importModal = document.getElementById('importModal');
    const openImportBtn = document.getElementById('openImportBtn');
    const closeImportBtn = document.getElementById('closeImportBtn');

    function openImportModal() {
        if (importModal) {
            importModal.classList.add('visible');
            document.body.style.overflow = 'hidden';
            // Update backup UI (show/hide restore button)
            _deps.updateBackupUI();
            // Focus the textarea for immediate pasting
            const pasteInput = document.getElementById('pasteInput');
            if (pasteInput) {
                setTimeout(() => pasteInput.focus(), 100);
            }
        }
    }

    function closeImportModal() {
        if (importModal) {
            importModal.classList.remove('visible');
            document.body.style.overflow = '';

            // Reset legal consent checkbox when closing modal
            const legalConsentCheckbox = document.getElementById('legalConsentCheckbox');
            if (legalConsentCheckbox) {
                legalConsentCheckbox.checked = false;
            }
        }
    }

    if (openImportBtn) {
        openImportBtn.addEventListener('click', openImportModal);
    }

    if (closeImportBtn) {
        closeImportBtn.addEventListener('click', closeImportModal);
    }

    // Close modal on backdrop click
    if (importModal) {
        importModal.addEventListener('click', (e) => {
            if (e.target === importModal) {
                closeImportModal();
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && importModal && importModal.classList.contains('visible')) {
            closeImportModal();
        }
    });

    // Download offline button
    const btnDownloadOffline = document.querySelector('.btn-download-offline');
    if (btnDownloadOffline) {
        btnDownloadOffline.addEventListener('click', _deps.downloadHtmlFile);
    }

    return closeImportModal;
}

/**
 * Set up demo buttons, regenerate, and banner close
 * @param {Function} closeImportModal - Modal close function from setupImportModal
 */
function setupDemoControls(closeImportModal) {
    // Demo buttons (handle multiple on page)
    document.querySelectorAll('.btn-demo').forEach(btn => {
        btn.addEventListener('click', () => {
            closeImportModal(); // Close modal if open
            _deps.loadDemoData();
        });
    });

    // Generate button
    const btnGenerate = document.getElementById('generateBtn');
    if (btnGenerate) {
        btnGenerate.addEventListener('click', _deps.parseAndGenerate);
    }

    // Load JSON text button
    const btnLoadJsonText = document.querySelector('.btn-text-alt');
    if (btnLoadJsonText) {
        btnLoadJsonText.addEventListener('click', () => {
            document.getElementById('jsonFileInput').click();
        });
    }

    // Demo regenerate button
    const btnDemoRegen = document.querySelector('.demo-regenerate-btn');
    if (btnDemoRegen) {
        btnDemoRegen.addEventListener('click', _deps.cycleNextScenario);
    }

    // Demo banner close button
    const btnDemoBannerClose = document.querySelector('.demo-banner-close');
    if (btnDemoBannerClose) {
        btnDemoBannerClose.addEventListener('click', () => {
            document.getElementById('demoBanner').classList.add('hidden');
        });
    }
}

/**
 * Set up dashboard controls: view/theme buttons, save/start over, backup, footer link, tabs
 */
function setupDashboardControls() {
    // Dashboard view mode buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => _deps.setViewMode(btn.dataset.view));
    });

    // Dashboard theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => _deps.setTheme(btn.dataset.theme));
    });

    // Save data button
    const btnSaveData = document.querySelector('.btn-save-data');
    if (btnSaveData) {
        btnSaveData.addEventListener('click', _deps.downloadData);
    }

    // Start over button with confirmation (#20, #142)
    const btnStartOver = document.querySelector('.btn-start-over');
    if (btnStartOver) {
        btnStartOver.addEventListener('click', () => {
            const backup = _deps.loadBackup();
            const backupMsg = backup
                ? '\n\nNote: A backup was saved and can be restored later.'
                : '';

            if (confirm(`Start over? This will clear your current data.${backupMsg}\n\nYou can save your data first using the "Save Data" button.`)) {
                _deps.resetDashboard();
                // Don't clear backup - let user restore if needed
            }
        });
    }

    // Footer Security & Privacy link (#144)
    const footerSecurityLink = document.getElementById('footerSecurityLink');
    if (footerSecurityLink) {
        footerSecurityLink.addEventListener('click', (e) => {
            e.preventDefault();
            _deps.setTab('help');
            setTimeout(() => {
                const securitySection = document.getElementById('security-privacy-section');
                if (securitySection) {
                    securitySection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 100); // Small delay to ensure tab is rendered
        });
    }

    // JSON file input
    const jsonFileInput = document.getElementById('jsonFileInput');
    if (jsonFileInput) {
        jsonFileInput.addEventListener('change', _deps.loadJsonFile);
    }

    // Restore backup button (#142)
    const restoreBackupBtn = document.getElementById('restoreBackupBtn');
    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener('click', _deps.restoreFromBackup);
    }

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => _deps.setTab(btn.dataset.tab));
    });
}

/**
 * Set up chart controls: main chart types, YoY types, projection years/view/slider
 */
function setupChartControls() {
    // Custom rate slider
    // #149: Debounced to prevent chart rebuild on every pixel of drag (was 10-15 rebuilds per adjustment)
    const customRateSlider = document.getElementById('customRateSlider');
    if (customRateSlider) {
        const debouncedUpdateCustomRate = _deps.debounce(_deps.updateCustomRate, 100);
        customRateSlider.addEventListener('input', debouncedUpdateCustomRate);
    }

    // Main chart type buttons
    document.querySelectorAll('.chart-type-btn[data-chart]').forEach(btn => {
        const chartType = btn.dataset.chart;
        if (chartType && ['line', 'area', 'bar', 'step'].includes(chartType)) {
            btn.addEventListener('click', () => _deps.setChartType(chartType));
        } else if (chartType && ['yoy-bar', 'yoy-line'].includes(chartType)) {
            btn.addEventListener('click', () => _deps.setYoyChartType(chartType.replace('yoy-', '')));
        }
    });

    // Projection years buttons
    document.querySelectorAll('.interval-btn[data-years]').forEach(btn => {
        btn.addEventListener('click', () => _deps.setProjectionYears(parseInt(btn.dataset.years, 10)));
    });

    // Projection view buttons
    document.querySelectorAll('.chart-type-btn[data-view]').forEach(btn => {
        btn.addEventListener('click', () => _deps.setProjectionView(btn.dataset.view));
    });
}

/**
 * Set up input validation: paste input debounce, legal consent checkbox
 */
function setupInputValidation() {
    // Paste input textarea
    // #P2-9: Debounce validation to prevent regex firing on every keystroke
    const pasteInput = document.getElementById('pasteInput');
    if (pasteInput) {
        const debouncedValidation = _deps.debounce(_deps.validatePasteInput, 300);
        pasteInput.addEventListener('input', debouncedValidation);
    }

    // Legal consent checkbox
    const legalConsentCheckbox = document.getElementById('legalConsentCheckbox');
    if (legalConsentCheckbox) {
        legalConsentCheckbox.addEventListener('change', _deps.validatePasteInput);
    }
}

// ========================================
// MAIN INITIALIZATION FUNCTION
// ========================================

/**
 * Initialize all DOM event listeners
 * Sets up the domCache and attaches event handlers to UI elements
 * Called once when DOM is ready
 */
export function initEventListeners() {
    // Set up DOM cache and share with app.js
    const domCache = setupDomCache();
    _deps.setDomCache(domCache);

    // Set up feature-specific event listeners
    setupThemePreference();
    setupLandingPage();
    const closeImportModal = setupImportModal();
    setupDemoControls(closeImportModal);
    setupDashboardControls();
    setupChartControls();
    setupInputValidation();
}
