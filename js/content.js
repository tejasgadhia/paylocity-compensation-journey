// ========================================
// CONTENT RENDERING MODULE
// ========================================

import { CONSTANTS, benchmarks, benchmarkMetadata } from './constants.js';
import {
    calculateInflationOverPeriod,
    calculateRealGrowth,
    getStartingSalary,
    getCurrentSalary,
    calculateYearsOfService,
    calculateCAGR,
    getBenchmarkComparisons,
    calculateAverageMonthsBetweenDates,
    formatDateSummary,
    formatDateDetail
} from './calculations.js';
import { validateTemplateData } from './security.js';

// ========================================
// MODULE STATE (injected via initContent)
// ========================================

let _state, _getEmployeeData;

/**
 * Initializes the content module with required dependencies.
 * Must be called once before using any content functions.
 *
 * @param {Object} deps - Dependencies to inject
 * @param {Object} deps.state - UI state object
 * @param {Function} deps.getEmployeeData - Function that returns employee data
 */
export function initContent({ state, getEmployeeData }) {
    _state = state;
    _getEmployeeData = getEmployeeData;
}

// ========================================
// SECURITY HELPERS
// ========================================

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Private utility - copied from app.js since it's small and used here.
 *
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for insertion into HTML
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
// FORMATTING UTILITIES
// ========================================

/**
 * Formats a number as currency (USD) or as an index value.
 *
 * @param {number} amount - The amount to format
 * @param {boolean} [showDollars] - Whether to show dollars (defaults to state.showDollars)
 * @returns {string} Formatted currency string or index value
 */
export function formatCurrency(amount, showDollars = _state.showDollars) {
    if (showDollars) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    const employeeData = _getEmployeeData();
    const startingSalary = getStartingSalary(employeeData);
    const index = (amount / startingSalary) * 100;
    return index.toFixed(0);
}

/**
 * Formats a number as a percentage with one decimal place.
 *
 * @param {number} value - The value to format
 * @returns {string} Formatted percentage string (e.g., "5.2%")
 */
export function formatPercent(value) {
    return value.toFixed(1) + '%';
}

// ========================================
// STORY CONTENT
// ========================================

