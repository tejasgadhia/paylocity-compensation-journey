# Compensation Journey

Turn your Paylocity pay history into an actual useful dashboard with market benchmarks, inflation analysis, and insights you'd expect from any modern financial tool.

Paylocity gives you raw pay history tables. It doesn't show you CAGR, market comparisons, inflation-adjusted growth, or any of the metrics an employee would actually want to see. So here's a tool that does.

**[Live Demo](https://tejasgadhia.github.io/paylocity-compensation-journey/)**

## Screenshots

**Artistic Theme (Light Mode)**

![Splash Screen - Import Your Data](screenshots/splash-artistic.png)
*Splash screen with data import instructions*

![Home Dashboard - KPIs and Timeline](screenshots/home-artistic.png)
*Dashboard with compensation timeline and key metrics*

**Tactical Theme (Dark Mode)**

![Home Dashboard - Dark Mode](screenshots/home-tactical.png)
*Same dashboard in tactical (dark) theme*

![Market Benchmarks - Industry Comparison](screenshots/market-tactical.png)
*Benchmark analysis against B2B SaaS industry standards*

## What This Does

Paste your Paylocity pay history, get seven tabs of analysis:
- **Home** - KPIs and main compensation timeline chart
- **Story** - Auto-generated narrative of your compensation journey
- **Market** - How you stack up against B2B SaaS benchmarks (CAGR, raise %, inflation-adjusted growth)
- **History** - Complete compensation records table
- **Analytics** - CAGR breakdowns, annual change rates, raise distribution
- **Projections** - Future salary calculator
- **Help** - Feature guide and keyboard shortcuts

Includes CPI data from Bureau of Labor Statistics for real purchasing power analysis. Two themes (Artistic and Tactical), privacy mode for screenshots, keyboard shortcuts, the works.

Desktop-only. Mobile is intentionally blocked because responsive complexity isn't worth it for a financial dashboard.

## How to Use

1. **Open Paylocity** - Go to **My Information** → **Compensation**
2. **Access your pay history** - Click the **"Rates"** tab
3. **Enable private data** - Toggle **"Show Private Data"** (top right corner)
4. **Select all data** - Highlight from the "Rates" header row down to your last history entry
   - **Mac**: `Cmd + A` to select all
   - **Windows**: `Ctrl + A` to select all
5. **Copy the data** - `Cmd + C` (Mac) or `Ctrl + C` (Windows)
6. **Paste into this tool** - Return to Compensation Journey, paste into the text area, and click **"Generate Dashboard"**

That's it! Your data is processed entirely in your browser—nothing is uploaded anywhere.

**Pro tip:** Save your dashboard as JSON using the "Save Data" button. You can reload it anytime without re-pasting from Paylocity.

## Privacy

**Your data never leaves your device.** Period.

- 100% client-side processing (vanilla JavaScript)
- Zero server uploads or external requests
- No cookies, no storage, no tracking, no AI/ML APIs
- Works completely offline after the page loads
- Your salary data stays in your browser tab

Save as JSON to your computer if you want. Load it later. That's it.

### Don't Trust Me?

Fair. Here's how to verify this tool is truly private:

**Download for offline use:**
1. Click the **"Download this tool"** button on the splash screen (or right-click → Save Page As)
2. **Disconnect from the internet** (turn off Wi-Fi, unplug ethernet)
3. **Open the downloaded HTML file** in your browser
4. **Paste your Paylocity data** and generate your dashboard

The tool works entirely offline. Open your browser's DevTools (F12) → **Network tab** → you'll see zero outgoing requests after the initial page load.

**Verify the code:**
- **Inspect the source**: The code is split into modular JS files (`app.js`, `js/*.js`)
- **Check network activity**: No API calls, no tracking, no external requests (except Chart.js CDN on initial load)
- **Audit it yourself**: The code is unminified and readable—search for `fetch(`, `XMLHttpRequest`, or `navigator.sendBeacon` to confirm no data leaves your browser

**Privacy promise**: Your salary data never touches a server. It processes in your browser tab and disappears when you close it (unless you explicitly save it).

## File Structure

```
compensation-journey/
├── index.html           # HTML + CSS (~3,500 lines)
├── app.js               # Main application logic
├── js/
│   ├── calculations.js  # Financial calculation helpers
│   ├── constants.js     # Named constants
│   └── parser.js        # Paylocity data parser
├── assets/
│   ├── js/              # Self-hosted Chart.js
│   └── fonts/           # Self-hosted JetBrains Mono, Space Grotesk
├── screenshots/         # UI screenshots (16 images, 2 themes)
├── tests/               # Playwright E2E + Vitest unit tests
├── README.md
├── CLAUDE.md            # Developer documentation
├── LICENSE
└── .gitignore
```

## License

This project is licensed under the [O'Saasy License Agreement](https://osaasy.dev/).

**TL;DR**: You can use, modify, and distribute this project freely. You can self-host it for personal or commercial use. However, you cannot offer it as a competing hosted/managed SaaS product.

See [LICENSE](LICENSE) for full details.

---

**Disclaimer:** Benchmark data is approximate. This is for informational purposes, not financial advice. Your mileage may vary based on role, location, company stage, etc.
