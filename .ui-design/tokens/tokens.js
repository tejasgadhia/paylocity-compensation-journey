/**
 * Paylocity Compensation Journey - Design System Tokens (JavaScript)
 * Generated: 2026-01-21
 *
 * JavaScript module for programmatic access to design tokens.
 * Useful for Chart.js theming, dynamic styling, and theme utilities.
 */

const DesignTokens = {
    // Global
    transitionSpeed: '0.3s',

    // Theme definitions
    themes: {
        tactical: {
            name: 'Tactical',
            description: 'Dark theme - Anduril/Palantir aesthetic',

            colors: {
                background: {
                    primary: '#0a0a0b',
                    secondary: '#111113',
                    tertiary: '#1a1a1d',
                    card: '#141416',
                    hover: '#1e1e21'
                },
                text: {
                    primary: '#e8e8e8',
                    secondary: '#a0a0a0',
                    muted: '#7a7a7a'  // WCAG AA: 4.7:1
                },
                accent: {
                    primary: '#d4a845',      // Gold
                    secondary: '#45d48a',    // Green
                    tertiary: '#4598d4',     // Blue
                    warning: '#d45745'       // Red
                },
                border: {
                    default: '#2a2a2d',
                    accent: '#3a3a3d'
                },
                chart: {
                    grid: 'rgba(255, 255, 255, 0.06)',
                    line1: '#d4a845',
                    line2: '#45d48a',
                    fill1: 'rgba(212, 168, 69, 0.15)',
                    fill2: 'rgba(69, 212, 138, 0.15)'
                },
                tooltip: {
                    background: '#1a1a1d',
                    border: '#3a3a3d'
                }
            },

            typography: {
                fontFamily: {
                    display: "'Space Grotesk', sans-serif",
                    body: "'Space Grotesk', sans-serif",
                    mono: "'JetBrains Mono', monospace"
                }
            },

            borderRadius: {
                sm: '2px',
                md: '4px',
                lg: '6px'
            },

            shadows: {
                card: '0 4px 24px rgba(0, 0, 0, 0.4)',
                hover: '0 8px 32px rgba(0, 0, 0, 0.6)'
            },

            effects: {
                glowPrimary: '0 0 20px rgba(212, 168, 69, 0.3)',
                glowSecondary: '0 0 20px rgba(69, 212, 138, 0.3)'
            }
        },

        artistic: {
            name: 'Artistic',
            description: 'Light theme - Zoho aesthetic',

            colors: {
                background: {
                    primary: '#faf8f5',
                    secondary: '#ffffff',
                    tertiary: '#f5f2ed',
                    card: '#ffffff',
                    hover: '#f0ebe3'
                },
                text: {
                    primary: '#2d2a26',
                    secondary: '#5c5650',
                    muted: '#706a61'  // WCAG AA: 4.8:1
                },
                accent: {
                    primary: '#e85d04',      // Orange
                    secondary: '#0096c7',    // Teal
                    tertiary: '#7b2cbf',     // Purple
                    warning: '#d00000'       // Red
                },
                border: {
                    default: '#e8e2da',
                    accent: '#d4cdc3'
                },
                chart: {
                    grid: 'rgba(0, 0, 0, 0.06)',
                    line1: '#e85d04',
                    line2: '#0096c7',
                    fill1: 'rgba(232, 93, 4, 0.12)',
                    fill2: 'rgba(0, 150, 199, 0.12)'
                },
                tooltip: {
                    background: '#ffffff',
                    border: '#e8e2da'
                }
            },

            typography: {
                fontFamily: {
                    display: "'Libre Baskerville', serif",
                    body: "'Nunito', sans-serif",
                    mono: "'JetBrains Mono', monospace"
                }
            },

            borderRadius: {
                sm: '8px',
                md: '12px',
                lg: '16px'
            },

            shadows: {
                card: '0 4px 20px rgba(45, 42, 38, 0.08)',
                hover: '0 8px 30px rgba(45, 42, 38, 0.12)'
            },

            effects: {
                glowPrimary: 'none',
                glowSecondary: 'none'
            }
        }
    },

    // Font URLs
    fonts: {
        googleUrl: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap"
    }
};

/**
 * Get tokens for a specific theme
 * @param {string} themeName - 'tactical' or 'artistic'
 * @returns {object} Theme tokens
 */
function getTheme(themeName) {
    return DesignTokens.themes[themeName] || DesignTokens.themes.artistic;
}

/**
 * Get the current theme based on data-theme attribute
 * @returns {object} Current theme tokens
 */
function getCurrentTheme() {
    const themeName = document.documentElement.getAttribute('data-theme') || 'artistic';
    return getTheme(themeName);
}

/**
 * Get Chart.js compatible color configuration for current theme
 * @returns {object} Chart.js color config
 */
function getChartColors() {
    const theme = getCurrentTheme();
    return {
        grid: theme.colors.chart.grid,
        line1: theme.colors.chart.line1,
        line2: theme.colors.chart.line2,
        fill1: theme.colors.chart.fill1,
        fill2: theme.colors.chart.fill2,
        text: theme.colors.text.secondary,
        tooltipBg: theme.colors.tooltip.background,
        tooltipBorder: theme.colors.tooltip.border
    };
}

/**
 * Apply theme by setting data-theme attribute
 * @param {string} themeName - 'tactical' or 'artistic'
 */
function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
}

/**
 * Toggle between tactical and artistic themes
 * @returns {string} New theme name
 */
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'artistic';
    const newTheme = current === 'tactical' ? 'artistic' : 'tactical';
    setTheme(newTheme);
    return newTheme;
}

/**
 * Initialize theme from localStorage or default
 */
function initTheme() {
    const saved = localStorage.getItem('theme');
    const theme = saved || 'artistic';
    document.documentElement.setAttribute('data-theme', theme);
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DesignTokens,
        getTheme,
        getCurrentTheme,
        getChartColors,
        setTheme,
        toggleTheme,
        initTheme
    };
}
