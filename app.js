// ========================================
// IMPORTS
// ========================================

import { CONSTANTS, cpiData, benchmarks } from './js/constants.js';
import {
    calculateInflationOverPeriod,
    calculateRealGrowth,
    calculateInflationAdjustedSalary
} from './js/calculations.js';
import {
    validateSalaryRange,
    parseRecord,
    parsePaylocityData
} from './js/parser.js';

// ========================================
// MOBILE/TABLET DETECTION
// ========================================

// Only run mobile detection in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    (function() {
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent);
        const isSmallScreen = window.innerWidth < CONSTANTS.MOBILE_BREAKPOINT;

        if (isMobileUA || isSmallScreen) {
            document.getElementById('mobileSplash').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        // Also check on resize
        window.addEventListener('resize', function() {
            if (window.innerWidth < CONSTANTS.MOBILE_BREAKPOINT) {
                document.getElementById('mobileSplash').classList.add('active');
                document.body.style.overflow = 'hidden';
            } else if (!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(navigator.userAgent))) {
                document.getElementById('mobileSplash').classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    })();
}

// ========================================
// DOWNLOAD FUNCTION
// ========================================

function downloadHtmlFile() {
    const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compensation-journey.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ========================================
// STATE
// ========================================

let employeeData = null;

let state = {
    theme: 'artistic',
    showDollars: true,
    currentTab: 'home',
    mainChartType: 'line',
    yoyChartType: 'bar',
    projectionYears: 5,
    customRate: 8,
    currentScenarioIndex: 0
};

let charts = {
    main: null,
    yoy: null,
    category: null,
    projection: null
};


// ========================================
// BENCHMARK CALCULATION FUNCTIONS
// ========================================
// (Moved to js/calculations.js - imported above)

function getBenchmarkComparisons() {
    if (!employeeData) return null;
    
    const raises = employeeData.records.filter(r => r.changePercent > 0);
    const avgRaise = raises.length > 0 
        ? raises.reduce((sum, r) => sum + r.changePercent, 0) / raises.length 
        : 0;
    
    const userCagr = calculateCAGR();
    const years = calculateYearsOfService();
    const hireDate = new Date(employeeData.hireDate);
    const currentDate = new Date(employeeData.currentDate);
    const startYear = hireDate.getFullYear();
    const startMonth = hireDate.getMonth();
    const endYear = currentDate.getFullYear();
    const endMonth = currentDate.getMonth();
    
    // Calculate time between raises (exclude "New Hire" - it's the starting point)
    const adjustments = employeeData.records.filter(r => r.reason !== 'New Hire');
    const dates = adjustments.map(r => new Date(r.date)).sort((a, b) => a - b);
    let totalDays = 0;
    for (let i = 1; i < dates.length; i++) {
        totalDays += (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
    }
    const avgMonthsBetween = dates.length > 1 ? (totalDays / (dates.length - 1)) / 30.44 : 12;
    
    // Inflation calculations (with partial year support)
    const totalInflation = calculateInflationOverPeriod(startYear, endYear, startMonth, endMonth);
    const startSalary = getStartingSalary();
    const currentSalary = getCurrentSalary();
    const nominalGrowth = ((currentSalary - startSalary) / startSalary) * 100;
    const realGrowth = calculateRealGrowth(nominalGrowth, totalInflation);
    
    // What starting salary would be worth today (inflation-adjusted)
    const inflationAdjustedStart = calculateInflationAdjustedSalary(startSalary, startYear, endYear);
    const purchasingPowerGain = currentSalary - inflationAdjustedStart;
    
    // Industry comparison: what would salary be at industry CAGR?
    const industryProjectedSalary = startSalary * Math.pow(1 + benchmarks.industryCagr / 100, years);
    
    return {
        // User metrics
        avgRaise,
        userCagr,
        avgMonthsBetween,
        totalRaises: raises.length,
        
        // Growth comparisons
        nominalGrowth,
        totalInflation,
        realGrowth,
        inflationAdjustedStart,
        purchasingPowerGain,
        
        // Industry comparisons
        industryProjectedSalary,
        vsIndustrySalary: currentSalary - industryProjectedSalary,
        vsIndustryPercent: ((currentSalary / industryProjectedSalary) - 1) * 100,
        
        // Raise comparisons
        raiseVsTypical: avgRaise - benchmarks.typicalRaise.avg,
        raiseVsHighPerformer: avgRaise - benchmarks.highPerformerRaise.avg,
        cagrVsIndustry: userCagr - benchmarks.industryCagr,
        
        // Timing comparisons
        raisesMoreFrequent: benchmarks.avgMonthsBetweenRaises - avgMonthsBetween,
        
        // Performance tier
        performanceTier: avgRaise >= benchmarks.highPerformerRaise.min ? 'high' :
                         avgRaise >= benchmarks.typicalRaise.avg ? 'solid' : 'below'
    };
}

// ========================================
// SECURITY HELPERS
// ========================================

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Converts characters that have special meaning in HTML to their entity equivalents.
 *
 * **Security Context:**
 * This function protects against XSS (Cross-Site Scripting) attacks by escaping
 * user-provided data before inserting it into HTML via innerHTML. Even though the
 * parser uses a whitelist approach for the 'reason' field, this provides defense
 * in depth at the display layer.
 *
 * **When to Use:**
 * - Always escape user-provided strings before inserting via innerHTML
 * - Especially important for the 'reason' field from Paylocity data
 * - Use for any data that could potentially contain malicious input
 *
 * **Where Used:**
 * - buildHistoryTable() - Escapes r.reason before display
 * - buildMilestones() - Escapes milestone text fields
 *
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for insertion into HTML
 *
 * @example
 * escapeHTML('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 *
 * @example
 * // Safe usage in template literal
 * element.innerHTML = `<span>${escapeHTML(userInput)}</span>`;
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
// PARSER
// ========================================
// (Moved to js/parser.js - imported above)

// ========================================
// CHART.JS LAZY LOADING
// ========================================

async function loadChartJS() {
    // If Chart.js already loaded, return immediately
    if (window.Chart) return;

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            console.info('Chart.js loaded successfully');
            resolve();
        };
        script.onerror = () => {
            const error = 'Failed to load Chart.js library';
            console.error(error);
            showUserMessage('Failed to load charting library. Please refresh and try again.', 'error');
            reject(new Error(error));
        };
        document.head.appendChild(script);
    });
}

// ========================================
// PARSE AND GENERATE
// ========================================

async function parseAndGenerate() {
    const input = document.getElementById('pasteInput').value.trim();
    const messageDiv = document.getElementById('validationMessage');
    
    if (!input) {
        messageDiv.className = 'validation-message error visible';
        messageDiv.textContent = '✗ Please paste your Paylocity data first.';
        return;
    }
    
    try {
        employeeData = parsePaylocityData(input);
        
        if (employeeData.records.length < 2) {
            throw new Error('Need at least 2 records to generate insights');
        }
        
        // Check if there are any actual adjustments (not just New Hire)
        const adjustments = employeeData.records.filter(r => r.reason !== 'New Hire');
        if (adjustments.length === 0) {
            throw new Error('No salary adjustments found. You may be too new to have raise history yet');
        }
        
        employeeData.isDemo = false;
        messageDiv.className = 'validation-message';

        // Lazy-load Chart.js before showing dashboard (performance optimization)
        await loadChartJS();

        showDashboard();
        // Hide demo banner for real data
        document.getElementById('demoBanner').classList.add('hidden');
        // Update URL (removes demo flag)
        updateUrlParams();
    } catch (e) {
        console.error('Parse error:', e);
        messageDiv.className = 'validation-message error visible';
        messageDiv.textContent = `✗ ${e.message}. Please make sure you copied from "Rates" down to "items".`;
    }
}

// ========================================
// REAL-TIME VALIDATION
// ========================================

function validatePasteInput() {
    const input = document.getElementById('pasteInput').value.trim();
    const messageDiv = document.getElementById('validationMessage');
    const generateBtn = document.getElementById('generateBtn');
    
    if (!input) {
        messageDiv.className = 'validation-message';
        messageDiv.textContent = '';
        generateBtn.disabled = true;
        return;
    }
    
    // Check for date patterns (MM/DD/YYYY)
    const datePattern = /\d{2}\/\d{2}\/\d{4}/g;
    const dates = input.match(datePattern) || [];
    
    // Check for dollar amounts with exactly 2 decimal places (standard currency)
    const dollarPattern = /\$[0-9,]+\.\d{2}/g;
    const dollars = input.match(dollarPattern) || [];
    
    // Check for key structural indicators
    const hasRates = /rates/i.test(input);
    const hasCurrent = /current/i.test(input);
    const hasHistory = /history/i.test(input);
    const hasItems = /items/i.test(input);
    const hasSalary = /salary/i.test(input);
    
    // Validation checks
    if (dates.length === 0) {
        messageDiv.className = 'validation-message error visible';
        messageDiv.textContent = '✗ No dates found. Make sure you copied the table data including dates (MM/DD/YYYY format).';
        generateBtn.disabled = true;
        return;
    }
    
    if (dollars.length === 0) {
        messageDiv.className = 'validation-message error visible';
        messageDiv.textContent = '✗ No salary amounts found. Make sure "Show Private Data" is enabled in Paylocity.';
        generateBtn.disabled = true;
        return;
    }
    
    if (!hasSalary) {
        messageDiv.className = 'validation-message warning visible';
        messageDiv.textContent = '⚠ Data looks incomplete. Make sure you copied from the Rates tab.';
        generateBtn.disabled = false;
        return;
    }
    
    if (!hasHistory && dates.length < 3) {
        messageDiv.className = 'validation-message warning visible';
        messageDiv.textContent = '⚠ Only ' + dates.length + ' record(s) found. Did you include the History table?';
        generateBtn.disabled = false;
        return;
    }
    
    if (dollars.length < dates.length) {
        messageDiv.className = 'validation-message warning visible';
        messageDiv.textContent = '⚠ Found ' + dates.length + ' dates but only ' + dollars.length + ' salary values. Some data may be missing.';
        generateBtn.disabled = false;
        return;
    }
    
    // Success
    messageDiv.className = 'validation-message success visible';
    messageDiv.textContent = '✓ Found ' + dates.length + ' compensation records. Ready to generate!';
    generateBtn.disabled = false;
}

