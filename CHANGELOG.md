# Changelog

All notable changes to Paylocity Compensation Journey will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-01-26

**Major Release: Polish & Production-Ready**

This release focuses on security hardening, accessibility compliance, performance optimization, and comprehensive documentation. Addresses all outstanding enhancement issues.

### Added
- **CHANGELOG.md**: Comprehensive version history and release notes
- **JSDoc Documentation**: Added to 5 complex functions (parsePaylocityData, calculateCAGR, calculateRealGrowth, buildMainChart, updateMarket)
- **Regex Documentation**: Detailed inline comments explaining all parser patterns with examples
- **Focus Indicators**: Visible keyboard navigation outlines for all interactive elements (WCAG 2.2 AA)

### Security
- **SRI Hash**: Added Subresource Integrity hash to Chart.js CDN (prevents tampering attacks)
- **Version Pinning**: Locked Chart.js to 4.4.1 for reproducible builds

### Performance
- **Font Optimization**: Reduced from 4 font families to 2 (JetBrains Mono + Space Grotesk)
- **Removed Unused Weights**: Eliminated weight 500 (never used in styles)
- **62% Reduction**: Font downloads reduced from 16 files to 6 files
- **Consolidated Theme Fonts**: Artistic theme now uses Space Grotesk (was Libre Baskerville + Nunito)

### Improved
- **Code Quality**: All complex functions now have JSDoc with parameters, return values, and examples
- **Maintainability**: Parser regex patterns documented for easier future modifications
- **Accessibility**: Full WCAG 2.2 AA compliance for keyboard navigation

---

## [2.3.0] - 2026-01-15

### Fixed
- Calculation accuracy improvements
- Edge case handling in parser

---

## [2.2.0] - 2026-01-15

### Fixed
- Analytics fixes and UX improvements

---

## [2.1.0] - 2026-01-14

### Added
- URL parameters support
- UX improvements

---

## [2.0.0] - 2026-01-14

### Changed
- Major redesign and feature overhaul
- New and improved UI/UX

---

## [1.0.0] - 2026-01-12

### Added
- **Initial Release** - Complete compensation analytics dashboard
- **Seven Analysis Tabs**: Home, Story, Market, History, Analytics, Projections, Help
- **Dual Themes**: Artistic (light) and Tactical (dark) with smooth transitions
- **Privacy Mode**: Toggle between actual dollar amounts and indexed values
- **Paylocity Parser**: Advanced parser handling inconsistent data formats
- **Inflation Analysis**: Bureau of Labor Statistics CPI data
- **Market Benchmarks**: B2B SaaS industry standards
- **Chart Visualizations**: 4 chart types (Line, Bar, Area, Step)
- **Keyboard Shortcuts**: Keys 1-7 for tab switching
- **Data Import/Export**: Save dashboard as JSON
- **Demo Data**: 4 career progression scenarios
- **Desktop-First Design**: Three-column layout
- **Offline Support**: Works completely offline
- **100% Client-Side**: Zero server communication
- **Single-File Architecture**: Entire app in one HTML file

---

**Note**: This project was built to fill a gap in Paylocity's native interface - providing employees with the compensation insights and analytics they actually want to see.
