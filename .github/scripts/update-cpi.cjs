#!/usr/bin/env node

/**
 * Update CPI Data Script
 *
 * Fetches latest CPI data from Bureau of Labor Statistics API
 * and updates js/constants.js with annual inflation rates.
 *
 * BLS API: https://www.bls.gov/developers/api_signature_v2.htm
 * Series ID: CUUR0000SA0 (CPI All Urban Consumers, U.S. city average)
 */

const fs = require('fs');
const path = require('path');

const BLS_API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
const SERIES_ID = 'CUUR0000SA0'; // CPI-U All items, U.S. city average
const CONSTANTS_FILE = path.join(__dirname, '../../js/constants.js');

/**
 * Fetches CPI data from BLS API
 * @returns {Promise<Object>} API response with CPI series data
 */
async function fetchCPIData() {
    const currentYear = new Date().getFullYear();
    const startYear = 2010; // Match existing data start

    const payload = {
        seriesid: [SERIES_ID],
        startyear: startYear.toString(),
        endyear: currentYear.toString(),
        calculations: true
    };

    const response = await fetch(BLS_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`BLS API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'REQUEST_SUCCEEDED') {
        throw new Error(`BLS API error: ${data.message || 'Unknown error'}`);
    }

    return data;
}

/**
 * Extracts December CPI values by year
 * @param {Object} blsData - BLS API response
 * @returns {Map<number, number>} Map of year to December CPI index
 */
function extractDecemberValues(blsData) {
    const series = blsData.Results?.series?.[0];
    if (!series?.data) {
        throw new Error('No CPI data found in BLS response');
    }

    const decemberValues = new Map();

    for (const item of series.data) {
        // BLS returns M01-M12 for months (M13 is annual average)
        if (item.period === 'M12') {
            const year = parseInt(item.year, 10);
            const value = parseFloat(item.value);
            decemberValues.set(year, value);
        }
    }

    return decemberValues;
}

/**
 * Calculates year-over-year inflation rates
 * @param {Map<number, number>} decemberValues - December CPI values by year
 * @returns {Object} Object mapping year to inflation rate (%)
 */
function calculateInflationRates(decemberValues) {
    const rates = {};
    const years = Array.from(decemberValues.keys()).sort((a, b) => a - b);

    for (let i = 1; i < years.length; i++) {
        const year = years[i];
        const prevYear = years[i - 1];
        const currentValue = decemberValues.get(year);
        const prevValue = decemberValues.get(prevYear);

        // YoY inflation: ((current - previous) / previous) * 100
        const inflationRate = ((currentValue - prevValue) / prevValue) * 100;
        rates[year] = Math.round(inflationRate * 10) / 10; // Round to 1 decimal
    }

    return rates;
}

/**
 * Updates js/constants.js with new CPI data
 * @param {Object} newRates - New inflation rates by year
 */
function updateConstantsFile(newRates) {
    let content = fs.readFileSync(CONSTANTS_FILE, 'utf8');

    // Build new cpiData object string
    const years = Object.keys(newRates).map(Number).sort((a, b) => a - b);
    const rateEntries = years.map(year => `    ${year}: ${newRates[year]}`);
    const newCpiDataBlock = `export const cpiData = {\n${rateEntries.join(',\n')}\n};`;

    // Replace existing cpiData block using regex
    const cpiDataRegex = /export const cpiData = \{[\s\S]*?\};/;
    if (!cpiDataRegex.test(content)) {
        throw new Error('Could not find cpiData block in constants.js');
    }
    content = content.replace(cpiDataRegex, newCpiDataBlock);

    // Update cpiMetadata.lastUpdated
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastUpdatedRegex = /lastUpdated: ['"][^'"]+['"]/;
    if (lastUpdatedRegex.test(content)) {
        content = content.replace(lastUpdatedRegex, `lastUpdated: '${yearMonth}'`);
    }

    // Also update benchmarkMetadata.lastUpdated.inflationData
    const inflationDataRegex = /(inflationData:\s*['"])[^'"]+(['"])/;
    if (inflationDataRegex.test(content)) {
        content = content.replace(inflationDataRegex, `$1${yearMonth}$2`);
    }

    fs.writeFileSync(CONSTANTS_FILE, content, 'utf8');
}

/**
 * Main execution
 */
async function main() {
    console.log('Fetching CPI data from BLS API...');

    try {
        const blsData = await fetchCPIData();
        console.log('BLS API response received');

        const decemberValues = extractDecemberValues(blsData);
        console.log(`Found December values for ${decemberValues.size} years`);

        const inflationRates = calculateInflationRates(decemberValues);
        const years = Object.keys(inflationRates);
        console.log(`Calculated inflation rates for ${years.length} years: ${years[0]}-${years[years.length - 1]}`);

        updateConstantsFile(inflationRates);
        console.log('Updated js/constants.js');

        // Log the new values for PR review
        console.log('\nNew CPI inflation rates:');
        for (const [year, rate] of Object.entries(inflationRates).slice(-5)) {
            console.log(`  ${year}: ${rate}%`);
        }

        console.log('\nCPI data update complete!');
    } catch (error) {
        console.error('Error updating CPI data:', error.message);
        process.exit(1);
    }
}

main();
