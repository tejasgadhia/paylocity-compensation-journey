# Compensation Journey

**Transform your Paylocity pay history into a beautiful, interactive dashboard with market benchmarks and inflation analysis.**

A 100% client-side, privacy-first compensation visualization tool that parses your Paylocity data and generates insights about your salary growth, how you compare to B2B SaaS industry benchmarks, and your real purchasing power after inflation.

**Desktop-Only Application**: Optimized exclusively for desktop browsers (laptop/desktop computers). Mobile and tablet devices are automatically blocked to ensure the best user experience.

---

## ✨ Features

### 📊 Interactive Dashboard
- **Dual Themes**: Switch between "Artistic" (default - warm, editorial) and "Tactical" (dark, military-inspired) aesthetics
- **Privacy Mode**: Toggle between actual dollar amounts and indexed values (100 = starting salary)
- **Stateful URLs**: Direct links to specific tabs (e.g., `#home`, `#market`, `#analytics`)
- **Keyboard Shortcuts**: Navigate efficiently with hotkeys (1-7 for tabs, T for theme, P for privacy)

### 📈 Seven Dashboard Tabs

| Tab | Shortcut | Description |
|-----|----------|-------------|
| **Home** | `1` | Overview with KPI cards and main compensation chart |
| **Story** | `2` | Auto-generated narrative of your compensation journey with key milestones |
| **Market** | `3` | Industry benchmark comparisons and inflation/purchasing power analysis |
| **History** | `4` | Complete compensation records table with all changes |
| **Analytics** | `5` | CAGR calculations, annual salary change rate, raise distribution charts |
| **Projections** | `6` | Future salary calculator with customizable growth rates |
| **Help** | `7` | Feature guide and keyboard shortcuts reference |

### 🏠 Home Tab Features
The dedicated Home tab provides an at-a-glance overview:
- **KPI Cards**: Current salary, total increase, CAGR, years of service
- **Main Chart**: Visual timeline of all compensation changes with interactive tooltips
- **Chart Types**: Switch between Line, Area, Bar, and Step chart styles

### 🎯 Market Benchmarking
Compare your compensation against B2B SaaS industry standards:
- **CAGR Comparison**: Your compound annual growth vs industry average (6%)
- **Raise Analysis**: Average raise % vs typical range (3-5%) and high performer range (6-10%)
- **Raise Frequency**: Average time between raises vs 12-month industry standard
- **Performance Tier**: Automatic classification (Exceeding / Meeting / Opportunity benchmarks)

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

### 📊 Analytics Enhancements
- **Annual Salary Change Rate**: Simplified year-over-year growth visualization
- **Raise Distribution**: Visual breakdown of raise types (Merit, Equity, Market Adjustment, etc.)
- **Comprehensive Tooltips**: User-friendly explanations for financial metrics like CAGR

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

### System Requirements
- **Desktop browser required** (Chrome, Firefox, Safari, or Edge)
- Minimum screen width: 900px
- Mobile and tablet devices are automatically blocked with a redirect screen

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
| `1` | Navigate to Home tab |
| `2` | Navigate to Story tab |
| `3` | Navigate to Market tab |
| `4` | Navigate to History tab |
| `5` | Navigate to Analytics tab |
| `6` | Navigate to Projections tab |
| `7` | Navigate to Help tab |
| `T` | Toggle theme (Artistic ↔ Tactical) |
| `P` | Toggle privacy mode (Dollar amounts ↔ Indexed values) |

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

### Architecture Highlights
- **Desktop-First Design**: Intentionally removes mobile responsive complexity for optimal desktop UX
- **Client-Side Processing**: Zero backend dependencies, works entirely in the browser
- **Hash-Based Navigation**: URL state management for deep linking and browser back/forward support
- **Progressive Enhancement**: Graceful handling of various Paylocity data formats

### Parser Capabilities
The Paylocity parser handles:
- Multiple date formats (MM/DD/YYYY)
- Concatenated values without spaces
- Dollar amounts with commas and decimals
- Hourly rate extraction (XX.XXXX / Hour)
- Percentage values (4 decimal places)
- Change reason detection (Merit, Equity, Market Adjustment, etc.)

### Browser Support
Works in all modern desktop browsers:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

**Note**: Mobile browsers are intentionally blocked. Users on devices with screen width < 900px will see a splash screen directing them to desktop.

---
## 📁 File Structure

```
compensation-journey/
├── index.html          # Main application (single file)
├── README.md           # This file
└── LICENSE             # MIT License
```

---

## 🎨 Recent Improvements

### Version 2.0 - January 2025
- **New Home Tab**: Dedicated landing page with KPI overview and main chart
- **Enhanced Navigation**: Tab bar moved directly under header for better visibility
- **Desktop-Only Focus**: Removed mobile responsive code; added mobile blocking splash screen
- **Stateful URLs**: Direct linking to tabs via hash navigation (e.g., `#market`, `#analytics`)
- **Improved Tab Experience**: Clickable tab references in Story content, clearer tab numbering
- **Analytics Refinements**: Simplified CAGR tooltips, renamed metrics for clarity
- **Layout Optimization**: Reduced vertical spacing ~25% to minimize scrolling
- **Theme Update**: Changed default theme from Tactical to Artistic
- **Bug Fixes**: Fixed z-index issues, URL hash persistence after reset

---

## 🤝 Contributing

Contributions are welcome! Some ideas for improvements:

- [ ] Additional payroll system parsers (ADP, Workday, etc.)
- [ ] Export to PDF/PNG
- [ ] Additional chart types (scatter plots, heatmaps)
- [ ] Localization/i18n support
- [ ] Role-specific benchmarks (Engineering, Sales, etc.)
- [ ] Stock/equity compensation tracking
- [ ] Comparison mode (multiple employees, team analytics)

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

## 🚀 Live Demo

Visit the [live application](https://tejasgadhia.github.io/paylocity-compensation-journey/) to try it with demo data or your own Paylocity export.

---

**Made with ☕ for anyone who wants to understand their compensation journey.**
