# Issue Closure Template

When closing an issue, **always add a comment** with the following schema before closing:

```markdown
**Resolution Type:** [Fixed / Invalid / Duplicate / Wontfix]

**Root Cause:** [1 sentence explaining why the issue existed]

**Fix Description:** [1-2 sentences explaining what changed]

**Verification:** [How to verify the fix works]

**Related Artifacts:** [Link to PR #XXX or commit SHA]
```

---

## Resolution Types

### Fixed
Issue was resolved with a code/documentation change.

**Example:**
```markdown
**Resolution Type:** Fixed

**Root Cause:** Landing page CTA didn't align with new user journey (demo first)

**Fix Description:** Swapped hierarchy: 'View Demo' now primary (filled orange), 'Import Your Data' secondary (outline)

**Verification:** Check landing page button hierarchy

**Related Artifacts:** PR #110, commit 2a554b1
```

### Invalid
Issue was based on incorrect assumptions or misunderstanding.

**Example:**
```markdown
**Resolution Type:** Invalid

**Root Cause:** Reporter expected feature X, but app was designed for use case Y

**Fix Description:** No changes needed. Clarified intended behavior in documentation.

**Verification:** See updated README section on [topic]

**Related Artifacts:** N/A
```

### Duplicate
Issue already reported elsewhere.

**Example:**
```markdown
**Resolution Type:** Duplicate

**Root Cause:** Same issue as #123

**Fix Description:** See resolution in #123

**Verification:** N/A (see #123)

**Related Artifacts:** Duplicate of #123
```

### Wontfix
Issue acknowledged but not addressing due to product/design decisions.

**Example:**
```markdown
**Resolution Type:** Wontfix

**Root Cause:** Requested feature conflicts with privacy-first architecture

**Fix Description:** Not implementing. App is designed to be 100% client-side with no server communication.

**Verification:** N/A

**Related Artifacts:** See CLAUDE.md architecture principles
```

---

## Why This Matters

### For Future Reference
- Understand **why** issues existed (prevents recurrence)
- Know **what** changed (audit trail)
- Learn **how** to verify (testing guidance)

### For Team Collaboration
- Onboard new contributors faster
- Avoid duplicate work
- Build institutional knowledge

### For Project Health
- Track technical debt resolution
- Identify patterns in bugs
- Measure quality over time

---

## Quick Checklist

Before closing an issue:

- [ ] Issue work is complete and verified
- [ ] Closing comment added with schema
- [ ] All 5 fields filled out (Resolution Type, Root Cause, Fix Description, Verification, Related Artifacts)
- [ ] PR/commit links are valid and clickable
- [ ] Verification steps are clear and actionable

---

## Automation

### Using GitHub CLI
```bash
# Close issue with comment
gh issue close 123 --comment "**Resolution Type:** Fixed

**Root Cause:** [reason]

**Fix Description:** [changes]

**Verification:** [steps]

**Related Artifacts:** [PR/commit]"
```

### Using /tg-close-issue Skill
```bash
# Claude Code skill for standardized closures
/tg-close-issue 123
```

---

## Related Documents

- `.github/ISSUE_TEMPLATE/` - Issue creation templates
- `CONTRIBUTING.md` - Contribution guidelines
- `CLAUDE.md` - Development guidelines
