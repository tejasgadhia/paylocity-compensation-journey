/**
 * Unit Tests for Chart Functions Module
 *
 * Tests chart utility functions from js/charts.js:
 * - getThemeColors() - CSS custom property extraction
 * - getChartContext() - Canvas context validation
 * - getTooltipConfig() - Tooltip configuration factory
 * - initCharts() - Dependency injection
 * - updateChartTheme() - Theme update logic
 *
 * Note: Chart build/update functions are tested via E2E tests
 * since they require full DOM and Chart.js integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Chart.js before importing charts module
vi.mock('chart.js', () => ({
    Chart: vi.fn()
}));

// We need to set up DOM mocks before importing the module
const mockShowUserMessage = vi.fn();
const mockGetEmployeeData = vi.fn();

// Mock CSS custom properties
const mockCssProperties = {
    '--chart-line-1': '#fca311',
    '--chart-line-2': '#4c9a83',
    '--chart-fill-1': 'rgba(252, 163, 17, 0.2)',
    '--chart-fill-2': 'rgba(76, 154, 131, 0.2)',
    '--chart-grid': 'rgba(0, 0, 0, 0.1)',
    '--text-secondary': '#5c5650',
    '--accent-primary': '#e87d0d'
};

describe('Chart Module', () => {
    let chartsModule;
    let mockState;
    let mockCharts;
    let originalDocument;
    let originalGetComputedStyle;

    beforeEach(async () => {
        // Save original globals
        originalDocument = global.document;
        originalGetComputedStyle = global.getComputedStyle;

        // Reset mocks
        mockShowUserMessage.mockClear();
        mockGetEmployeeData.mockClear();

        // Set up mock state
        mockState = {
            theme: 'artistic',
            showDollars: true,
            mainChartType: 'line',
            yoyChartType: 'bar',
            projectionYears: 5,
            customRate: 8
        };

        mockCharts = {
            main: null,
            yoy: null,
            projection: null
        };

        // Mock getComputedStyle
        global.getComputedStyle = vi.fn(() => ({
            getPropertyValue: (prop) => mockCssProperties[prop] || ''
        }));

        // Mock document.documentElement
        global.document = {
            documentElement: {},
            getElementById: vi.fn((id) => {
                if (id === 'mainChart' || id === 'yoyChart' || id === 'projectionChart') {
                    return {
                        getContext: vi.fn(() => ({
                            // Mock 2D context
                            fillRect: vi.fn(),
                            clearRect: vi.fn()
                        }))
                    };
                }
                if (id === 'mainChartLoading') {
                    return { classList: { add: vi.fn() } };
                }
                return null;
            }),
            createElement: vi.fn(() => ({
                style: {}
            }))
        };

        // Import module after mocks are set up
        chartsModule = await import('../js/charts.js');

        // Initialize the module
        chartsModule.initCharts({
            state: mockState,
            charts: mockCharts,
            getEmployeeData: mockGetEmployeeData,
            showUserMessage: mockShowUserMessage
        });
    });

    afterEach(() => {
        // Restore globals
        global.document = originalDocument;
        global.getComputedStyle = originalGetComputedStyle;
        vi.resetModules();
    });

    describe('initCharts (Dependency Injection)', () => {
        it('initializes module with provided dependencies', async () => {
            // Re-import and reinitialize to test
            const newModule = await import('../js/charts.js');
            const newState = { theme: 'tactical' };
            const newCharts = { main: null };
            const newGetData = vi.fn();
            const newShowMsg = vi.fn();

            newModule.initCharts({
                state: newState,
                charts: newCharts,
                getEmployeeData: newGetData,
                showUserMessage: newShowMsg
            });

            // Test that dependencies are used by calling getTooltipConfig
            const config = newModule.getTooltipConfig();
            expect(config.backgroundColor).toBe('#1a1a1d'); // tactical theme
        });
    });

    describe('getThemeColors', () => {
        it('returns all required theme color properties', () => {
            const colors = chartsModule.getThemeColors();

            expect(colors).toHaveProperty('line1');
            expect(colors).toHaveProperty('line2');
            expect(colors).toHaveProperty('fill1');
            expect(colors).toHaveProperty('fill2');
            expect(colors).toHaveProperty('grid');
            expect(colors).toHaveProperty('text');
            expect(colors).toHaveProperty('accent');
        });

        it('retrieves colors from CSS custom properties', () => {
            const colors = chartsModule.getThemeColors();

            expect(colors.line1).toBe('#fca311');
            expect(colors.line2).toBe('#4c9a83');
            expect(colors.fill1).toBe('rgba(252, 163, 17, 0.2)');
        });

        it('trims whitespace from CSS values', () => {
            global.getComputedStyle = vi.fn(() => ({
                getPropertyValue: (prop) => '  #ffffff  '
            }));

            const colors = chartsModule.getThemeColors();

            expect(colors.line1).toBe('#ffffff');
        });
    });

    describe('getChartContext', () => {
        it('returns 2D context for valid canvas', () => {
            const ctx = chartsModule.getChartContext('mainChart', 'Main chart');

            expect(ctx).not.toBeNull();
            expect(global.document.getElementById).toHaveBeenCalledWith('mainChart');
        });

        it('returns null and shows error for missing canvas', () => {
            const ctx = chartsModule.getChartContext('nonexistent', 'Test chart');

            expect(ctx).toBeNull();
            expect(mockShowUserMessage).toHaveBeenCalledWith(
                'Test chart rendering failed. Please refresh the page.',
                'error'
            );
        });

        it('returns null and shows error when context unavailable', () => {
            global.document.getElementById = vi.fn(() => ({
                getContext: vi.fn(() => null)
            }));

            const ctx = chartsModule.getChartContext('mainChart', 'Main chart');

            expect(ctx).toBeNull();
            expect(mockShowUserMessage).toHaveBeenCalledWith(
                'Main chart rendering failed. Your browser may not support this feature.',
                'error'
            );
        });

        it('logs appropriate error messages', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            chartsModule.getChartContext('nonexistent', 'Missing chart');

            expect(consoleSpy).toHaveBeenCalledWith('Missing chart: Canvas element not found');
            consoleSpy.mockRestore();
        });
    });

    describe('getTooltipConfig', () => {
        it('returns default tooltip configuration', () => {
            const config = chartsModule.getTooltipConfig();

            expect(config).toHaveProperty('backgroundColor');
            expect(config).toHaveProperty('titleColor');
            expect(config).toHaveProperty('bodyColor');
            expect(config).toHaveProperty('borderColor');
            expect(config).toHaveProperty('borderWidth', 1);
            expect(config).toHaveProperty('padding', 12);
            expect(config).toHaveProperty('displayColors', false);
            expect(config).toHaveProperty('callbacks');
        });

        it('uses artistic theme colors by default', () => {
            mockState.theme = 'artistic';
            const config = chartsModule.getTooltipConfig();

            expect(config.backgroundColor).toBe('#ffffff');
            expect(config.titleColor).toBe('#2d2a26');
            expect(config.bodyColor).toBe('#5c5650');
        });

        it('uses tactical theme colors when theme is tactical', async () => {
            mockState.theme = 'tactical';
            const config = chartsModule.getTooltipConfig();

            expect(config.backgroundColor).toBe('#1a1a1d');
            expect(config.titleColor).toBe('#e8e8e8');
            expect(config.bodyColor).toBe('#a0a0a0');
        });

        it('accepts custom labelCallback', () => {
            const customCallback = (ctx) => `Custom: ${ctx.raw}`;
            const config = chartsModule.getTooltipConfig({ labelCallback: customCallback });

            expect(config.callbacks.label).toBe(customCallback);
        });

        it('accepts custom padding', () => {
            const config = chartsModule.getTooltipConfig({ padding: 20 });

            expect(config.padding).toBe(20);
        });

        it('accepts displayColors option', () => {
            const config = chartsModule.getTooltipConfig({ displayColors: true });

            expect(config.displayColors).toBe(true);
        });

        it('default label callback returns raw value', () => {
            const config = chartsModule.getTooltipConfig();
            const mockContext = { raw: 12345 };

            const result = config.callbacks.label(mockContext);

            expect(result).toBe('12345');
        });
    });

    describe('updateChartTheme', () => {
        let mockChart;

        beforeEach(() => {
            mockChart = {
                data: {
                    datasets: [
                        {
                            borderColor: '#old',
                            backgroundColor: '#old-bg',
                            pointBackgroundColor: '#old',
                            pointBorderColor: '#old',
                            datasetType: 'mainSalary'
                        }
                    ]
                },
                options: {
                    scales: {
                        x: { grid: { color: '#old' }, ticks: { color: '#old' } },
                        y: { grid: { color: '#old' }, ticks: { color: '#old' } }
                    },
                    plugins: {
                        tooltip: {
                            backgroundColor: '#old',
                            titleColor: '#old',
                            bodyColor: '#old',
                            borderColor: '#old'
                        },
                        legend: {
                            labels: { color: '#old' }
                        }
                    }
                },
                update: vi.fn()
            };
        });

        it('does nothing for null chart', () => {
            // Should not throw
            chartsModule.updateChartTheme(null);
        });

        it('updates dataset colors based on datasetType', () => {
            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.data.datasets[0].borderColor).toBe('#fca311'); // line1
            expect(mockChart.data.datasets[0].pointBackgroundColor).toBe('#fca311');
            expect(mockChart.data.datasets[0].pointBorderColor).toBe('#fca311');
        });

        it('updates grid and tick colors', () => {
            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.options.scales.x.grid.color).toBe('rgba(0, 0, 0, 0.1)');
            expect(mockChart.options.scales.x.ticks.color).toBe('#5c5650');
            expect(mockChart.options.scales.y.grid.color).toBe('rgba(0, 0, 0, 0.1)');
            expect(mockChart.options.scales.y.ticks.color).toBe('#5c5650');
        });

        it('updates tooltip colors for artistic theme', () => {
            mockState.theme = 'artistic';
            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.options.plugins.tooltip.backgroundColor).toBe('#ffffff');
            expect(mockChart.options.plugins.tooltip.titleColor).toBe('#2d2a26');
        });

        it('updates tooltip colors for tactical theme', () => {
            mockState.theme = 'tactical';
            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.options.plugins.tooltip.backgroundColor).toBe('#1a1a1d');
            expect(mockChart.options.plugins.tooltip.titleColor).toBe('#e8e8e8');
        });

        it('updates legend label colors', () => {
            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.options.plugins.legend.labels.color).toBe('#5c5650'); // text color
        });

        it('calls chart.update with "none" animation mode', () => {
            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.update).toHaveBeenCalledWith('none');
        });

        it('handles yoyGrowth datasetType', () => {
            mockChart.data.datasets[0].datasetType = 'yoyGrowth';

            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.data.datasets[0].borderColor).toBe('#4c9a83'); // line2
        });

        it('handles historicalCAGR datasetType', () => {
            mockChart.data.datasets[0].datasetType = 'historicalCAGR';

            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.data.datasets[0].borderColor).toBe('#fca311'); // line1
        });

        it('handles custom datasetType', () => {
            mockChart.data.datasets[0].datasetType = 'custom';

            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.data.datasets[0].borderColor).toBe('#4c9a83'); // line2
        });

        it('handles conservative datasetType with tactical theme', () => {
            mockChart.data.datasets[0].datasetType = 'conservative';
            mockState.theme = 'tactical';

            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.data.datasets[0].borderColor).toBe('#666');
        });

        it('handles conservative datasetType with artistic theme', () => {
            mockChart.data.datasets[0].datasetType = 'conservative';
            mockState.theme = 'artistic';

            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.data.datasets[0].borderColor).toBe('#8a837a');
        });

        it('handles optimistic datasetType with tactical theme', () => {
            mockChart.data.datasets[0].datasetType = 'optimistic';
            mockState.theme = 'tactical';

            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.data.datasets[0].borderColor).toBe('#4598d4');
        });

        it('handles optimistic datasetType with artistic theme', () => {
            mockChart.data.datasets[0].datasetType = 'optimistic';
            mockState.theme = 'artistic';

            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.data.datasets[0].borderColor).toBe('#7b2cbf');
        });

        it('updates background color for area chart type', () => {
            mockChart.data.datasets[0].datasetType = 'mainSalary';
            mockChart.data.datasets[0].backgroundColor = '#old';
            mockState.mainChartType = 'area';

            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.data.datasets[0].backgroundColor).toBe('rgba(252, 163, 17, 0.2)'); // fill1
        });

        it('updates background color for bar chart type', () => {
            mockChart.data.datasets[0].datasetType = 'mainSalary';
            mockChart.data.datasets[0].backgroundColor = '#old';
            mockState.mainChartType = 'bar';

            chartsModule.updateChartTheme(mockChart);

            expect(mockChart.data.datasets[0].backgroundColor).toBe('#fca311'); // line1
        });

        it('handles missing scales gracefully', () => {
            delete mockChart.options.scales;

            // Should not throw
            chartsModule.updateChartTheme(mockChart);
            expect(mockChart.update).toHaveBeenCalled();
        });

        it('handles missing tooltip plugin gracefully', () => {
            delete mockChart.options.plugins.tooltip;

            // Should not throw
            chartsModule.updateChartTheme(mockChart);
            expect(mockChart.update).toHaveBeenCalled();
        });

        it('handles missing legend labels gracefully', () => {
            delete mockChart.options.plugins.legend.labels;

            // Should not throw
            chartsModule.updateChartTheme(mockChart);
            expect(mockChart.update).toHaveBeenCalled();
        });
    });
});

describe('Chart Build Functions (Integration)', () => {
    // These tests verify the chart build functions don't throw
    // when called with mocked dependencies. Full E2E testing
    // is done in tests/e2e/*.spec.js

    let chartsModule;
    let mockState;
    let mockCharts;

    beforeEach(async () => {
        mockState = {
            theme: 'artistic',
            showDollars: true,
            mainChartType: 'line',
            yoyChartType: 'bar',
            projectionYears: 5,
            customRate: 8
        };

        mockCharts = {
            main: null,
            yoy: null,
            projection: null
        };

        // Mock getComputedStyle
        global.getComputedStyle = vi.fn(() => ({
            getPropertyValue: () => '#000000'
        }));

        // Mock document
        global.document = {
            documentElement: {},
            getElementById: vi.fn(() => null) // Return null to skip chart creation
        };

        chartsModule = await import('../js/charts.js');
        chartsModule.initCharts({
            state: mockState,
            charts: mockCharts,
            getEmployeeData: vi.fn(() => null), // No employee data
            showUserMessage: vi.fn()
        });
    });

    afterEach(() => {
        vi.resetModules();
    });

    it('buildMainChart handles missing employee data', () => {
        // Should not throw
        chartsModule.buildMainChart();
    });

    it('buildYoyChart handles missing employee data', () => {
        // Should not throw
        chartsModule.buildYoyChart();
    });

    it('buildProjectionChart handles missing employee data', () => {
        // Should not throw
        chartsModule.buildProjectionChart();
    });

    it('updateMainChartType handles missing chart', () => {
        // Should not throw (falls back to buildMainChart)
        chartsModule.updateMainChartType();
    });

    it('updateYoyChartType handles missing chart', () => {
        // Should not throw (falls back to buildYoyChart)
        chartsModule.updateYoyChartType();
    });

    it('updateMainChartData handles missing employee data', () => {
        // Should not throw
        chartsModule.updateMainChartData();
    });

    it('updateYoyChartData handles missing employee data', () => {
        // Should not throw
        chartsModule.updateYoyChartData();
    });

    it('updateProjectionChartData handles missing employee data', () => {
        // Should not throw
        chartsModule.updateProjectionChartData();
    });
});