// ========================================
// DEMO DATA - Multiple Scenarios
// ========================================

const DEMO_SCENARIOS = [
    {
        id: 1,
        name: "Early Career",
        description: "2 years tenure",
        hireDate: "2023-03-15",
        currentDate: "2025-01-15",
        records: [
            { date: "2025-01-15", reason: "Merit Increase", perCheck: 3125.00, annual: 75000.00, hourlyRate: 36.06, change: 208.33, changePercent: 7.14 },
            { date: "2024-03-01", reason: "Merit Increase", perCheck: 2916.67, annual: 70000.00, hourlyRate: 33.65, change: 208.33, changePercent: 7.69 },
            { date: "2023-09-01", reason: "Equity", perCheck: 2708.33, annual: 65000.00, hourlyRate: 31.25, change: 208.33, changePercent: 8.33 },
            { date: "2023-03-15", reason: "New Hire", perCheck: 2500.00, annual: 60000.00, hourlyRate: 28.85, change: 0, changePercent: 0 }
        ]
    },
    {
        id: 2,
        name: "Growth Phase",
        description: "5 years tenure",
        hireDate: "2020-02-01",
        currentDate: "2025-01-15",
        records: [
            { date: "2025-01-15", reason: "Merit Increase", perCheck: 4166.67, annual: 100000.00, hourlyRate: 48.08, change: 375.00, changePercent: 9.89 },
            { date: "2024-02-15", reason: "Promotion", perCheck: 3791.67, annual: 91000.00, hourlyRate: 43.75, change: 458.33, changePercent: 13.75 },
            { date: "2023-02-01", reason: "Merit Increase", perCheck: 3333.33, annual: 80000.00, hourlyRate: 38.46, change: 208.33, changePercent: 6.67 },
            { date: "2022-03-01", reason: "Market Adjustment", perCheck: 3125.00, annual: 75000.00, hourlyRate: 36.06, change: 291.67, changePercent: 10.34 },
            { date: "2021-02-15", reason: "Merit Increase", perCheck: 2833.33, annual: 68000.00, hourlyRate: 32.69, change: 166.67, changePercent: 5.43 },
            { date: "2020-08-01", reason: "Equity", perCheck: 2666.67, annual: 64000.00, hourlyRate: 30.77, change: 166.67, changePercent: 6.67 },
            { date: "2020-02-01", reason: "New Hire", perCheck: 2500.00, annual: 60000.00, hourlyRate: 28.85, change: 0, changePercent: 0 }
        ]
    },
    {
        id: 3,
        name: "Established",
        description: "8 years tenure",
        hireDate: "2017-06-15",
        currentDate: "2025-01-15",
        records: [
            { date: "2025-01-15", reason: "Merit Increase", perCheck: 5416.67, annual: 130000.00, hourlyRate: 62.50, change: 416.67, changePercent: 8.33 },
            { date: "2024-01-15", reason: "Merit Increase", perCheck: 5000.00, annual: 120000.00, hourlyRate: 57.69, change: 416.67, changePercent: 9.09 },
            { date: "2023-02-01", reason: "Promotion", perCheck: 4583.33, annual: 110000.00, hourlyRate: 52.88, change: 625.00, changePercent: 15.38 },
            { date: "2022-02-15", reason: "Merit Increase", perCheck: 3958.33, annual: 95000.00, hourlyRate: 45.67, change: 291.67, changePercent: 8.11 },
            { date: "2021-03-01", reason: "Merit Increase", perCheck: 3666.67, annual: 88000.00, hourlyRate: 42.31, change: 250.00, changePercent: 7.32 },
            { date: "2020-02-15", reason: "Market Adjustment", perCheck: 3416.67, annual: 82000.00, hourlyRate: 39.42, change: 333.33, changePercent: 10.81 },
            { date: "2019-02-01", reason: "Merit Increase", perCheck: 3083.33, annual: 74000.00, hourlyRate: 35.58, change: 208.33, changePercent: 7.25 },
            { date: "2018-06-15", reason: "Merit Increase", perCheck: 2875.00, annual: 69000.00, hourlyRate: 33.17, change: 208.33, changePercent: 7.69 },
            { date: "2017-12-01", reason: "Equity", perCheck: 2666.67, annual: 64000.00, hourlyRate: 30.77, change: 166.67, changePercent: 6.67 },
            { date: "2017-06-15", reason: "New Hire", perCheck: 2500.00, annual: 60000.00, hourlyRate: 28.85, change: 0, changePercent: 0 }
        ]
    },
    {
        id: 4,
        name: "Senior Tenure",
        description: "12 years tenure",
        hireDate: "2013-01-15",
        currentDate: "2025-01-15",
        records: [
            { date: "2025-01-15", reason: "Merit Increase", perCheck: 7916.67, annual: 190000.00, hourlyRate: 91.35, change: 416.67, changePercent: 5.56 },
            { date: "2024-02-01", reason: "Merit Increase", perCheck: 7500.00, annual: 180000.00, hourlyRate: 86.54, change: 416.67, changePercent: 5.88 },
            { date: "2023-01-15", reason: "Merit Increase", perCheck: 7083.33, annual: 170000.00, hourlyRate: 81.73, change: 416.67, changePercent: 6.25 },
            { date: "2022-02-15", reason: "Promotion", perCheck: 6666.67, annual: 160000.00, hourlyRate: 76.92, change: 833.33, changePercent: 14.29 },
            { date: "2021-02-01", reason: "Merit Increase", perCheck: 5833.33, annual: 140000.00, hourlyRate: 67.31, change: 416.67, changePercent: 7.69 },
            { date: "2020-03-01", reason: "Market Adjustment", perCheck: 5416.67, annual: 130000.00, hourlyRate: 62.50, change: 625.00, changePercent: 12.50 },
            { date: "2019-02-15", reason: "Merit Increase", perCheck: 4791.67, annual: 115000.00, hourlyRate: 55.29, change: 416.67, changePercent: 9.52 },
            { date: "2018-02-01", reason: "Promotion", perCheck: 4375.00, annual: 105000.00, hourlyRate: 50.48, change: 625.00, changePercent: 16.22 },
            { date: "2017-03-01", reason: "Merit Increase", perCheck: 3750.00, annual: 90000.00, hourlyRate: 43.27, change: 291.67, changePercent: 8.43 },
            { date: "2016-02-15", reason: "Merit Increase", perCheck: 3458.33, annual: 83000.00, hourlyRate: 39.90, change: 208.33, changePercent: 6.49 },
            { date: "2015-03-01", reason: "Market Adjustment", perCheck: 3250.00, annual: 78000.00, hourlyRate: 37.50, change: 333.33, changePercent: 11.43 },
            { date: "2014-02-15", reason: "Merit Increase", perCheck: 2916.67, annual: 70000.00, hourlyRate: 33.65, change: 208.33, changePercent: 7.69 },
            { date: "2013-08-01", reason: "Equity", perCheck: 2708.33, annual: 65000.00, hourlyRate: 31.25, change: 208.33, changePercent: 8.33 },
            { date: "2013-01-15", reason: "New Hire", perCheck: 2500.00, annual: 60000.00, hourlyRate: 28.85, change: 0, changePercent: 0 }
        ]
    }
];

async function loadDemoData(scenarioIndex = null) {
    // If no index provided, use current state index
    if (scenarioIndex === null) {
        scenarioIndex = state.currentScenarioIndex;
    } else {
        state.currentScenarioIndex = scenarioIndex;
    }

    const scenario = DEMO_SCENARIOS[scenarioIndex];

    employeeData = {
        hireDate: scenario.hireDate,
        currentDate: scenario.currentDate,
        records: [...scenario.records], // Clone to prevent mutation
        isDemo: true,
        scenarioId: scenario.id
    };

    // Lazy-load Chart.js before showing dashboard (performance optimization)
    await loadChartJS();

    showDashboard();
    
    // Update demo banner
    document.getElementById('demoBanner').classList.remove('hidden');
    updateScenarioLabel();
    
    // Update URL
    updateUrlParams();
}

