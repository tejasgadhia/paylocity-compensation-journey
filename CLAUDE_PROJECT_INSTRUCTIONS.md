# Claude Project Instructions: Compensation Journey

## Quick Reference

**Local repo:** `/Users/tejasgadhia/Downloads/paylocity-compensation-journey`
**GitHub:** https://github.com/tejasgadhia/paylocity-compensation-journey
**Live site:** https://tejasgadhia.github.io/paylocity-compensation-journey/
**Stack:** Single-file vanilla JS/HTML/CSS app (~5000 lines in index.html)

## File Access

**IMPORTANT:** Use Desktop Commander tools to read/edit files directly. Do NOT attempt `git clone` - there are proxy authentication issues with the bash tool that cause it to fail.

```
✅ Use: Desktop Commander:read_file, edit_block, write_file
❌ Avoid: git clone via bash_tool
```

## Codebase Structure (index.html)

| Section | Lines (approx) | Contents |
|---------|----------------|----------|
| CSS Variables & Themes | 1-100 | Theme definitions (tactical/artistic) |
| CSS Base & Layout | 100-500 | Core styling, landing page |
| CSS Components | 500-900 | Buttons, cards, tabs, toggles |
| CSS Demo Banner | 830-880 | Demo mode banner styling |
| CSS Header & Navigation | 880-1000 | Header, tab bar |
| CSS Dashboard | 1000-1600 | KPI cards, charts, tables |
| CSS Story/Content | 1600-1800 | Story tab, milestones |
| Mobile Block Screen | 1800-1900 | Mobile detection splash |
| HTML Landing Page | 2700-2900 | Input area, demo CTA, instructions |
| HTML Dashboard | 2900-3330 | Header, tabs, all tab content |
| JS State & Config | 3330-3400 | State object, chart refs |
| JS Benchmarks | 3400-3420 | B2B SaaS benchmark data |
| JS CPI Data | 3420-3450 | Bureau of Labor Statistics inflation data |
| JS Market Calculations | 3450-3550 | Inflation, purchasing power calcs |
| JS Parsing | 3550-3750 | Paylocity data parser |
| JS Demo Scenarios | 3767-3900 | 4 demo data scenarios |
| JS File Handling | 3900-3950 | JSON load/save |
| JS View Switching | 3950-4000 | Dashboard/landing toggle |
| JS Story Content | 4000-4200 | Theme-specific narratives |
| JS Utilities | 4200-4300 | Formatting, calculations |
| JS Charts | 4300-4700 | Chart.js configurations |
| JS Tab Management | 4700-4800 | Tab switching, URL hash |
| JS Initialization | 4800-end | Event listeners, init |

## Key Functions

- `loadDemoData(scenarioIndex)` - Load demo scenario (0-3)
- `cycleNextScenario()` - Cycle to next demo scenario
- `parseAndGenerate()` - Parse pasted Paylocity data
- `initDashboard()` - Initialize all dashboard components
- `setTab(tabName)` - Switch tabs (home/story/market/history/analytics/projections/help)
- `setTheme(theme)` - Toggle theme (tactical/artistic)
- `togglePrivacy()` - Toggle dollar amounts vs indexed values
- `calculateMarketComparison()` - Generate benchmark comparisons

## Demo Scenarios

4 scenarios cycling via "Try Another" button:
1. **Early Career** (2yr): $60K → $75K
2. **Growth Phase** (5yr): $60K → $100K (includes promotion)
3. **Established** (8yr): $60K → $130K
4. **Senior Tenure** (12yr): $60K → $190K

## Architecture Decisions

- **Desktop-only**: Mobile blocked intentionally (no responsive code)
- **Single file**: Everything in index.html for portability
- **Client-side only**: Zero server dependencies, privacy-first
- **Two themes**: Artistic (Zoho-inspired, default) and Tactical (Anduril/Palantir-inspired)
- **Hash navigation**: URL state via `#tab` and `?params`

## Common Tasks

**To edit styles:** Search for the CSS class name, edit in the `<style>` section
**To edit a tab's HTML:** Search for `id="tabNameContent"` 
**To add a new demo scenario:** Add to `DEMO_SCENARIOS` array (~line 3770)
**To modify benchmarks:** Edit `benchmarks` object (~line 3400)
**To update CPI data:** Edit `cpiData` object (~line 3420)

## Git Workflow

```bash
cd /Users/tejasgadhia/Downloads/paylocity-compensation-journey
git add index.html
git commit -m "Description of changes"
git push
```

## Testing Checklist

After changes:
- [ ] Demo mode loads correctly
- [ ] All 4 scenarios cycle properly
- [ ] Both themes render correctly
- [ ] Charts update on data/theme change
- [ ] Privacy toggle works
- [ ] All tabs accessible via keyboard (1-7)
- [ ] URL hash navigation works
