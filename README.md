# Compensation Journey

Turn your Paylocity pay history into an actual useful dashboard with market benchmarks, inflation analysis, and insights you'd expect from any modern financial tool.

Paylocity gives you raw pay history tables. It doesn't show you CAGR, market comparisons, inflation-adjusted growth, or any of the metrics an employee would actually want to see. So here's a tool that does.

**[Live Demo](https://tejasgadhia.github.io/paylocity-compensation-journey/)**

## Screenshots

### Splash Screen (Artistic Theme)
![Splash Screen - Import Your Data](screenshots/splash-artistic.png)

### Home Dashboard (Artistic Theme)
![Home Dashboard - Light Mode](screenshots/home-artistic.png)

### Market Benchmarks (Tactical Theme)
![Market Comparison - Dark Mode](screenshots/market-tactical.png)

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

## Technical

**Stack:**
- Vanilla JavaScript (no frameworks, no build step)
- Chart.js for visualizations
- CSS custom properties for theme switching
- Single HTML file (~5,000 lines)

**Architecture:**
- Client-side only, zero backend
- Hash-based navigation for stateful URLs
- Desktop-first design (removes mobile responsive code entirely)
- Parser handles Paylocity's inconsistent formatting (concatenated values, variable date formats, hourly rates, etc.)

**Browser support:** Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

## File Structure

```
compensation-journey/
├── index.html    # Entire app in one file
├── README.md
└── LICENSE
```

## License

MIT. Use it, modify it, fork it, whatever.

---

**Disclaimer:** Benchmark data is approximate. This is for informational purposes, not financial advice. Your mileage may vary based on role, location, company stage, etc.