async function cycleNextScenario() {
    // Move to next scenario (wrap around)
    state.currentScenarioIndex = (state.currentScenarioIndex + 1) % DEMO_SCENARIOS.length;

    // Destroy existing charts before regenerating
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    charts = { main: null, yoy: null, category: null, projection: null };

    // Load the new scenario
    await loadDemoData(state.currentScenarioIndex);
}

function updateScenarioLabel() {
    const scenario = DEMO_SCENARIOS[state.currentScenarioIndex];
    const label = document.getElementById('scenarioLabel');
    if (label) {
        label.textContent = `Scenario ${scenario.id}: ${scenario.name} (${scenario.description})`;
    }
}

// ========================================
// FILE HANDLING
// ========================================

function loadJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            employeeData = JSON.parse(e.target.result);
            if (!employeeData.records || !employeeData.hireDate) {
                throw new Error('Invalid data format');
            }
            employeeData.isDemo = false;
            showDashboard();
            // Hide demo banner for loaded data
            document.getElementById('demoBanner').classList.add('hidden');
            // Update URL (removes demo flag)
            updateUrlParams();
        } catch (err) {
            alert('Error loading file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function downloadData() {
    if (!employeeData) return;
    
    const dataStr = JSON.stringify(employeeData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compensation-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ========================================
// VIEW SWITCHING
// ========================================

function showDashboard() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    window.scrollTo(0, 0);
    initDashboard();
    checkInitialHash(); // Check URL hash for tab navigation

    // Focus management for accessibility - move focus to dashboard heading
    setTimeout(() => {
        const heading = document.querySelector('.logo-text h1');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus();
        }
    }, 100);
}

function resetDashboard() {
    // Destroy all charts
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    charts = { main: null, yoy: null, category: null, projection: null };
    
    // Reset state
    state.currentTab = 'home';
    employeeData = null;
    
    // Update URL - keep theme, remove demo
    const params = new URLSearchParams();
    params.set('theme', state.theme);
    history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    
    // Show landing page
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('landingPage').classList.remove('hidden');
    
    // Clear paste area and validation
    document.getElementById('pasteInput').value = '';
    document.getElementById('validationMessage').className = 'validation-message';
    document.getElementById('generateBtn').disabled = true;
}

// ========================================
// STORY CONTENT
// ========================================

const storyContent = {
    tactical: {
        title: "Mission Debrief: Compensation Trajectory",
        subtitle: "Classification: Personnel Valuation Report",
        getText: (data) => `
            <p><span class="story-highlight">MISSION START:</span> Specialist deployed on <span class="story-stat">${data.hireDateFormatted}</span> with initial resource allocation of <span class="story-stat">${data.startSalary}</span>. Operational status: New Hire. Initial positioning established within standard parameters for role classification.</p>
            
            <p><span class="story-highlight">OPERATIONAL SUMMARY:</span> Over <span class="story-stat">${data.years} years</span> of continuous deployment, the specialist has demonstrated consistent value appreciation. Total resource adjustments: <span class="story-stat">${data.totalAdjustments} modifications</span>. Current valuation stands at <span class="story-stat">${data.currentSalary}</span>, representing a <span class="story-stat">${data.growth}%</span> increase from baseline. Adjustment frequency exceeds standard annual review cycles, indicating active performance recognition protocols.</p>
            
            <p><span class="story-highlight">PERFORMANCE METRICS:</span> Compound Annual Growth Rate (CAGR) calculated at <span class="story-stat">${data.cagr}%</span>. Average interval between resource reallocations: <span class="story-stat">${data.avgInterval} months</span>. Primary adjustment category: Merit-based (${data.meritPercent}% of all modifications). Remaining adjustments attributed to promotions, market corrections, and role transitions. Cumulative inflation during deployment period: <span class="story-stat">${data.cumulativeInflation}%</span>. Inflation-adjusted growth rate: <span class="story-stat">${data.realGrowth}%</span>, confirming real value appreciation beyond cost-of-living factors.</p>
            
            <p><span class="story-highlight">NOTABLE OPERATIONS:</span> Largest single-event appreciation occurred <span class="story-stat">${data.largestRaiseDate}</span> with a <span class="story-stat">${data.largestRaise}%</span> value increase.${data.sixFigureDate ? ` Six-figure threshold breached <span class="story-stat">${data.sixFigureDate}</span>, achieved within <span class="story-stat">${data.yearsToSixFigures}</span> of initial deployment.` : ''} Compensation trajectory has maintained positive momentum across all recorded intervals.</p>
            
            <p><span class="story-highlight">STATUS:</span> Specialist remains in active deployment. Current trajectory sustainable pending continued performance alignment. See <a href="#market" onclick="setTab('market'); return false;" class="tab-link">Market</a> tab for industry benchmarks and inflation-adjusted analysis.</p>
            
            <div class="story-insight">
                <span class="story-insight-label">Advisory Note</span>
                Compensation metrics represent one vector in a multi-dimensional assessment matrix. Operational impact, skill acquisition, and mission value are tracked through separate channels. This system monitors resource allocation only; comprehensive specialist evaluation requires additional data streams not captured in this report.
            </div>
        `
    },
    artistic: {
        title: "Compensation Summary",
        getSubtitle: (data) => data.dateRange,
        getText: (data) => `
            <p>You started at <span class="story-stat">${data.startSalary}</span> on <span class="story-stat">${data.hireDateFormatted}</span>. Your current annual salary is <span class="story-stat">${data.currentSalary}</span>—an increase of <span class="story-stat">${data.dollarIncrease}</span> from your starting point.</p>
            
            <p>Over <span class="story-stat">${data.years} years</span>, your compensation has increased <span class="story-stat">${data.growth}%</span> through <span class="story-stat">${data.totalAdjustments} adjustments</span>. That works out to a compound annual growth rate (CAGR) of <span class="story-stat">${data.cagr}%</span>, with adjustments occurring roughly every <span class="story-stat">${data.avgInterval} months</span> on average—more frequently than the typical annual review cycle.</p>
            
            <p><span class="story-stat">${data.meritPercent}%</span> of your adjustments were merit-based, with the remainder coming from promotions, market adjustments, or role changes. Your largest single increase was <span class="story-stat">${data.largestRaise}%</span> in <span class="story-stat">${data.largestRaiseDate}</span>.${data.sixFigureDate ? ` You crossed the six-figure threshold in <span class="story-stat">${data.sixFigureDate}</span>, about <span class="story-stat">${data.yearsToSixFigures}</span> into your tenure.` : ''}</p>
            
            <p>Accounting for <span class="story-stat">${data.cumulativeInflation}%</span> cumulative inflation over this period, your real purchasing power has grown by approximately <span class="story-stat">${data.realGrowth}%</span>. In other words, your raises have ${parseFloat(data.realGrowth) > 0 ? 'outpaced' : 'not kept pace with'} the cost of living.</p>
            
            <p>For context on how these numbers compare to industry standards, see the <a href="#market" onclick="setTab('market'); return false;" class="tab-link">Market</a> tab. The <a href="#analytics" onclick="setTab('analytics'); return false;" class="tab-link">Analytics</a> tab provides additional breakdowns of your raise history and patterns over time.</p>
            
            <div class="story-insight">
                <span class="story-insight-label">Note</span>
                This summary tracks compensation only. Career growth encompasses many things—skills developed, problems solved, teams built, impact made—that aren't captured in salary data alone. The numbers here tell one part of the story.
            </div>
        `
    }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Wraps chart build functions with error handling.
 * Prevents chart rendering failures from crashing the entire app.
 *
 * @param {Function} buildFn - The chart build function to wrap
 * @param {string} chartName - Name of the chart for error messages
 * @returns {Function} Wrapped function with error handling
 *
 * @example
 * const safeBuildChart = withChartErrorHandling(buildMainChart, 'Main Chart');
 * safeBuildChart(); // Catches and logs any errors
 */
function withChartErrorHandling(buildFn, chartName) {
    return function() {
        try {
            return buildFn.apply(this, arguments);
        } catch (error) {
            console.error(`${chartName} rendering failed:`, error);
            showUserMessage(`${chartName} could not be rendered. Please refresh the page.`, 'warning');
        }
    };
}

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
function showUserMessage(message, type = 'error') {
    // Remove any existing messages
    document.querySelectorAll('.user-message').forEach(el => el.remove());

    const banner = document.createElement('div');
    banner.className = `user-message user-message-${type}`;
    banner.innerHTML = `
        <span>${escapeHTML(message)}</span>
        <button onclick="this.parentElement.remove()" aria-label="Dismiss message">✕</button>
    `;
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10000;
        padding: 1rem 2rem;
        background: ${type === 'error' ? '#d32f2f' : type === 'warning' ? '#f57c00' : type === 'success' ? '#388e3c' : '#1976d2'};
        color: white;
        text-align: center;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    banner.querySelector('button').style.cssText = `
        background: transparent;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0 0.5rem;
        margin-left: 1rem;
    `;

    document.body.prepend(banner);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (banner.parentElement) {
            banner.remove();
        }
    }, 5000);
}

function formatCurrency(amount, showDollars = state.showDollars) {
    if (showDollars) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    const startingSalary = getStartingSalary();
    const index = (amount / startingSalary) * 100;
    return index.toFixed(0);
}

function formatPercent(value) {
    return value.toFixed(1) + '%';
}

function getStartingSalary() {
    return employeeData.records[employeeData.records.length - 1].annual;
}

