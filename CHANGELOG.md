# Changelog

All notable changes to Paylocity Compensation Journey will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-26

### Added
- **Initial Release** - Complete compensation analytics dashboard
- **Seven Analysis Tabs**:
  - Home: KPIs and main compensation timeline chart
  - Story: Auto-generated narrative of compensation journey
  - Market: Benchmark comparison against B2B SaaS industry standards
  - History: Complete compensation records table
  - Analytics: CAGR breakdowns, annual change rates, raise distribution
  - Projections: Future salary calculator with multiple scenarios
  - Help: Feature guide and keyboard shortcuts
- **Dual Themes**: Artistic (light) and Tactical (dark) with smooth transitions
- **Privacy Mode**: Toggle between actual dollar amounts and indexed values for screenshots
- **Paylocity Parser**: Advanced parser handling inconsistent data formats with multiple fallback strategies
- **Inflation Analysis**: Bureau of Labor Statistics CPI data for real purchasing power calculations
- **Market Benchmarks**: B2B SaaS industry standards for CAGR, typical raises, and growth comparisons
- **Chart Visualizations**:
  - 4 chart types (Line, Bar, Area, Step) for main timeline
  - YoY comparison bar chart with color-coded performance
  - Category breakdown doughnut chart
  - Multi-scenario projection charts
- **Keyboard Shortcuts**: Keys 1-7 for tab switching, Cmd/Ctrl+K for focus
- **Data Import/Export**: Save dashboard as JSON, reload anytime without re-pasting
- **Demo Data**: 4 career progression scenarios (early career through senior tenure)
- **Desktop-First Design**: Three-column layout optimized for financial analysis
- **Offline Support**: Works completely offline after initial page load
- **100% Client-Side**: Zero server communication, all processing in browser
- **Single-File Architecture**: Entire app in one ~5,000 line HTML file

### Security
- No tracking, cookies, or external API calls (except Chart.js CDN)
- No data storage beyond theme preference in localStorage
- Salary data never leaves the browser tab

### Documentation
- Comprehensive README with screenshots
- Developer guide (CLAUDE.md) with architecture details
- Inline help system within app

## [Unreleased]

### Planned
- Subresource Integrity (SRI) hash for Chart.js CDN (security enhancement)
- Enhanced focus indicators for keyboard navigation (accessibility)
- JSDoc documentation for complex functions (code quality)
- Inline comments for parser regex patterns (maintainability)
- Font loading optimization (performance)

---

**Note**: This project was built to fill a gap in Paylocity's native interface - providing employees with the compensation insights and analytics they actually want to see.
