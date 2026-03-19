<!-- reviewed: 2026-03-19 | next-review: 2026-Q3 -->
> Read AGENTS.md first — project context, architecture, and conventions live there.

## Claude-Specific

### MCP Tools Available
- chrome-devtools / playwright — browser testing and screenshots
- shadcn — not applicable (vanilla JS project)

### Skills
- `/tg-recap` — run at every session end
- `/tg-review` — quality gate before releases
- `/tg-close-issue` — standardized issue closing
- `/init-agents` — re-run to update project context
- `design-preferences.md` at `~/.claude/design-preferences.md` — Four Pillars, WCAG, visual references

### Session Workflow

**Start**: Read `.context/handoff.md`. If missing, it's a fresh environment — read
`_planning/decisions.md` + `_planning/learnings.md`, then ask what to work on.
Check `<!-- next-review -->` header in AGENTS.md — flag if overdue.

**End**:
1. Reset `.context/handoff.md` (5-layer format — see below)
2. Append to `.context/sessions.md`
3. If arch decisions made → append to `_planning/decisions.md`
4. Review new learnings → append to `_planning/learnings.md`; ask if any are [GLOBAL]
5. `git add _planning/ && git commit -m "chore: session handoff [claude]"`
6. Run `/tg-recap`

### Handoff Format (5-layer, 40 lines max)

Required fields (*):
- `*Current State:` one sentence — what's true right now
- `*The One Next Thing:` single action — what the next agent should do first
- `*Starter Prompt:` paste-ready for next agent (note: no MCP tools if handing off to Gemini/Codex)

Optional:
- `Active Threads:` bulleted list with file pointers
- `Warnings:` gotchas, broken things, rate limits

### Global Learnings Convention

When `[GLOBAL]` appears in a `_planning/learnings.md` entry, at session end (prompted):
add the entry to `memory/project-learnings.md` in the vault memory folder.
**Create the file if it doesn't exist** — it's a topic file loaded on-demand, not every session.