function getCurrentSalary() {
    return employeeData.records[0].annual;
}

/**
 * Calculates Compound Annual Growth Rate (CAGR) for total compensation.
 *
 * CAGR represents the mean annual growth rate over the entire tenure,
 * smoothing out year-to-year variations. Formula: ((End / Start)^(1/Years)) - 1
 *
 * **Security/Stability Protection:**
 * - Guards against division by zero (years = 0, start = 0)
 * - Returns 0 for invalid inputs (negative salaries, zero tenure)
 * - Uses simple percentage for very short tenure (<36 days)
 * - Prevents NaN/Infinity propagation that would crash UI
 *
 * @returns {number} CAGR as percentage (e.g., 8.5 for 8.5%)
 *
 * @example
 * // Starting salary: $60,000, Current: $100,000, Years: 5
 * const cagr = calculateCAGR();
 * console.log(cagr); // ~10.8% annual growth
 *
 * @example
 * // Edge case: Same-day hire and export (years = 0)
 * const cagr = calculateCAGR();
 * console.log(cagr); // 0 (graceful fallback)
 */
function calculateCAGR() {
    const start = getStartingSalary();
    const end = getCurrentSalary();
    const years = calculateYearsOfService();

    // Validation: Prevent division by zero and NaN propagation
    if (years <= 0 || start <= 0 || end <= 0) {
        if (years <= 0 || start <= 0 || end <= 0) {
            console.warn('calculateCAGR: Invalid inputs, returning 0', { start, end, years });
        }
        return 0; // Graceful fallback
    }

    // For very short tenure (<~36 days), use simple percentage instead of CAGR
    // This avoids extreme CAGR values from compounding over very short periods
    if (years < CONSTANTS.CAGR_MIN_YEARS_THRESHOLD) {
        return ((end - start) / start) * 100;
    }

    return (Math.pow(end / start, 1 / years) - 1) * 100;
}

function calculateYearsOfService() {
    const hire = new Date(employeeData.hireDate);
    const current = new Date(employeeData.currentDate);
    return (current - hire) / (1000 * 60 * 60 * 24 * 365.25);
}

