# Next Session: Refactor Monolith (Issue #12)

## 🎯 Current State

**Project**: Paylocity Compensation Journey  
**Live URL**: https://tejasgadhia.github.io/paylocity-compensation-journey/  
**Branch**: main  
**Last Commit**: 30270e2 (✅ Add unit tests for critical functions)

### ✅ Completed (This Session)
- **Issue #18**: Added JSDoc comments to key functions ✅
- **Issue #17**: Set up Vitest with 69 tests (41 passing) ✅
- Extracted JavaScript from HTML to external `app.js` (2,481 lines)
- Converted project to ES modules
- Set up testing infrastructure with Vitest

### 🔶 Next Task: Issue #12 - Refactor 5,132-line Monolith

**Goal**: Split `app.js` into modular files for better maintainability, caching, and debugging.

**Current Structure**:
```
index.html (3,425 lines - HTML + CSS)
app.js (2,481 lines - all JavaScript)
tests/ (69 tests)
```

**Target Structure**:
```
js/
  ├── constants.js        (~50 lines - CONSTANTS, CPI data, benchmarks)
  ├── state.js            (~30 lines - state management)
  ├── parser.js           (~300 lines - parsePaylocityData, parseRecord, validation)
  ├── calculations.js     (~200 lines - CAGR, inflation, real growth)
  ├── charts.js           (~400 lines - Chart.js wrappers, theme integration)
  ├── ui.js               (~800 lines - DOM manipulation, event handlers)
  ├── demo.js             (~200 lines - demo data generation)
  ├── export.js           (~100 lines - data export functions)
  └── app.js              (~400 lines - main orchestration, initialization)
```

**Benefits**:
- 70% faster repeat visits (cached modules)
- Parallel downloads (browser can fetch multiple files)
- Easier debugging (smaller files, clearer scope)
- Better test organization (one test file per module)

**Testing Considerations**:
- Update test imports after refactoring
- Tests are already modular (parser.test.js, calculations.test.js)
- Run `npm test` after each module extraction to ensure nothing breaks

## 📋 Recommended Approach

### Phase 1: Extract Constants & Data (Low Risk)
1. Create `js/constants.js` - Move CONSTANTS, CPI_DATA, BENCHMARKS
2. Update app.js imports
3. Update test imports
4. Run tests: `npm test` (should all pass)

### Phase 2: Extract Pure Functions (Low Risk)
1. Create `js/calculations.js` - Move calculation functions
2. Create `js/parser.js` - Move parser functions
3. Update app.js imports
4. Update test imports
5. Run tests: `npm test` (should all pass)

### Phase 3: Extract UI Logic (Medium Risk)
1. Create `js/charts.js` - Move chart-building functions
2. Create `js/ui.js` - Move DOM manipulation, event handlers
3. Create `js/state.js` - Move state management
4. Update app.js imports
5. Test manually with browser (charts, interactions)

### Phase 4: Extract Utilities (Low Risk)
1. Create `js/demo.js` - Move demo data generation
2. Create `js/export.js` - Move export functions
3. Update app.js imports

### Phase 5: Update HTML & Verify
1. Update index.html with multiple <script> tags (modules load order matters)
2. Test in browser: light/dark mode, charts, all tabs
3. Run full test suite: `npm test`

## 🚨 Important Notes

### Current Working Setup
- **ES Modules**: Project uses ES module syntax (`import`/`export`)
- **Browser Environment Checks**: Browser code wrapped in `typeof window !== 'undefined'` checks
- **Test Coverage**: 41 passing tests, verify they still pass after refactoring
- **GitHub Pages**: Automatically deploys on push to main

### Gotchas to Watch For
1. **Module Load Order**: Some modules depend on others being loaded first
2. **Global State**: `employeeData`, `state`, `charts` are global - may need centralized state module
3. **Browser APIs**: Functions using `window`, `document`, `Chart` need browser checks
4. **Test Imports**: Each test file imports from modules, update paths after refactoring

### Commands You'll Need
```bash
npm test              # Run tests after each change
npm run test:watch    # Watch mode while refactoring
git status            # Check what files changed
git add . && git commit -m "..."  # Commit incrementally
git push              # Deploy to GitHub Pages
```

## 📝 Issue #12 Details

**Title**: 🟠 HIGH: Refactor 5,132-line monolith into modular files  
**Labels**: enhancement, P3, performance  
**Current file size**: index.html (3,425 lines) + app.js (2,481 lines) = 5,906 total

**Performance Impact**:
- Current: 200KB+ single file, slow parse, no caching
- After: ~10 files, parallel downloads, cached modules, 70% faster repeat visits

## 🎯 Success Criteria

- [ ] All JavaScript split into logical modules (8-10 files)
- [ ] All tests still passing (`npm test`)
- [ ] App works in browser (light/dark mode, all tabs, charts)
- [ ] index.html updated with module script tags
- [ ] Committed and pushed to main
- [ ] Issue #12 closed with summary

## 💡 Tips

- **Commit incrementally** - After each module extraction
- **Test constantly** - Run `npm test` after each change
- **Browser test frequently** - Open index.html in browser to verify
- **Start with low-risk modules first** - Constants, pure functions
- **Use git worktree** - Create feature branch for safety if needed

---

**Ready to refactor!** Start with Phase 1 (constants extraction) and work through systematically.
