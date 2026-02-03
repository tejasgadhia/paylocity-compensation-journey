# Issue Plan - Paylocity Compensation Journey

**Updated**: 2026-02-03 (refreshed after #150 completion)
**Total Issues**: 19 open
**Priority Breakdown**: 2 HIGH, 7 MED, 10 LOW

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
| **Critical Security & Legal** | **#141, #140, #142** | ✅ **closed** |
| **Phase 1: Landing Page Polish** | **#154, #103, #119, #155** | ✅ **closed** |
| **Phase 2: Trust & Transparency** | **#144, #147** | ✅ **closed** |

**Total Closed**: 58 issues

---

## Phase 3: User Experience Quick Wins ← NEXT

| Issue | Title | Effort | Priority | Status |
|-------|-------|--------|----------|--------|
| #157 | Refactor Import Modal middle section to reduce visual noise | med | 🟡 MED | pending |

**Estimated**: ~1-2 hours (1 issue remaining)
**Rationale**: High-impact wins - performance and modal UX

**Completed in Phase 3:**
- ✅ #154 - User feedback mechanism (closed)
- ✅ #155 - Value proposition rewrite (closed)
- ✅ #150 - Chart.js update() optimization (closed)

---

## Phase 4: Demo & Onboarding

| Issue | Title | Effort | Priority | Status |
|-------|-------|--------|----------|--------|
| #152 | Show example Paylocity data format in demo | med | 🟡 MED | pending |
| #153 | Implement SEO and user acquisition strategy | med | 🟡 MED | pending |
| #151 | Auto-update CPI inflation data or add API integration | med | 🟡 MED | pending |

**Estimated**: ~4-6 hours
**Rationale**: Make it easier for users to get started and find the tool

---

## Phase 5: Performance & Bundle Optimization

| Issue | Title | Effort | Priority | Status |
|-------|-------|--------|----------|--------|
| #149 | Optimize bundle size and performance | med | 🟡 MED | pending |

**Estimated**: ~2-4 hours
**Rationale**: Load time improvements after core functionality solid

---

## Phase 6: Chart & Home Tab Polish

| Issue | Title | Effort | Priority | Status |
|-------|-------|--------|----------|--------|
| #139 | Chart toggle buttons overlap with timeline data line | easy | 🟢 LOW | pending |

**Estimated**: ~30 min
**Rationale**: Fix remaining Home tab visual issue

---

## Phase 7: Market Tab Visual Polish

| Issue | Title | Effort | Priority | Status |
|-------|-------|--------|----------|--------|
| #77 | Note box has wrong visual language | easy | 🟢 LOW | pending |
| #78 | Market tab summary callout is visually weak | easy | 🟢 LOW | pending |
| #80 | "↑ ABOVE" badges are too colorful | easy | 🟢 LOW | pending |
| #81 | Data sources section is an afterthought | easy | 🟢 LOW | pending |

**Estimated**: ~1-2 hours
**Rationale**: Market tab polish - all easy wins

---

## Phase 8: Global Typography

| Issue | Title | Effort | Priority | Status |
|-------|-------|--------|----------|--------|
| #75 | Numbers in monospace font stand out too much | easy | 🟢 LOW | pending |
| #76 | Link text is barely distinguished | easy | 🟢 LOW | pending |

**Estimated**: ~30 min (1 issue closed)
**Rationale**: Cross-cutting typography fixes

**Completed:**
- ✅ #103 - Navigation numbers removed (closed)

---

## Phase 9: Landing Page Polish

| Issue | Title | Effort | Priority | Status |
|-------|-------|--------|----------|--------|
| #122 | CJ logo/icon in header needs improvement | med | 🟢 LOW | pending |

**Estimated**: ~1-2 hours (1 issue closed)
**Rationale**: Landing page refinements

**Completed:**
- ✅ #119 - Before/After labels removed (closed)

---

## Deferred: Hard Tasks (Strategic/Architectural)

| Issue | Title | Effort | Priority | Reason |
|-------|-------|--------|----------|--------|
| #145 | Make parser resilient to Paylocity format changes | hard | 🔴 HIGH | Wait for more format examples from users - HIGH priority but needs data |
| #146 | Remove mobile restriction or build responsive view | hard | 🔴 HIGH | Need usage data to justify effort - HIGH priority but needs analysis |
| #148 | Refactor to testable architecture with dependency injection | hard | 🟡 MED | Do after feature set stabilizes |
| #143 | Evaluate competitive moat and long-term strategy | hard | 🟡 MED | Strategic thinking after product-market fit |
| #116 | Update landing page screenshots to use Tactical theme | hard | 🟢 LOW | Wait until all visual work complete |
| #117 | Home tab cards: animate tooltip content into card on hover | hard | 🟢 LOW | Nice-to-have enhancement |

**Note**: #145 and #146 are now HIGH priority but deferred until you have user feedback/data to inform approach. Tackle #144 and #147 first (also HIGH, but easier).

---

## Priority Summary

| Priority | Count | Phases |
|----------|-------|--------|
| 🔴 HIGH | 2 | Deferred (2 hard tasks needing user data) |
| 🟡 MED | 7 | Phases 3-5 (product improvements) |
| 🟢 LOW | 10 | Phases 6-9 (polish) |
| Deferred | 6 | Hard tasks (2 HIGH, 2 MED, 2 LOW) |

---

## Quick Reference

**Phase 3 (User Experience Quick Wins) - START HERE:**
- #157 (Import Modal, med)

**Easy wins (< 1 hour each):**
- Polish: #77, #78, #80, #81, #139, #75, #76

**Medium effort (1-4 hours):**
- Product: #149, #151, #152, #153, #157
- Polish: #122

**Hard tasks (> 4 hours, deferred):**
- High (needs data): #145, #146
- Medium: #143, #148
- Low: #116, #117

---

## Recommended Path

1. **Now**: Phase 3 (1 remaining issue, ~1-2hrs)
2. **This week**: Phase 4 (demo/onboarding, ~4-6hrs) → Phase 5 (performance, ~2-4hrs)
3. **Next week**: Phases 6-9 (polish, ~3-5hrs total) as time allows
4. **After user feedback**: Tackle deferred HIGH issues (#145, #146)

**Next step**: "Let's tackle #157" or "Let's start Phase 4"

---

*Plan updated 2026-02-03 after Phase 2 completion. Re-run `/tg-issues` to refresh.*