function getThemeColors() {
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

// ========================================
// MILESTONES DETECTION
// ========================================

function detectMilestones() {
    const milestones = [];
    const records = [...employeeData.records].reverse();
    const startingSalary = getStartingSalary();
    
    // Six figures
    const sixFigures = records.find(r => r.annual >= 100000);
    if (sixFigures) {
        milestones.push({
            icon: '💯',
            title: 'Six Figures',
            detail: 'Crossed $100,000 annual salary',
            date: new Date(sixFigures.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        });
    }

    // Salary doubled
    const doubled = records.find(r => r.annual >= startingSalary * 2);
    if (doubled) {
        const doubledDate = new Date(doubled.date);
        const hireDate = new Date(employeeData.hireDate);
        const monthsToDouble = Math.round((doubledDate - hireDate) / (1000 * 60 * 60 * 24 * 30));
        milestones.push({
            icon: '📈',
            title: 'Salary Doubled',
            detail: `Reached 2× starting salary in ${monthsToDouble} months`,
            date: doubledDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        });
    }

    // $200k milestone
    const twoHundredK = records.find(r => r.annual >= 200000);
    if (twoHundredK) {
        milestones.push({
            icon: '🎯',
            title: '$200K Milestone',
            detail: 'Crossed $200,000 annual salary',
            date: new Date(twoHundredK.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        });
    }

    // Biggest raise
    const raises = employeeData.records.filter(r => r.changePercent > 0);
    if (raises.length > 0) {
        const biggestRaise = raises.reduce((max, r) => r.changePercent > max.changePercent ? r : max);
        milestones.push({
            icon: '⭐',
            title: 'Largest Raise',
            detail: `${biggestRaise.changePercent.toFixed(1)}% increase`,
            date: new Date(biggestRaise.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        });
    }

    // 10 year mark
    const years = calculateYearsOfService();
    if (years >= 10) {
        milestones.push({
            icon: '🏆',
            title: 'Decade of Service',
            detail: '10+ years with the organization',
            date: new Date(new Date(employeeData.hireDate).getTime() + 10 * 365.25 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        });
    }

    return milestones;
}

// ========================================
// THEME FUNCTIONS
// ========================================

function updateChartTheme(chart) {
    if (!chart) return;

    const colors = getThemeColors();

    // Update dataset colors
    chart.data.datasets.forEach((dataset) => {
        // Update border colors
        if (dataset.borderColor) {
            // Check if it's using a theme-specific color that needs updating
            const isDynamicColor = dataset.borderColor.includes('rgb') ||
                                  dataset.borderColor.includes('#');
            if (isDynamicColor) {
                // For main datasets, use primary colors
                if (dataset.label?.includes('Annual Salary') || dataset.label?.includes('Index Value')) {
                    dataset.borderColor = colors.line1;
                    dataset.pointBackgroundColor = colors.line1;
                    dataset.pointBorderColor = colors.line1;
                } else if (dataset.label?.includes('YoY Growth')) {
                    dataset.borderColor = colors.line2;
                } else if (dataset.label?.includes('Historical CAGR')) {
                    dataset.borderColor = colors.line1;
                } else if (dataset.label?.includes('Custom')) {
                    dataset.borderColor = colors.line2;
                } else if (dataset.label?.includes('Conservative')) {
                    dataset.borderColor = state.theme === 'tactical' ? '#666' : '#8a837a';
                } else if (dataset.label?.includes('Optimistic')) {
                    dataset.borderColor = state.theme === 'tactical' ? '#4598d4' : '#7b2cbf';
                }
            }
        }

        // Update background colors for bar/area charts
        if (dataset.backgroundColor && dataset.backgroundColor !== 'transparent') {
            if (state.mainChartType === 'area') {
                dataset.backgroundColor = colors.fill1;
            } else if (state.mainChartType === 'bar') {
                dataset.backgroundColor = colors.line1;
            } else if (state.yoyChartType === 'bar') {
                dataset.backgroundColor = colors.line2;
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
        chart.options.plugins.tooltip.backgroundColor = state.theme === 'tactical' ? '#1a1a1d' : '#ffffff';
        chart.options.plugins.tooltip.titleColor = state.theme === 'tactical' ? '#e8e8e8' : '#2d2a26';
        chart.options.plugins.tooltip.bodyColor = state.theme === 'tactical' ? '#a0a0a0' : '#5c5650';
        chart.options.plugins.tooltip.borderColor = state.theme === 'tactical' ? '#2a2a2d' : '#e8e2da';
    }

    // Update legend colors
    if (chart.options.plugins?.legend?.labels) {
        chart.options.plugins.legend.labels.color = colors.text;
    }

    // Update category chart border color
    if (chart.config.type === 'doughnut') {
        chart.data.datasets.forEach(dataset => {
            dataset.borderColor = state.theme === 'tactical' ? '#141416' : '#ffffff';
        });
    }

    // Fast update without animation
    chart.update('none');
}

function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update all theme buttons
    document.querySelectorAll('.theme-btn, .landing-theme-btn').forEach(btn => {
        const isActive = btn.dataset.theme === theme;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
    
    // Update URL
    updateUrlParams();

    if (employeeData) {
        updateStory();
        // Instantly update chart colors without rebuilding (performance optimization)
        updateChartTheme(charts.main);
        updateChartTheme(charts.yoy);
        updateChartTheme(charts.category);
        updateChartTheme(charts.projection);
    }
}

// ========================================
// VIEW MODE (DOLLARS / INDEX)
// ========================================

function setViewMode(mode) {
    state.showDollars = (mode === 'dollars');
    
    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        const isActive = btn.dataset.view === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
    
    updateAllDisplays();
    updateUrlParams();
}

function togglePrivacy() {
    // Toggle for keyboard shortcut
    setViewMode(state.showDollars ? 'index' : 'dollars');
}

function updateAllDisplays() {
    const current = getCurrentSalary();
    const start = getStartingSalary();
    
    document.getElementById('currentSalary').textContent = state.showDollars 
        ? formatCurrency(current) 
        : `Index: ${formatCurrency(current, false)}`;
    
    document.getElementById('currentSalaryIndexed').textContent = state.showDollars 
        ? `Index: ${formatCurrency(current, false)}` 
        : `Base 100 = Starting salary`;

    buildHistoryTable();
    updateAnalytics();
    updateStory();
    buildMainChart();
    if (charts.projection) {
        buildProjectionChart();
        buildProjectionTable();
    }
}

// ========================================
// STORY UPDATE
// ========================================

function updateStory() {
    const content = storyContent[state.theme];
    document.getElementById('storyTitle').textContent = content.title;
    
    const start = getStartingSalary();
    const current = getCurrentSalary();
    const growth = ((current - start) / start) * 100;
    const cagr = calculateCAGR();
    const years = calculateYearsOfService();
    
    // Exclude "New Hire" - it's the starting point, not an adjustment
    const adjustments = employeeData.records.filter(r => r.reason !== 'New Hire');
    
    const raises = employeeData.records.filter(r => r.changePercent > 0);
    const largestRaise = raises.length > 0 ? raises.reduce((max, r) => r.changePercent > max.changePercent ? r : max) : null;
    
    const meritCount = adjustments.filter(r => r.reason.includes('Merit')).length;
    const meritPercent = adjustments.length > 0 ? ((meritCount / adjustments.length) * 100).toFixed(1) : '0';
    
    // Calculate avg interval (exclude New Hire from time calculation)
    const dates = adjustments.map(r => new Date(r.date)).sort((a, b) => a - b);
    let totalDays = 0;
    for (let i = 1; i < dates.length; i++) {
        totalDays += (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
    }
    const avgMonths = dates.length > 1 ? (totalDays / (dates.length - 1)) / 30.44 : 0;
    
    // Find six figure date and calculate time to reach it
    const recordsChron = [...employeeData.records].reverse();
    const sixFigures = recordsChron.find(r => r.annual >= 100000);
    let yearsToSixFigures = null;
    if (sixFigures) {
        const hireDate = new Date(employeeData.hireDate);
        const sixFigDate = new Date(sixFigures.date);
        const diffYears = (sixFigDate - hireDate) / (1000 * 60 * 60 * 24 * 365.25);
        yearsToSixFigures = diffYears < 1 ? `${Math.round(diffYears * 12)} months` : `${diffYears.toFixed(1)} years`;
    }
    
    // Calculate inflation data (use employeeData.currentDate, not current real date)
    const startYear = new Date(employeeData.hireDate).getFullYear();
    const startMonth = new Date(employeeData.hireDate).getMonth();
    const endYear = new Date(employeeData.currentDate).getFullYear();
    const endMonth = new Date(employeeData.currentDate).getMonth();
    const cumulativeInflation = calculateInflationOverPeriod(startYear, endYear, startMonth, endMonth);
    const realGrowth = calculateRealGrowth(growth, cumulativeInflation);
    const dollarIncrease = current - start;
    
    const data = {
        hireDateFormatted: new Date(employeeData.hireDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        startSalary: state.showDollars ? formatCurrency(start) : 'Index 100',
        currentSalary: state.showDollars ? formatCurrency(current) : `Index ${formatCurrency(current, false)}`,
        dollarIncrease: state.showDollars ? formatCurrency(dollarIncrease) : `Index ${(dollarIncrease / start * 100).toFixed(0)}`,
        years: years.toFixed(1),
        totalAdjustments: adjustments.length,
        growth: growth.toFixed(0),
        cagr: cagr.toFixed(1),
        avgInterval: avgMonths.toFixed(1),
        meritPercent,
        largestRaiseDate: largestRaise ? new Date(largestRaise.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A',
        largestRaise: largestRaise ? largestRaise.changePercent.toFixed(1) : '0',
        sixFigureDate: sixFigures ? new Date(sixFigures.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null,
        yearsToSixFigures,
        cumulativeInflation: cumulativeInflation.toFixed(1),
        realGrowth: realGrowth.toFixed(1),
        dateRange: new Date(employeeData.hireDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + ' – Present'
    };
    
    // Set subtitle (static for tactical, dynamic for summary)
    const subtitle = content.getSubtitle ? content.getSubtitle(data) : content.subtitle;
    document.getElementById('storySubtitle').textContent = subtitle;
    
    document.getElementById('storyText').innerHTML = content.getText(data);
    buildMilestones();
}

/**
 * Updates the Market tab with benchmark comparisons and performance analysis.
 *
 * Compares user's CAGR, average raises, and real growth against B2B SaaS
 * industry benchmarks. Generates performance tier (high/solid/low) and
 * theme-appropriate headline. Renders comparison cards and inflation analysis.
 *
 * @global {Object} benchmarks - Industry benchmark data (CAGR, typical raises)
 * @global {Object} state - UI state (theme for tactical vs artistic styling)
 * @returns {void}
 *
 * @example
 * // After parsing data, call to render market comparison
 * updateMarket(); // Populates #marketSummaryCard with performance analysis
 */
function updateMarket() {
    const bench = getBenchmarkComparisons();
    if (!bench) return;

    const start = getStartingSalary();
    const current = getCurrentSalary();
    const years = calculateYearsOfService();
    
    // Update header based on theme
    const isOutperforming = bench.cagrVsIndustry > 0 && bench.realGrowth > 0;
    const summaryCard = document.getElementById('marketSummaryCard');
    summaryCard.className = 'market-summary-card ' + (isOutperforming ? 'outperforming' : bench.cagrVsIndustry < -1 ? 'underperforming' : '');
    
    // Generate summary headline
    let headline, detail;
    if (bench.performanceTier === 'high') {
        headline = state.theme === 'tactical' 
            ? 'PERFORMANCE STATUS: EXCEEDING BENCHMARKS'
            : 'Your growth outpaces the industry';
        detail = `Your <strong>${bench.userCagr.toFixed(1)}% CAGR</strong> exceeds the B2B SaaS benchmark of ${benchmarks.industryCagr}%. With raises averaging <strong>${bench.avgRaise.toFixed(1)}%</strong> (above the typical ${benchmarks.typicalRaise.min}-${benchmarks.typicalRaise.max}% range), your compensation trajectory demonstrates exceptional growth.`;
    } else if (bench.performanceTier === 'solid') {
        headline = state.theme === 'tactical'
            ? 'PERFORMANCE STATUS: MEETING STANDARDS'
            : 'Tracking with industry benchmarks';
        detail = `Your <strong>${bench.userCagr.toFixed(1)}% CAGR</strong> ${bench.cagrVsIndustry >= 0 ? 'meets' : 'approaches'} the B2B SaaS benchmark of ${benchmarks.industryCagr}%. With raises averaging <strong>${bench.avgRaise.toFixed(1)}%</strong>, your compensation growth aligns with industry norms.`;
    } else {
        headline = state.theme === 'tactical'
            ? 'PERFORMANCE STATUS: OPPORTUNITY IDENTIFIED'
            : 'Room to grow toward benchmarks';
        detail = `Your <strong>${bench.userCagr.toFixed(1)}% CAGR</strong> trails the B2B SaaS benchmark of ${benchmarks.industryCagr}%. With raises averaging <strong>${bench.avgRaise.toFixed(1)}%</strong>, there may be opportunity to negotiate stronger increases.`;
    }
    
    document.getElementById('marketSummaryHeadline').textContent = headline;
    document.getElementById('marketSummaryDetail').innerHTML = detail;
    
    // Build comparison cards
    buildMarketComparison();
    
    // Build inflation analysis
    buildInflationAnalysis(bench, start, current, years);
}

function buildInflationAnalysis(bench, start, current, years) {
    const container = document.getElementById('inflationAnalysis');
    const nominalGrowth = ((current - start) / start) * 100;
    
    container.innerHTML = `
        <div class="inflation-card">
            <div class="inflation-card-title">Cumulative Inflation</div>
            <div class="inflation-card-value">${bench.totalInflation.toFixed(1)}%</div>
            <div class="inflation-card-label">CPI increase over ${years.toFixed(1)} years</div>
            <div class="inflation-breakdown">
                <div class="inflation-row">
                    <span class="inflation-row-label">Your nominal growth</span>
                    <span class="inflation-row-value">${nominalGrowth.toFixed(1)}%</span>
                </div>
                <div class="inflation-row">
                    <span class="inflation-row-label">Minus inflation</span>
                    <span class="inflation-row-value">-${bench.totalInflation.toFixed(1)}%</span>
                </div>
                <div class="inflation-row" style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.25rem;">
                    <span class="inflation-row-label"><strong>Real growth</strong></span>
                    <span class="inflation-row-value ${bench.realGrowth >= 0 ? 'positive' : 'negative'}"><strong>${bench.realGrowth >= 0 ? '+' : ''}${bench.realGrowth.toFixed(1)}%</strong></span>
                </div>
            </div>
        </div>
        <div class="inflation-card">
            <div class="inflation-card-title">Purchasing Power ${bench.purchasingPowerGain >= 0 ? 'Gained' : 'Lost'}</div>
            <div class="inflation-card-value ${bench.purchasingPowerGain >= 0 ? 'positive' : 'negative'}">${state.showDollars ? (bench.purchasingPowerGain >= 0 ? '+' : '') + formatCurrency(bench.purchasingPowerGain) : (bench.purchasingPowerGain >= 0 ? '+' : '') + (bench.purchasingPowerGain / start * 100).toFixed(0) + ' pts'}</div>
            <div class="inflation-card-label">In today's dollars</div>
            <div class="inflation-breakdown">
                <div class="inflation-row">
                    <span class="inflation-row-label">Starting salary (then)</span>
                    <span class="inflation-row-value">${state.showDollars ? formatCurrency(start) : '100'}</span>
                </div>
                <div class="inflation-row">
                    <span class="inflation-row-label">Adjusted for inflation (now)</span>
                    <span class="inflation-row-value">${state.showDollars ? formatCurrency(bench.inflationAdjustedStart) : Math.round(bench.inflationAdjustedStart / start * 100)}</span>
                </div>
                <div class="inflation-row">
                    <span class="inflation-row-label">Current salary</span>
                    <span class="inflation-row-value">${state.showDollars ? formatCurrency(current) : Math.round(current / start * 100)}</span>
                </div>
            </div>
        </div>
    `;
}

function buildMilestones() {
    const milestones = detectMilestones();
    const grid = document.getElementById('milestonesGrid');

    grid.innerHTML = milestones.map(m => `
        <div class="milestone-card">
            <div class="milestone-icon">${escapeHTML(m.icon)}</div>
            <div class="milestone-title">${escapeHTML(m.title)}</div>
            <div class="milestone-detail">${escapeHTML(m.detail)}</div>
            <div class="milestone-date">${escapeHTML(m.date)}</div>
        </div>
    `).join('');
}

function buildMarketComparison() {
    const grid = document.getElementById('marketComparisonGrid');
    const bench = getBenchmarkComparisons();
    
    if (!bench) {
        grid.innerHTML = '<p style="color: var(--text-muted);">Unable to calculate market comparisons.</p>';
        return;
    }
    
    const start = getStartingSalary();
    const current = getCurrentSalary();
    
    const cards = [
        {
            label: 'Your CAGR',
            value: `${bench.userCagr.toFixed(1)}%`,
            comparison: `Industry avg: <strong>${benchmarks.industryCagr}%</strong>`,
            diff: bench.cagrVsIndustry,
            badge: bench.cagrVsIndustry > 0.5 ? 'above' : bench.cagrVsIndustry < -0.5 ? 'below' : 'at'
        },
        {
            label: 'Avg Raise',
            value: `${bench.avgRaise.toFixed(1)}%`,
            comparison: `Typical range: <strong>${benchmarks.typicalRaise.min}-${benchmarks.typicalRaise.max}%</strong>`,
            diff: bench.raiseVsTypical,
            badge: bench.avgRaise > benchmarks.typicalRaise.max ? 'above' : bench.avgRaise >= benchmarks.typicalRaise.min ? 'at' : 'below'
        },
        {
            label: 'Raise Frequency',
            value: `${bench.avgMonthsBetween.toFixed(0)} mo`,
            comparison: `Industry avg: <strong>${benchmarks.avgMonthsBetweenRaises} months</strong>`,
            diff: benchmarks.avgMonthsBetweenRaises - bench.avgMonthsBetween,
            badge: bench.avgMonthsBetween < benchmarks.avgMonthsBetweenRaises - 1 ? 'above' : bench.avgMonthsBetween > benchmarks.avgMonthsBetweenRaises + 1 ? 'below' : 'at'
        },
        {
            label: 'Real Growth',
            value: `${bench.realGrowth.toFixed(1)}%`,
            comparison: `After <strong>${bench.totalInflation.toFixed(1)}%</strong> cumulative inflation`,
            diff: bench.realGrowth,
            badge: bench.realGrowth > 10 ? 'above' : bench.realGrowth > 0 ? 'at' : 'below'
        },
        {
            label: 'Purchasing Power',
            value: state.showDollars 
                ? (bench.purchasingPowerGain >= 0 ? '+' : '') + formatCurrency(bench.purchasingPowerGain)
                : (bench.purchasingPowerGain >= 0 ? '+' : '') + (bench.purchasingPowerGain / start * 100).toFixed(0) + ' pts',
            comparison: `${state.showDollars ? formatCurrency(bench.inflationAdjustedStart) : Math.round(bench.inflationAdjustedStart / start * 100)} would equal start salary today`,
            diff: bench.purchasingPowerGain,
            badge: bench.purchasingPowerGain > 0 ? 'above' : bench.purchasingPowerGain < 0 ? 'below' : 'at'
        },
        {
            label: 'vs Industry Path',
            value: state.showDollars 
                ? (bench.vsIndustrySalary >= 0 ? '+' : '') + formatCurrency(bench.vsIndustrySalary)
                : (bench.vsIndustrySalary >= 0 ? '+' : '') + (bench.vsIndustrySalary / start * 100).toFixed(0) + ' pts',
            comparison: `At ${benchmarks.industryCagr}% CAGR: <strong>${state.showDollars ? formatCurrency(bench.industryProjectedSalary) : Math.round(bench.industryProjectedSalary / start * 100)}</strong>`,
            diff: bench.vsIndustrySalary,
            badge: bench.vsIndustryPercent > 5 ? 'above' : bench.vsIndustryPercent < -5 ? 'below' : 'at'
        }
    ];
    
    grid.innerHTML = cards.map(card => `
        <div class="market-card ${card.diff > 0 ? 'positive' : card.diff < 0 ? 'negative' : 'neutral'}">
            <div class="market-card-header">
                <span class="market-card-label">${card.label}</span>
                <span class="market-card-badge ${card.badge}">${card.badge === 'above' ? '↑ Above' : card.badge === 'below' ? '↓ Below' : '● At'}</span>
            </div>
            <div class="market-card-value ${card.diff > 0 ? 'positive' : card.diff < 0 ? 'negative' : ''}">${card.value}</div>
            <div class="market-card-comparison">${card.comparison}</div>
        </div>
    `).join('');
    
    // Update footnote
    document.getElementById('marketFootnote').textContent = `Benchmarks based on B2B SaaS industry data (${benchmarks.lastUpdated}). CPI data from Bureau of Labor Statistics. Individual results vary by role, location, and company stage.`;
}

// ========================================
// TAB FUNCTIONS
// ========================================

function setTab(tabId, updateUrl = true) {
    state.currentTab = tabId;
    
    // Update URL params for stateful URLs
    if (updateUrl) {
        updateUrlParams();
    }
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabId}`);
    });

    if (tabId === 'market') {
        setTimeout(() => {
            updateMarket();
        }, 100);
    }
    if (tabId === 'analytics' && !charts.yoy) {
        setTimeout(() => {
            buildYoyChart();
            buildCategoryChart();
        }, 100);
    }
    if (tabId === 'projections' && !charts.projection) {
        setTimeout(() => {
            initProjections();
            buildProjectionChart();
            buildProjectionTable();
        }, 100);
    }
}

// ========================================
// URL NAVIGATION
// ========================================

function handleTabFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const validTabs = ['home', 'story', 'market', 'history', 'analytics', 'projections', 'help'];
    if (tab && validTabs.includes(tab) && employeeData) {
        setTab(tab, false); // false = don't update URL again
    }
}

// Warn before losing unsaved data (browser only)
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', (e) => {
        if (employeeData && !employeeData.isDemo) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// Check tab on initial dashboard load
function checkInitialHash() {
    setTimeout(handleTabFromUrl, 100);
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

// Only set up keyboard shortcuts in browser environment
if (typeof document !== 'undefined') {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (!employeeData) return;

        switch(e.key) {
            case '1': setTab('home'); break;
            case '2': setTab('story'); break;
            case '3': setTab('market'); break;
            case '4': setTab('history'); break;
            case '5': setTab('analytics'); break;
            case '6': setTab('projections'); break;
            case '7': setTab('help'); break;
            case 't':
            case 'T': setTheme(state.theme === 'tactical' ? 'artistic' : 'tactical'); break;
            case 'v':
            case 'V':
            case 'p':
            case 'P': togglePrivacy(); break;
        }
    });
}

// ========================================
// CHART FUNCTIONS
// ========================================

function setChartType(type) {
    state.mainChartType = type;
    document.querySelectorAll('.chart-controls .chart-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.chart === type);
    });
    buildMainChart();
}

function setYoyChartType(type) {
    state.yoyChartType = type;
    document.querySelectorAll('[data-chart^="yoy-"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.chart === `yoy-${type}`);
    });
    buildYoyChart();
}

/**
 * Builds the main compensation timeline chart with theme-aware styling.
 *
 * Supports 4 chart types (line, bar, area, step) and 2 view modes (dollars vs indexed).
 * Destroys previous chart instance before creating new one to prevent memory leaks.
 * Automatically adjusts colors, tooltips, and formatting based on current theme.
 *
 * @global {Object} employeeData - Compensation records (from parsePaylocityData)
 * @global {Object} state - UI state (theme, showDollars, mainChartType)
 * @global {Object} charts - Chart.js instances storage
 * @returns {void}
 *
 * @example
 * // After parsing data and setting state
 * state.mainChartType = 'area';
 * state.showDollars = true;
 * buildMainChart(); // Creates new area chart with dollar values
 */
function buildMainChart() {
    try {
        const canvas = document.getElementById('mainChart');
        if (!canvas) {
            console.error('buildMainChart: Canvas element not found');
            showUserMessage('Chart rendering failed. Please refresh the page.', 'error');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('buildMainChart: Canvas 2D context not available');
            showUserMessage('Chart rendering failed. Your browser may not support this feature.', 'error');
            return;
        }

        const colors = getThemeColors();

        const data = [...employeeData.records].reverse();

        const labels = data.map(r => {
            const date = new Date(r.date);
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        });

        const values = data.map(r => state.showDollars ? r.annual : (r.annual / getStartingSalary()) * 100);

        if (charts.main) {
            charts.main.destroy();
        }

        charts.main = new Chart(ctx, {
        type: state.mainChartType === 'bar' ? 'bar' : 'line',
        data: {
            labels,
            datasets: [{
                label: state.showDollars ? 'Annual Salary' : 'Index Value',
                data: values,
                borderColor: colors.line1,
                backgroundColor: state.mainChartType === 'area' ? colors.fill1 : 
                                state.mainChartType === 'bar' ? colors.line1 : 'transparent',
                fill: state.mainChartType === 'area',
                tension: state.mainChartType === 'step' ? 0 : 0.3,
                stepped: state.mainChartType === 'step' ? 'before' : false,
                borderWidth: 2,
                pointBackgroundColor: colors.line1,
                pointBorderColor: colors.line1,
                pointRadius: state.mainChartType === 'bar' ? 0 : 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: state.theme === 'tactical' ? '#1a1a1d' : '#ffffff',
                    titleColor: state.theme === 'tactical' ? '#e8e8e8' : '#2d2a26',
                    bodyColor: state.theme === 'tactical' ? '#a0a0a0' : '#5c5650',
                    borderColor: state.theme === 'tactical' ? '#2a2a2d' : '#e8e2da',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => state.showDollars ? `$${ctx.raw.toLocaleString()}` : `Index: ${ctx.raw.toFixed(0)}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: colors.grid, drawBorder: false },
                    ticks: { color: colors.text, maxRotation: 45, minRotation: 45 }
                },
                y: {
                    grid: { color: colors.grid, drawBorder: false },
                    ticks: {
                        color: colors.text,
                        callback: (v) => state.showDollars ? '$' + (v / 1000) + 'k' : v
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
        showUserMessage('Chart rendering failed. Please try refreshing the page.', 'error');

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

function buildYoyChart() {
    try {
        const canvas = document.getElementById('yoyChart');
        if (!canvas) {
            console.error('buildYoyChart: Canvas element not found');
            showUserMessage('YoY chart rendering failed. Please refresh the page.', 'error');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('buildYoyChart: Canvas 2D context not available');
            showUserMessage('YoY chart rendering failed. Your browser may not support this feature.', 'error');
            return;
        }

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

        if (charts.yoy) charts.yoy.destroy();

        charts.yoy = new Chart(ctx, {
        type: state.yoyChartType,
        data: {
            labels: growthRates.map(d => d.year),
            datasets: [{
                label: 'YoY Growth %',
                data: growthRates.map(d => d.growth),
                borderColor: colors.line2,
                backgroundColor: state.yoyChartType === 'bar' ? colors.line2 : 'transparent',
                borderWidth: 2,
                tension: 0.3,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: state.theme === 'tactical' ? '#1a1a1d' : '#ffffff',
                    titleColor: state.theme === 'tactical' ? '#e8e8e8' : '#2d2a26',
                    bodyColor: state.theme === 'tactical' ? '#a0a0a0' : '#5c5650',
                    borderColor: state.theme === 'tactical' ? '#2a2a2d' : '#e8e2da',
                    borderWidth: 1,
                    callbacks: { label: (ctx) => `${ctx.raw.toFixed(1)}% growth` }
                }
            },
            scales: {
                x: { grid: { color: colors.grid, drawBorder: false }, ticks: { color: colors.text } },
                y: { grid: { color: colors.grid, drawBorder: false }, ticks: { color: colors.text, callback: (v) => v + '%' } }
            }
        }
    });
    } catch (error) {
        console.error('Failed to build YoY chart:', error);
        showUserMessage('YoY chart rendering failed. Try refreshing the page.', 'error');
    }
}

function buildCategoryChart() {
    try {
        const canvas = document.getElementById('categoryChart');
        if (!canvas) {
            console.error('buildCategoryChart: Canvas element not found');
            showUserMessage('Category chart rendering failed. Please refresh the page.', 'error');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('buildCategoryChart: Canvas 2D context not available');
            showUserMessage('Category chart rendering failed. Your browser may not support this feature.', 'error');
            return;
        }

        const colors = getThemeColors();

        // Filter out "New Hire" - it's the starting point, not an adjustment
        const adjustments = employeeData.records.filter(r => r.reason !== 'New Hire');

        // Guard against no adjustments
        if (adjustments.length === 0) return;

        const categories = {};
        adjustments.forEach(r => {
            const reason = r.reason || 'Other';
            if (reason !== '—') {
                categories[reason] = (categories[reason] || 0) + 1;
            }
        });

        const labels = Object.keys(categories);
        const data = Object.values(categories);

        const categoryColors = [colors.line1, colors.line2,
            state.theme === 'tactical' ? '#4598d4' : '#7b2cbf',
            state.theme === 'tactical' ? '#d45745' : '#d00000'];

        if (charts.category) charts.category.destroy();

        charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: categoryColors,
                borderColor: state.theme === 'tactical' ? '#141416' : '#ffffff',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: colors.text,
                        padding: 20,
                        font: { family: state.theme === 'tactical' ? 'JetBrains Mono' : 'Nunito', size: 12 }
                    }
                }
            }
        }
    });
    } catch (error) {
        console.error('Failed to build category chart:', error);
        showUserMessage('Category chart rendering failed. Try refreshing the page.', 'error');
    }
}

function initProjections() {
    // Set slider to historical CAGR
    const historicalCAGR = Math.round(calculateCAGR());
    state.cagr = historicalCAGR;
    state.customRate = historicalCAGR;
    
    // Update slider and display
    const slider = document.getElementById('customRateSlider');
    slider.value = historicalCAGR;
    document.getElementById('customRateValue').textContent = historicalCAGR + '%';
    document.getElementById('historicalRateDisplay').textContent = historicalCAGR + '%';
}

function buildProjectionChart() {
    try {
        const canvas = document.getElementById('projectionChart');
        if (!canvas) {
            console.error('buildProjectionChart: Canvas element not found');
            showUserMessage('Projection chart rendering failed. Please refresh the page.', 'error');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('buildProjectionChart: Canvas 2D context not available');
            showUserMessage('Projection chart rendering failed. Your browser may not support this feature.', 'error');
            return;
        }

        const colors = getThemeColors();

        const currentSalary = getCurrentSalary();
        const cagr = calculateCAGR() / 100;
        const years = state.projectionYears;
        const customRate = state.customRate / 100;

        const labels = ['Now'];
        const historical = [currentSalary];
        const conservative = [currentSalary];
        const custom = [currentSalary];
        const optimistic = [currentSalary];

        for (let i = 1; i <= years; i++) {
            labels.push(`+${i}yr`);
            historical.push(currentSalary * Math.pow(1 + cagr, i));
            conservative.push(currentSalary * Math.pow(1.05, i));
            custom.push(currentSalary * Math.pow(1 + customRate, i));
            optimistic.push(currentSalary * Math.pow(1.12, i));
        }

        if (charts.projection) charts.projection.destroy();

        charts.projection = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: `Historical CAGR (${(cagr * 100).toFixed(1)}%)`, data: historical, borderColor: colors.line1, backgroundColor: 'transparent', borderWidth: 3, tension: 0.3, pointRadius: 4 },
                { label: 'Conservative (5%)', data: conservative, borderColor: state.theme === 'tactical' ? '#666' : '#8a837a', backgroundColor: 'transparent', borderWidth: 2, borderDash: [5,5], tension: 0.3, pointRadius: 3 },
                { label: `Custom (${state.customRate}%)`, data: custom, borderColor: colors.line2, backgroundColor: 'transparent', borderWidth: 2, tension: 0.3, pointRadius: 4 },
                { label: 'Optimistic (12%)', data: optimistic, borderColor: state.theme === 'tactical' ? '#4598d4' : '#7b2cbf', backgroundColor: 'transparent', borderWidth: 2, borderDash: [5,5], tension: 0.3, pointRadius: 3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { position: 'top', labels: { color: colors.text, padding: 20, font: { family: state.theme === 'tactical' ? 'JetBrains Mono' : 'Nunito', size: 11 } } },
                tooltip: {
                    backgroundColor: state.theme === 'tactical' ? '#1a1a1d' : '#ffffff',
                    titleColor: state.theme === 'tactical' ? '#e8e8e8' : '#2d2a26',
                    bodyColor: state.theme === 'tactical' ? '#a0a0a0' : '#5c5650',
                    borderColor: state.theme === 'tactical' ? '#2a2a2d' : '#e8e2da',
                    borderWidth: 1,
                    callbacks: { label: (ctx) => `${ctx.dataset.label}: $${Math.round(ctx.raw).toLocaleString()}` }
                }
            },
            scales: {
                x: { grid: { color: colors.grid, drawBorder: false }, ticks: { color: colors.text } },
                y: { grid: { color: colors.grid, drawBorder: false }, ticks: { color: colors.text, callback: (v) => '$' + (v/1000) + 'k' } }
            }
        }
    });
    } catch (error) {
        console.error('Failed to build projection chart:', error);
        showUserMessage('Projection chart rendering failed. Try refreshing the page.', 'error');
    }
}

// ========================================
// TABLE FUNCTIONS
// ========================================

function buildHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    const startingSalary = getStartingSalary();

    tbody.innerHTML = employeeData.records.map(r => {
        const badgeClass = getBadgeClass(r.reason);
        const index = ((r.annual / startingSalary) * 100).toFixed(0);
        const changeDisplay = r.change > 0
            ? (state.showDollars ? `+${formatCurrency(r.change * 24)}` : `+${((r.change * 24 / startingSalary) * 100).toFixed(1)}`)
            : '—';

        return `
            <tr>
                <td>${new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td><span class="badge ${badgeClass}">${escapeHTML(r.reason)}</span></td>
                <td>${state.showDollars ? formatCurrency(r.annual) : `Index: ${index}`}</td>
                <td>${index}</td>
                <td>${changeDisplay}</td>
                <td>${r.changePercent > 0 ? `+${r.changePercent.toFixed(2)}%` : '—'}</td>
            </tr>
        `;
    }).join('');
}

function getBadgeClass(reason) {
    if (reason.includes('Merit')) return 'badge-merit';
    if (reason.includes('Equity')) return 'badge-equity';
    if (reason.includes('Market')) return 'badge-market';
    if (reason.includes('New')) return 'badge-new';
    return '';
}

function buildProjectionTable() {
    const tbody = document.getElementById('projectionTableBody');
    const currentSalary = getCurrentSalary();
    const cagr = calculateCAGR() / 100;
    const customRate = state.customRate / 100;
    
    // Fixed intervals: 1-5 yearly, then 10, 15, 20
    const intervals = [1, 2, 3, 4, 5, 10, 15, 20];
    
    tbody.innerHTML = intervals.map(year => `
        <tr>
            <td>${year} year${year > 1 ? 's' : ''}</td>
            <td>${formatCurrency(currentSalary * Math.pow(1 + cagr, year))}</td>
            <td>${formatCurrency(currentSalary * Math.pow(1.05, year))}</td>
            <td>${formatCurrency(currentSalary * Math.pow(1 + customRate, year))}</td>
            <td>${formatCurrency(currentSalary * Math.pow(1.12, year))}</td>
        </tr>
    `).join('');
}

// ========================================
// ANALYTICS UPDATE
// ========================================

function updateAnalytics() {
    const records = employeeData.records;
    const startingSalary = getStartingSalary();
    
    // Filter out "New Hire" - it's the starting point, not an adjustment
    const adjustments = records.filter(r => r.reason !== 'New Hire');
    
    // Guard against no adjustments (shouldn't happen, but be safe)
    if (adjustments.length === 0) return;
    
    const raises = records.filter(r => r.changePercent > 0);
    if (raises.length === 0) return;
    
    const avgRaisePercent = raises.reduce((sum, r) => sum + r.changePercent, 0) / raises.length;
    const sortedRaises = [...raises].sort((a, b) => a.changePercent - b.changePercent);
    const medianRaise = sortedRaises[Math.floor(sortedRaises.length / 2)].changePercent;
    const largestRaise = Math.max(...raises.map(r => r.changePercent));
    const largestRaiseRecord = raises.find(r => r.changePercent === largestRaise);
    
    const meritCount = adjustments.filter(r => r.reason.includes('Merit')).length;
    
    // Use adjustments (excludes New Hire) for time between raises
    const dates = adjustments.map(r => new Date(r.date)).sort((a, b) => a - b);
    let totalDays = 0;
    for (let i = 1; i < dates.length; i++) {
        totalDays += (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
    }
    const avgMonths = dates.length > 1 ? (totalDays / (dates.length - 1)) / 30.44 : 12;
    
    document.getElementById('cagr').textContent = formatPercent(calculateCAGR());
    document.getElementById('avgRaise').textContent = formatPercent(avgRaisePercent);
    
    const avgRaiseDollar = (avgRaisePercent / 100) * getCurrentSalary();
    document.getElementById('avgRaiseDollar').textContent = state.showDollars 
        ? `~${formatCurrency(avgRaiseDollar)} per adjustment`
        : `~${((avgRaiseDollar / startingSalary) * 100).toFixed(1)} index points`;
    
    document.getElementById('medianRaise').textContent = formatPercent(medianRaise);
    document.getElementById('largestRaise').textContent = formatPercent(largestRaise);
    document.getElementById('largestRaiseDate').textContent = new Date(largestRaiseRecord.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    document.getElementById('avgTimeBetween').textContent = `${avgMonths.toFixed(1)} mo`;
    const benchmarkMonths = CONSTANTS.TYPICAL_RAISE_INTERVAL_MONTHS;
    const timeDiff = avgMonths - benchmarkMonths;
    let timeContext;
    if (timeDiff < -2) {
        timeContext = `${Math.abs(timeDiff).toFixed(1)} mo faster than typical`;
    } else if (timeDiff > 2) {
        timeContext = `${timeDiff.toFixed(1)} mo slower than typical`;
    } else {
        timeContext = `Near industry standard (12 mo)`;
    }
    document.getElementById('avgTimeDetail').textContent = timeContext;
    document.getElementById('meritCount').textContent = meritCount;
    document.getElementById('meritPercent').textContent = `${((meritCount / adjustments.length) * 100).toFixed(1)}% of all adjustments`;
}

// ========================================
// PROJECTION CONTROLS
// ========================================

function setProjectionYears(years) {
    state.projectionYears = years;
    document.querySelectorAll('.interval-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.years) === years);
    });
    buildProjectionChart();
}

function updateCustomRate() {
    state.customRate = parseInt(document.getElementById('customRateSlider').value);
    document.getElementById('customRateValue').textContent = state.customRate + '%';
    
    buildProjectionChart();
    buildProjectionTable();
}

function setProjectionView(view) {
    const chartWrapper = document.getElementById('projectionChartWrapper');
    const tableWrapper = document.getElementById('projectionTableWrapper');
    const intervalButtons = document.querySelector('#tab-projections .interval-buttons');
    const buttons = document.querySelectorAll('#tab-projections .chart-type-btn');
    
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    if (view === 'chart') {
        chartWrapper.classList.remove('hidden');
        tableWrapper.classList.add('hidden');
        intervalButtons.classList.remove('hidden');
    } else {
        chartWrapper.classList.add('hidden');
        tableWrapper.classList.remove('hidden');
        intervalButtons.classList.add('hidden');
    }
}

function calculateTimeToTarget() {
    const target = parseFloat(document.getElementById('targetSalary').value);
    const growth = state.customRate / 100; // Use slider value
    const current = getCurrentSalary();
    
    if (target <= current) {
        document.getElementById('timeToTarget').textContent = 'Already achieved!';
        return;
    }
    
    if (growth === 0) {
        document.getElementById('timeToTarget').textContent = 'Never (0% growth)';
        return;
    }
    
    const years = Math.log(target / current) / Math.log(1 + growth);
    document.getElementById('timeToTarget').textContent = `~${years.toFixed(1)} years`;
}

// ========================================
// DASHBOARD INITIALIZATION
// ========================================

function initDashboard() {
    const current = getCurrentSalary();
    const start = getStartingSalary();
    const growth = ((current - start) / start) * 100;
    const years = calculateYearsOfService();
    
    // Exclude "New Hire" from adjustment counts - it's the starting point, not an adjustment
    const adjustments = employeeData.records.filter(r => r.reason !== 'New Hire');
    const adjustmentCount = adjustments.length;
    
    document.getElementById('currentSalary').textContent = formatCurrency(current);
    document.getElementById('currentSalaryIndexed').textContent = `Index: ${formatCurrency(current, false)}`;
    document.getElementById('totalGrowth').textContent = `+${growth.toFixed(0)}%`;
    document.getElementById('yearsService').textContent = years.toFixed(1);
    document.getElementById('hireDateText').textContent = `Since ${new Date(employeeData.hireDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    document.getElementById('totalRaises').textContent = adjustmentCount;
    document.getElementById('avgRaisesPerYear').textContent = `Avg: ${(adjustmentCount / years).toFixed(1)} per year`;
    
    buildHistoryTable();
    buildMainChart();
    updateAnalytics();
    updateStory();
}

// ========================================
// URL PARAMETER HANDLING
// ========================================

function updateUrlParams() {
    const params = new URLSearchParams();
    
    // Always include theme
    params.set('theme', state.theme);
    
    // Include view mode (only if not default 'dollars')
    if (!state.showDollars) {
        params.set('view', 'index');
    }
    
    // Include demo flag if in demo mode
    if (employeeData && employeeData.isDemo) {
        params.set('demo', 'true');
    }
    
    // Include tab if on dashboard and not home
    if (!document.getElementById('dashboardPage').classList.contains('hidden') && state.currentTab !== 'home') {
        params.set('tab', state.currentTab);
    }
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, '', newUrl);
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        theme: params.get('theme'),
        demo: params.get('demo') === 'true',
        tab: params.get('tab'),
        view: params.get('view')
    };
}

function initFromUrl() {
    const params = getUrlParams();
    
    // Apply theme from URL if specified
    if (params.theme && (params.theme === 'tactical' || params.theme === 'artistic')) {
        setTheme(params.theme);
    }
    
    // Apply view mode from URL if specified
    if (params.view === 'index') {
        setViewMode('index');
    }
    
    // Auto-load demo if specified
    if (params.demo) {
        loadDemoData();
        // Tab will be handled by checkInitialHash called from showDashboard
    }
}

// Initialize from URL on page load (only in browser, not during tests)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    initFromUrl();
}

// Export functions for testing (ES Modules)
export {
    // Parser functions
    parsePaylocityData,
    parseRecord,
    validateSalaryRange,
    escapeHTML,

    // Calculation functions
    calculateCAGR,
    calculateInflationOverPeriod,
    calculateRealGrowth,
    calculateInflationAdjustedSalary,

    // Helper functions
    calculateYearsOfService,
    getStartingSalary,
    getCurrentSalary,

    // Constants
    CONSTANTS
};
