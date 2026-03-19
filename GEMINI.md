<!-- reviewed: 2026-03-19 | next-review: 2026-Q3 -->
> Read AGENTS.md for all project context, architecture, and conventions.
> Use `@./AGENTS.md` if context isn't loading automatically.

## Gemini-Specific
- Session start: read `.context/handoff.md`; if missing, read `_planning/decisions.md` +
  `_planning/learnings.md`, then ask user for current state
- Session end: reset `.context/handoff.md`, append to `.context/sessions.md`, commit `_planning/`
- MCP tools: check ~/.gemini/settings.json for available servers
