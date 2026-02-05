# Issue Plan - Paylocity Compensation Journey

**Updated**: 2026-02-04
**Total Issues**: 11 open, 136 closed (92.5% completion rate)

---

## Phase 1: Security Hardening (~2-3 hours) ✅ COMPLETE

| Issue | Title | Effort | Priority | Status |
|-------|-------|--------|----------|--------|
| #169 | Add data: URL to security validation patterns | easy | 🟡 MED | ✅ Done |
| #173 | Consider encrypting localStorage backup data | medium | 🟡 MED | ⏭️ Skipped (unnecessary for personal tool) |
| #176 | Add JSON schema validation on file import | easy | 🟢 LOW | ✅ Done |

**Rationale**: Security issues first. Quick wins that harden the app before adding more features.

**Completed 2026-02-04**:
- #169: Added `/data:/i` pattern to `js/security.js` + 5 test cases
- #176: Added `validateImportedData()` schema validator to `app.js`

---

## Phase 2: Testing Infrastructure (~3-4 hours) ✅ COMPLETE

| Issue | Title | Effort | Priority | Status |
|-------|-------|--------|----------|--------|
| #168 | Unskip 3 inflation tests in calculations.test.js | medium | 🟡 MED | ✅ Done |
| #167 | Add performance testing (benchmarks and load tests) | medium | 🟡 MED | ✅ Done |

**Rationale**: Fix existing tests + add performance baselines BEFORE refactoring code.

**Completed 2026-02-04**:
- #168: Fixed skipped inflation tests in calculations.test.js
- #167: Added performance benchmarks and load tests

---

## Phase 3: Quick Code Quality Wins (~2-3 hours) ✅ COMPLETE

| Issue | Title | Effort | Priority | Status |
|-------|-------|--------|----------|--------|
| #172 | Debounce paste input validation | easy | 🟡 MED | ✅ Done |
| #174 | Move inline styles to CSS classes | easy | 🟢 LOW | ✅ Done |
| #166 | Create chart updater factory function (DRY pattern) | medium | 🟡 MED | ✅ Done |

**Rationale**: Small, self-contained improvements. Low risk changes that improve maintainability.

**Completed 2026-02-04**:
- #172: Added debounce to paste input validation
- #174: Moved inline styles to CSS classes (showUserMessage, showStaleDataWarning)
- #166: Created chart updater factory function for DRY pattern

---

## Phase 4: Documentation (~2-3 hours)

| Issue | Title | Effort | Priority |
|-------|-------|--------|----------|
| #171 | Add architecture diagrams to CLAUDE.md | medium | 🟡 MED |
| #170 | Create CONTRIBUTING.md for contributor guidelines | medium | 🟡 MED |
| #175 | Increase inline comment density in app.js (14% → 20%) | easy | 🟢 LOW |

**Rationale**: Document current architecture BEFORE major refactoring in Phase 5.

---

## Phase 5: Major Refactoring (~6-8 hours)

| Issue | Title | Effort | Priority |
|-------|-------|--------|----------|
| #165 | Split initEventListeners() into feature-specific functions | medium | 🟡 MED |
| #164 | Split app.js into focused modules (reduce 2,400 lines) | hard | 🟡 MED |

**Rationale**: Big changes that touch core app structure. Do after tests pass and architecture is documented.

---

## Phase 6: Performance Optimization (~4-6 hours)

| Issue | Title | Effort | Priority |
|-------|-------|--------|----------|
| #181 | Implement lazy rendering for tab content | medium | 🟢 LOW |
| #180 | Implement code splitting for app.js | hard | 🟢 LOW |

**Rationale**: Optimize after modularization complete. These build on Phase 5 changes.

---

## Backlog: Hard Items (Defer)

| Issue | Title | Effort | Priority | Defer Reason |
|-------|-------|--------|----------|--------------|
| #148 | Refactor to testable architecture with dependency injection | hard | 🟡 MED | After Phase 5 modularization |
| #145 | Make parser resilient to Paylocity format changes | hard | 🟢 LOW | No format issues reported |
| #116 | Update landing page screenshots to Tactical theme | hard | 🟢 LOW | After all visual work complete |

---

## Priority Summary

| Priority | Count | Issues |
|----------|-------|--------|
| 🔴 HIGH | 0 | — |
| 🟡 MED | 6 | #173, #171, #170, #165, #164, #148 |
| 🟢 LOW | 5 | #175, #181, #180, #145, #116 |

---

## Issue Categories

| Category | Count | Issues |
|----------|-------|--------|
| Security | 1 | #173 |
| Code Quality | 2 | #164, #165 |
| Performance | 2 | #180, #181 |
| Documentation | 3 | #170, #171, #175 |
| Hard/Backlog | 3 | #116, #145, #148 |

---

## Recommended Path

1. **Phase 1** → Security first (protects users)
2. **Phase 2** → Testing infrastructure (catches regressions)
3. **Phase 3** → Quick wins (immediate code quality)
4. **Phase 4** → Documentation (captures current state)
5. **Phase 5** → Major refactoring (with tests + docs in place)
6. **Phase 6** → Performance (builds on modular code)
7. **Backlog** → When time/need arises

**Project Status**: Active development. Core features complete, focusing on maintainability and performance.

---

## Archived: Previous Work ✅ COMPLETE

| Phase | Issues | Status |
|-------|--------|--------|
| Design System Foundations | #101, #102, #107 | ✅ closed |
| Component Consistency | #105, #106, #64 | ✅ closed |
| Critical UX Bugs | #109, #112, #113 | ✅ closed |
| Analytics Cleanup | #115, #90, #91 | ✅ closed |
| Quick Wins | #66, #104, #108, #111, #120, #123, #124 | ✅ closed |
| SEO & Demo Polish | #114, #125 | ✅ closed |
| Cross-Tab Consistency | #72, #74, #79, #86, #87 | ✅ closed |
| Projections Tab | #92, #93, #94, #95, #96 | ✅ closed |
| Help Tab | #97, #98, #99, #100 | ✅ closed |
| History Tab | #82, #83, #84, #85 | ✅ closed |
| Analytics Tab | #88, #89, #121, #137, #138 | ✅ closed |
| Story/Home Tab | #69, #70, #71, #73 | ✅ closed |
| Critical Security & Legal | #141, #140, #142 | ✅ closed |
| Landing Page Polish | #154, #103, #119, #155 | ✅ closed |
| Trust & Transparency | #144, #147 | ✅ closed |
| Performance Optimization | #150, #149 | ✅ closed |
| Market Tab Visual Polish | #77, #78, #80, #81 | ✅ closed |
| Global Typography | #75, #76, #103 | ✅ closed |
| UI Polish | #139, #122, #157 | ✅ closed |
| Data Accuracy | #151 (CPI auto-update) | ✅ closed |
| Desktop Block Overlay | #146 (viewport block) | ✅ closed |
| Testing Infrastructure | #167, #168 | ✅ closed |
| Quick Code Quality Wins | #166, #172, #174 | ✅ closed |

**Total Closed**: 136 issues

---

*Plan updated 2026-02-04 (Phases 2 & 3 closed). Re-run `/tg-issues` to refresh.*