export const storyContent = {
    tactical: {
        title: "Mission Debrief: Compensation Trajectory",
        subtitle: "Classification: Personnel Valuation Report",
        getText: (data) => `
            <p><span class="story-highlight">MISSION START:</span> Specialist deployed on <span class="story-stat">${escapeHTML(data.hireDateFormatted)}</span> with initial resource allocation of <span class="story-stat">${escapeHTML(data.startSalary)}</span>. Operational status: New Hire. Initial positioning established within standard parameters for role classification.</p>

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
// MILESTONES DETECTION
// ========================================

/**
 * Detects career milestones from compensation history.
 * Identifies: six figures, salary doubled, $200K, largest raise, decade of service.
 *
 * @returns {Array<Object>} Array of milestone objects with icon, title, detail, date
 */
export function detectMilestones() {
    const employeeData = _getEmployeeData();
    const milestones = [];
    const records = [...employeeData.records].reverse();
    const startingSalary = getStartingSalary(employeeData);

    // Six figures
    const sixFigures = records.find(r => r.annual >= CONSTANTS.SALARY_SIX_FIGURES);
    if (sixFigures) {
        milestones.push({
            icon: '💯',
            title: 'Six Figures',
            detail: 'Crossed $100,000 annual salary',
            date: formatDateSummary(sixFigures.date)
        });
    }

    // Salary doubled
    const doubled = records.find(r => r.annual >= startingSalary * 2);
    if (doubled) {
        const doubledDate = new Date(doubled.date);
        const hireDate = new Date(employeeData.hireDate);
        const monthsToDouble = Math.round((doubledDate - hireDate) / (CONSTANTS.MS_PER_DAY * CONSTANTS.DAYS_PER_MONTH_AVG));
        milestones.push({
            icon: '📈',
            title: 'Salary Doubled',
            detail: `Reached 2× starting salary in ${monthsToDouble} months`,
            date: formatDateSummary(doubledDate)
        });
    }

    // $200k milestone
    const twoHundredK = records.find(r => r.annual >= CONSTANTS.SALARY_200K_MILESTONE);
    if (twoHundredK) {
        milestones.push({
            icon: '🎯',
            title: '$200K Milestone',
            detail: 'Crossed $200,000 annual salary',
            date: formatDateSummary(twoHundredK.date)
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
            date: formatDateSummary(biggestRaise.date)
        });
    }

    // Decade of service milestone
    const years = calculateYearsOfService(employeeData);
    if (years >= CONSTANTS.YEARS_DECADE_SERVICE) {
        milestones.push({
            icon: '🏆',
            title: 'Decade of Service',
            detail: '10+ years with the organization',
            date: formatDateSummary(new Date(new Date(employeeData.hireDate).getTime() + CONSTANTS.YEARS_DECADE_SERVICE * CONSTANTS.MS_PER_YEAR))
        });
    }

    return milestones;
}

// ========================================
// STORY UPDATE
// ========================================

/**
 * Updates the Story tab with narrative insights about compensation history.
 *
 * Generates personalized story cards with CAGR analysis, milestone detection,
 * industry comparisons, and contextual insights. Adapts language and metrics
 * based on theme (tactical/artistic) and tenure length.
 *
 * @returns {void}
 */
export function updateStory() {
    const employeeData = _getEmployeeData();
    const content = storyContent[_state.theme];
    document.getElementById('storyTitle').textContent = content.title;

    const start = getStartingSalary(employeeData);
    const current = getCurrentSalary(employeeData);
    const growth = ((current - start) / start) * 100;
    const cagr = calculateCAGR(employeeData);
    const years = calculateYearsOfService(employeeData);

    // Exclude "New Hire" - it's the starting point, not an adjustment
    const adjustments = employeeData.records.filter(r => r.reason !== 'New Hire');

    const raises = employeeData.records.filter(r => r.changePercent > 0);
    const largestRaise = raises.length > 0 ? raises.reduce((max, r) => r.changePercent > max.changePercent ? r : max) : null;

    const meritCount = adjustments.filter(r => r.reason.includes('Merit')).length;
    const meritPercent = adjustments.length > 0 ? ((meritCount / adjustments.length) * 100).toFixed(1) : '0';

    // Calculate avg interval (exclude New Hire from time calculation)
    const avgMonths = adjustments.length > 0 ? calculateAverageMonthsBetweenDates(adjustments, 0) : 0;

    // Find six figure date and calculate time to reach it
    const recordsChron = [...employeeData.records].reverse();
    const sixFigures = recordsChron.find(r => r.annual >= 100000);
    let yearsToSixFigures = null;
    if (sixFigures) {
        const hireDate = new Date(employeeData.hireDate);
        const sixFigDate = new Date(sixFigures.date);
        const diffYears = (sixFigDate - hireDate) / CONSTANTS.MS_PER_YEAR;
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
        hireDateFormatted: formatDateDetail(employeeData.hireDate),
        startSalary: _state.showDollars ? formatCurrency(start) : 'Index 100',
        currentSalary: _state.showDollars ? formatCurrency(current) : `Index ${formatCurrency(current, false)}`,
        dollarIncrease: _state.showDollars ? formatCurrency(dollarIncrease) : `Index ${(dollarIncrease / start * 100).toFixed(0)}`,
        years: years.toFixed(1),
        totalAdjustments: adjustments.length,
        growth: growth.toFixed(0),
        cagr: cagr.toFixed(1),
        avgInterval: avgMonths.toFixed(1),
        meritPercent,
        largestRaiseDate: largestRaise ? formatDateSummary(largestRaise.date) : 'N/A',
        largestRaise: largestRaise ? largestRaise.changePercent.toFixed(1) : '0',
        sixFigureDate: sixFigures ? formatDateSummary(sixFigures.date) : null,
        yearsToSixFigures,
        cumulativeInflation: cumulativeInflation.toFixed(1),
        realGrowth: realGrowth.toFixed(1),
        dateRange: formatDateSummary(employeeData.hireDate) + ' – Present'
    };

    // Security: Validate data types before template interpolation (defense-in-depth)
    validateTemplateData(data);

    // Set subtitle (static for tactical, dynamic for summary)
    const subtitle = content.getSubtitle ? content.getSubtitle(data) : content.subtitle;
    document.getElementById('storySubtitle').textContent = subtitle;

    // Security Note: innerHTML is safe here because all dynamic values come from safe sources:
    // - Dates: toLocaleDateString() (browser API, produces safe strings)
    // - Numbers: toFixed(), formatCurrency() (numeric methods, produce safe strings)
    // - Parser validates all inputs: parser.js:25-50 (validateSalaryRange) and parser.js:106 (HTML stripping)
    // No user-controlled strings are interpolated without sanitization.
    document.getElementById('storyText').innerHTML = content.getText(data);
    buildMilestones();
}

// ========================================
// MARKET UPDATE
// ========================================

/**
 * Updates the Market tab with benchmark comparisons and performance analysis.
 *
 * Compares user's CAGR, average raises, and real growth against B2B SaaS
 * industry benchmarks. Generates performance tier (high/solid/low) and
 * theme-appropriate headline. Renders comparison cards and inflation analysis.
 *
 * @returns {void}
 */
export function updateMarket() {
    const employeeData = _getEmployeeData();
    const bench = getBenchmarkComparisons(employeeData, benchmarks);
    if (!bench) return;

    const start = getStartingSalary(employeeData);
    const current = getCurrentSalary(employeeData);
    const years = calculateYearsOfService(employeeData);

    // Update header based on theme
    const isOutperforming = bench.cagrVsIndustry > 0 && bench.realGrowth > 0;
    const summaryCard = document.getElementById('marketSummaryCard');
    summaryCard.className = 'market-summary-card ' + (isOutperforming ? 'outperforming' : bench.cagrVsIndustry < -1 ? 'underperforming' : '');

    // Generate summary headline
    let headline, detail;
    if (bench.performanceTier === 'high') {
        headline = _state.theme === 'tactical'
            ? 'PERFORMANCE STATUS: EXCEEDING BENCHMARKS'
            : 'Your growth outpaces the industry';
        detail = `Your <strong>${bench.userCagr.toFixed(1)}% CAGR</strong> exceeds the B2B SaaS benchmark of ${benchmarks.industryCagr}%. With raises averaging <strong>${bench.avgRaise.toFixed(1)}%</strong> (above the typical ${benchmarks.typicalRaise.min}-${benchmarks.typicalRaise.max}% range), your compensation trajectory demonstrates exceptional growth.`;
    } else if (bench.performanceTier === 'solid') {
        headline = _state.theme === 'tactical'
            ? 'PERFORMANCE STATUS: MEETING STANDARDS'
            : 'Tracking with industry benchmarks';
        detail = `Your <strong>${bench.userCagr.toFixed(1)}% CAGR</strong> ${bench.cagrVsIndustry >= 0 ? 'meets' : 'approaches'} the B2B SaaS benchmark of ${benchmarks.industryCagr}%. With raises averaging <strong>${bench.avgRaise.toFixed(1)}%</strong>, your compensation growth aligns with industry norms.`;
    } else {
        headline = _state.theme === 'tactical'
            ? 'PERFORMANCE STATUS: OPPORTUNITY IDENTIFIED'
            : 'Room to grow toward benchmarks';
        detail = `Your <strong>${bench.userCagr.toFixed(1)}% CAGR</strong> trails the B2B SaaS benchmark of ${benchmarks.industryCagr}%. With raises averaging <strong>${bench.avgRaise.toFixed(1)}%</strong>, there may be opportunity to negotiate stronger increases.`;
    }

    document.getElementById('marketSummaryHeadline').textContent = headline;
    // Security Note: innerHTML safe - 'detail' contains only <strong> tags around numeric values from toFixed()
    document.getElementById('marketSummaryDetail').innerHTML = detail;

    // Build comparison cards
    buildMarketComparison();

    // Build inflation analysis
    buildInflationAnalysis(bench, start, current, years);

    // Populate market footnote with metadata (#147)
    const footnote = document.getElementById('marketFootnote');
    if (footnote) {
        footnote.textContent =
            `Benchmarks: ${benchmarkMetadata.lastUpdated.salaryBenchmarks} | ` +
            `CPI Data: ${benchmarkMetadata.lastUpdated.inflationData} | ` +
            `Region: ${benchmarkMetadata.region} | ` +
            `Industry: ${benchmarkMetadata.industry}`;
    }
}

// ========================================
// INFLATION ANALYSIS
// ========================================

/**
 * Builds the inflation analysis section of the Market tab.
 *
 * @param {Object} bench - Benchmark comparison data
 * @param {number} start - Starting salary
 * @param {number} current - Current salary
 * @param {number} years - Years of service
 */
export function buildInflationAnalysis(bench, start, current, years) {
    const container = document.getElementById('inflationAnalysis');
    const nominalGrowth = ((current - start) / start) * 100;

    // Security Note: innerHTML safe - all dynamic values are numeric (toFixed, formatCurrency, Math.round)
    // No user-controlled strings. Data originates from validated parser (parser.js:25-50).
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
            <div class="inflation-card-value ${bench.purchasingPowerGain >= 0 ? 'positive' : 'negative'}">${_state.showDollars ? (bench.purchasingPowerGain >= 0 ? '+' : '') + formatCurrency(bench.purchasingPowerGain) : (bench.purchasingPowerGain >= 0 ? '+' : '') + (bench.purchasingPowerGain / start * 100).toFixed(0) + ' pts'}</div>
            <div class="inflation-card-label">In today's dollars</div>
            <div class="inflation-breakdown">
                <div class="inflation-row">
                    <span class="inflation-row-label">Starting salary (then)</span>
                    <span class="inflation-row-value">${_state.showDollars ? formatCurrency(start) : '100'}</span>
                </div>
                <div class="inflation-row">
                    <span class="inflation-row-label">Adjusted for inflation (now)</span>
                    <span class="inflation-row-value">${_state.showDollars ? formatCurrency(bench.inflationAdjustedStart) : Math.round(bench.inflationAdjustedStart / start * 100)}</span>
                </div>
                <div class="inflation-row">
                    <span class="inflation-row-label">Current salary</span>
                    <span class="inflation-row-value">${_state.showDollars ? formatCurrency(current) : Math.round(current / start * 100)}</span>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// MILESTONES BUILDER
// ========================================

/**
 * Builds the milestones grid in the Story tab.
 *
 * @returns {void}
 */
export function buildMilestones() {
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

// ========================================
// MARKET COMPARISON BUILDER
// ========================================

/**
 * Builds the market comparison cards grid.
 *
 * @returns {void}
 */
export function buildMarketComparison() {
    const employeeData = _getEmployeeData();
    const grid = document.getElementById('marketComparisonGrid');
    const bench = getBenchmarkComparisons(employeeData, benchmarks);

    if (!bench) {
        grid.innerHTML = '<p style="color: var(--text-muted);">Unable to calculate market comparisons.</p>';
        return;
    }

    const start = getStartingSalary(employeeData);

    // #79: Primary metrics get larger cards, secondary metrics get smaller cards
    const cards = [
        {
            label: 'Your CAGR',
            value: `${bench.userCagr.toFixed(1)}%`,
            comparison: `Industry avg: <strong>${benchmarks.industryCagr}%</strong>`,
            diff: bench.cagrVsIndustry,
            badge: bench.cagrVsIndustry > 0.5 ? 'above' : bench.cagrVsIndustry < -0.5 ? 'below' : 'at',
            primary: true
        },
        {
            label: 'Real Growth',
            value: `${bench.realGrowth.toFixed(1)}%`,
            comparison: `After <strong>${bench.totalInflation.toFixed(1)}%</strong> cumulative inflation`,
            diff: bench.realGrowth,
            badge: bench.realGrowth > 10 ? 'above' : bench.realGrowth > 0 ? 'at' : 'below',
            primary: true
        },
        {
            label: 'vs Industry Path',
            value: _state.showDollars
                ? (bench.vsIndustrySalary >= 0 ? '+' : '') + formatCurrency(bench.vsIndustrySalary)
                : (bench.vsIndustrySalary >= 0 ? '+' : '') + (bench.vsIndustrySalary / start * 100).toFixed(0) + ' pts',
            comparison: `At ${benchmarks.industryCagr}% CAGR: <strong>${_state.showDollars ? formatCurrency(bench.industryProjectedSalary) : Math.round(bench.industryProjectedSalary / start * 100)}</strong>`,
            diff: bench.vsIndustrySalary,
            badge: bench.vsIndustryPercent > 5 ? 'above' : bench.vsIndustryPercent < -5 ? 'below' : 'at',
            primary: true
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
            label: 'Purchasing Power',
            value: _state.showDollars
                ? (bench.purchasingPowerGain >= 0 ? '+' : '') + formatCurrency(bench.purchasingPowerGain)
                : (bench.purchasingPowerGain >= 0 ? '+' : '') + (bench.purchasingPowerGain / start * 100).toFixed(0) + ' pts',
            comparison: `${_state.showDollars ? formatCurrency(bench.inflationAdjustedStart) : Math.round(bench.inflationAdjustedStart / start * 100)} would equal start salary today`,
            diff: bench.purchasingPowerGain,
            badge: bench.purchasingPowerGain > 0 ? 'above' : bench.purchasingPowerGain < 0 ? 'below' : 'at'
        }
    ];

    // Security Note: innerHTML safe - 'cards' array contains only:
    // - Static labels (hardcoded strings)
    // - Numeric values (toFixed, formatCurrency, Math.round - all produce safe strings)
    // - Badge strings (conditional on 'above'/'below'/'at' - all hardcoded safe values)
    // No user-controlled data interpolated without validation.
    grid.innerHTML = cards.map(card => `
        <div class="market-card ${card.diff > 0 ? 'positive' : card.diff < 0 ? 'negative' : 'neutral'}${card.primary ? ' market-card-primary' : ''}">
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
