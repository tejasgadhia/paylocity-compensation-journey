# Changelog

All notable changes to Paylocity Compensation Journey will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.0] - 2026-01-28

**Focus: New Landing Page & Accessibility Polish**

This release introduces a completely redesigned landing page with an interactive before/after comparison slider, comprehensive accessibility fixes, and print-optimized styles.

### Added
- **Landing Page Redesign**: New hero section with interactive before/after comparison slider showcasing Paylocity vs this dashboard
- **Before/After Slider**: Drag-to-compare visual demonstration of the value proposition
- **Print Styles**: Optimized print stylesheet for all dashboard views

### Changed
- **Touch Targets**: All interactive elements now meet WCAG 44px minimum touch target requirement
- **Theme Refinement**: Sage & Ember themes refined for better contrast and visual hierarchy
- **UX Polish**: 45 minor issues fixed across the interface for smoother user experience

### Fixed
- **Demo Button Crash**: Fixed TypeError when Event object passed as scenarioIndex parameter
- **Theme Consistency**: Improved color token consistency across Sage and Ember themes

---

## [3.1.0] - 2026-01-28

**Focus: Architecture, UX Polish & Documentation**

This release completes the issue backlog (22/22 issues), modernizes the codebase architecture, and adds comprehensive API documentation.

### Added
- **API Documentation**: Comprehensive `docs/API.md` reference (579 lines) covering all public functions, data structures, and usage examples (#58)
- **Cross-browser Visual Regression**: Added Firefox and WebKit baseline snapshots for visual testing
- **Keyboard Shortcuts Help**: Improved accessibility with visible shortcut hints in Help tab (#57)

### Changed
- **Modular Architecture**: Extracted chart functions to `js/charts.js` (667 lines) - cleaner separation of concerns (#46)
- **Removed AppState Pattern**: Simplified state management back to direct module imports (#44)
- **Button Differentiation**: Primary/secondary/tertiary button hierarchy for clearer UI affordances (#20)
- **Theme Toggle**: Converted to segmented control for better discoverability (#57)

### Fixed
- **UX Polish**: Improved button visual hierarchy and interactive states (#61)
- **Quick Wins Batch**: Multiple small fixes including edge cases and UI tweaks (#60)

### Documentation
- **Closed #32**: app.js decomposition marked complete - architecture already well-modularized with 6 focused modules (3,220 total lines)

### Technical
- Final architecture: `app.js` (1,776 lines) + 5 extracted modules
- All 22 GitHub issues resolved
- 90% E2E test coverage maintained

---

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
