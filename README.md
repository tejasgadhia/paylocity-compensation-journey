# Compensation Journey

**Transform your Paylocity pay history into a beautiful, interactive dashboard with market benchmarks and inflation analysis.**

A 100% client-side, privacy-first compensation visualization tool that parses your Paylocity data and generates insights about your salary growth, how you compare to B2B SaaS industry benchmarks, and your real purchasing power after inflation.

---

## ✨ Features

### 📊 Interactive Dashboard
- **Dual Themes**: Switch between "Tactical" (dark, military-inspired) and "Artistic" (warm, editorial) aesthetics
- **Privacy Mode**: Toggle between actual dollar amounts and indexed values (100 = starting salary)
- **Mobile Preview**: See how your dashboard looks on mobile devices
- **Keyboard Shortcuts**: Navigate efficiently with hotkeys

### 📈 Six Dashboard Tabs

| Tab | Description |
|-----|-------------|
| **Story** | Auto-generated narrative of your compensation journey with key milestones |
| **Market** | Industry benchmark comparisons and inflation/purchasing power analysis |
| **History** | Complete compensation records table with all changes |
| **Analytics** | CAGR calculations, raise distribution charts, category breakdowns |
| **Projections** | Future salary calculator with customizable growth rates |
| **Help** | Feature guide and keyboard shortcuts reference |

### 🎯 Market Benchmarking
Compare your compensation against B2B SaaS industry standards:
- **CAGR Comparison**: Your compound annual growth vs industry average (6%)
- **Raise Analysis**: Average raise % vs typical range (3-5%) and high performer range (6-10%)
- **Raise Frequency**: Time between raises vs 12-month industry standard
- **Performance Tier**: Automatic classification (Exceeding / Meeting / Below benchmarks)

### 💰 Inflation & Purchasing Power
- **Real Growth**: Inflation-adjusted growth rate using CPI data
- **Purchasing Power**: Calculate actual gains/losses in today's dollars
- **Cumulative Inflation**: Total CPI increase over your tenure
- **Historical CPI Data**: Bureau of Labor Statistics data from 2010-2025

### 🏆 Milestone Detection
Automatically identifies career achievements:
- Six-figure salary threshold
- Salary doubled
- $200K milestone
- Largest single raise
- Tenure milestones (5, 10+ years)

---

## 🔒 Privacy & Security

**Your data never leaves your device.**

| Feature | Description |
|---------|-------------|
| ✅ **100% Client-Side** | All processing happens in your browser |
| ✅ **No Server Uploads** | Zero data transmission to any server |
| ✅ **No External Requests** | Works completely offline after loading |
| ✅ **No Cookies/Storage** | Nothing saved unless you explicitly export |
| ✅ **No AI Processing** | Pure JavaScript parsing, no ML/AI APIs |
| ✅ **No Analytics/Tracking** | No third-party scripts or telemetry |

---

## 🚀 Getting Started

### Option 1: Use the Demo
Click **"View Demo Dashboard"** on the landing page to explore with sample data.

### Option 2: Import Your Paylocity Data

1. Log in to [paylocity.com](https://paylocity.com)
2. Click the **Pay** card on your dashboard
3. Click **Show Private Data**
4. Navigate to the **Rates** tab
5. Select all content from `Rates` at the top through `items` at the bottom
6. Copy (Ctrl+C / Cmd+C) and paste into the text area
7. Click **Generate Dashboard**

### Option 3: Load Previously Saved Data
Click **"or load saved .json"** to import a previously exported JSON file.

---

## 💾 Saving Your Data

Once your dashboard is generated, click **"Save Data"** in the header to download a JSON file. This file contains your parsed compensation records and can be loaded later without re-pasting from Paylocity.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1-6` | Switch between tabs |
| `T` | Toggle theme (Tactical/Artistic) |
| `P` | Toggle privacy mode ($/Index) |
| `M` | Toggle mobile preview |

---

## 📊 Benchmark Data Sources

Market comparison benchmarks are compiled from:
- Radford Global Technology Survey
- Mercer Compensation Surveys
- Levels.fyi compensation data
- Glassdoor B2B SaaS salary reports

**Benchmark Values (2025):**
| Metric | Value |
|--------|-------|
| Industry CAGR | 6% |
| Typical Annual Raise | 3-5% |
| High Performer Raise | 6-10% |
| Promotion Bump | 10-20% |
| Avg Time Between Raises | 12 months |

**CPI Data Source:** U.S. Bureau of Labor Statistics (CPI-U Annual Averages)

---

## 🛠️ Technical Details

### Built With
- **Vanilla JavaScript** - No frameworks, no build step
- **Chart.js** - Interactive charts and visualizations
- **CSS Custom Properties** - Theme switching via CSS variables
- **Single HTML File** - Everything in one portable file (~4,200 lines)

### Parser Capabilities
The Paylocity parser handles:
- Multiple date formats (MM/DD/YYYY)
- Concatenated values without spaces
- Dollar amounts with commas and decimals
- Hourly rate extraction (XX.XXXX / Hour)
- Percentage values (4 decimal places)
- Change reason detection (Merit, Equity, Market Adjustment, etc.)

### Browser Support
Works in all modern browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

---

## 📁 File Structure

```
compensation-journey/
├── index.html          # Main application (single file)
├── README.md           # This file
└── LICENSE             # MIT License
```

---

## 🤝 Contributing

Contributions are welcome! Some ideas for improvements:

- [ ] Additional payroll system parsers (ADP, Workday, etc.)
- [ ] Export to PDF/PNG
- [ ] Additional chart types
- [ ] Localization/i18n support
- [ ] Role-specific benchmarks
- [ ] Stock/equity compensation tracking

---

## 📝 License

MIT License - feel free to use, modify, and distribute.

---

## ⚠️ Disclaimer

- Benchmark data is approximate and varies by role, location, company stage, and market conditions
- This tool is for personal informational purposes only
- Not financial or career advice
- CPI data reflects U.S. national averages

---

## 🙏 Acknowledgments

- [Chart.js](https://www.chartjs.org/) for visualization
- [Bureau of Labor Statistics](https://www.bls.gov/) for CPI data
- B2B SaaS compensation surveys for benchmark data

---

**Made with ☕ for anyone who wants to understand their compensation journey.**
