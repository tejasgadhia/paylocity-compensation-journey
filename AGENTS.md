<!-- reviewed: 2026-03-11 | next-review: 2026-Q3 | ~600 tokens -->
# Paylocity Compensation Journey

## What This Is
Transforms raw Paylocity pay history (paste from "Rates" tab) into a 7-tab financial dashboard with CAGR, inflation-adjusted growth, market benchmarks, and salary projections. 100% client-side vanilla JS — no build process, no server, no tracking. Desktop-only (mobile intentionally blocked).

## Architecture
- **Entry**: `index.html` + `styles.css` + `app.js` (orchestrator)
- **21 JS modules** in `js/` (~5,200 lines total), loaded via ES modules
- **DI pattern**: all modules initialized via `initX(deps)` functions — no implicit globals between modules
- **State**: simple globals in `app.js` (`state`, `employeeData`, `charts`)
- **Charts**: Chart.js v4.4.7 self-hosted (`assets/js/chart.umd.min.js`), always destroy before recreate
- **Themes**: tactical (dark) / artistic (light), CSS variables, `js/theme.js`
- **Data flow**: paste → `parser.js` → `validation.js` → `employeeData` → `charts.js` + `content.js` + `tables.js`
- **Deployment**: Zoho Catalyst static hosting, no build step (`scripts/build-client.sh` → `catalyst deploy`)

### Key Modules
| Module | Responsibility |
|--------|---------------|
| `app.js` | State, orchestration, init sequence |
| `js/parser.js` | Regex parsing of Paylocity paste (handles concatenated values) |
| `js/calculations.js` | CAGR, inflation-adjusted growth (memoized) |
| `js/constants.js` | Benchmarks, CPI data, named constants |
| `js/charts.js` | Chart.js wrappers (main, YoY, projection) |
| `js/content.js` | Story, market comparison, milestones |
| `js/security.js` | `escapeHTML`, `validateTemplateData`, XSS prevention |
| `js/event-handlers.js` | All DOM event listeners |
| `js/dashboard.js` | Dashboard lifecycle + KPI init |
| `js/validation.js` | Input validation, parse pipeline |

## Commands
- **Run**: `open index.html` or `python -m http.server 8000`
- **Test (unit)**: `npm test` (vitest)
- **Test (watch)**: `npm run test:watch`
- **Test (e2e)**: `npm run test:e2e` (Playwright + axe-core)
- **Build**: none — no build process

## Conventions
- camelCase functions: `calculateCAGR()`, `buildMainChart()`
- PascalCase constants: `CPI_DATA`, `BENCHMARKS`
- DI via init functions: `initCharts({ getState, getEmployeeData, ... })`
- Security-critical code tagged `// SECURITY: NEEDS-REVIEW`
- Parser uses multiple fallback strategies — never assume consistent Paylocity formatting

## Off-Limits
- Never commit `.env` or secrets
- Never add external dependencies (keep fully self-contained)
- Never enable mobile (responsive complexity not worth it for a financial dashboard)
- Never store salary data in localStorage (theme pref only)
- Never skip chart `destroy()` before recreating (memory leaks)
- Never hardcode benchmark values — use `BENCHMARKS` constant in `js/constants.js`

## Session Protocol
- **Start**: read `.context/handoff.md`. If missing: fresh environment — read `_planning/decisions.md` + `_planning/learnings.md` and ask user for current state.
- **End**: reset `.context/handoff.md` (5-layer format), append `.context/sessions.md`, commit `_planning/`

## Review Discipline
Check `<!-- next-review -->` header at session start. If overdue, flag before starting work.
