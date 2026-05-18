# Changelog — Multi-provider Agent Sync for Claude and Codex Skills and Agents

## 2026-05-17 — [Feature]: Multi-provider agent sync implemented

- **Type:** Feature
- **Spec modified:** Yes (created `spec.md`, `plan.md`, `progress.md`, `implementation.md`)
- **Code modified:** `src/services/agent-sync.ts`, `src/commands/skill.ts`, `src/commands/agent.ts`, `src/commands/sync.ts`, `src/infra/prompt.test.ts`, `tests/services/agent-sync.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agents/skills/cc-hub/SKILL.md`
- **AC impacted:** AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012
- **Author:** Codex
- **Notes:** Added `.agent-sync` canonical skill/agent sources, Claude/Codex provider symlinks, provider-native agent rendering, status/repair/sync commands, isolated filesystem tests, and real smoke verification.

## 2026-05-18 — Check: Spec-code alignment verified

- **Type:** Spec Update
- **Spec modified:** No
- **Code modified:** None
- **Coverage:** 12/12 FR verified (100%), 12/12 AC verified (100%), 0 partial, 0 missing
- **Report:** `checks/2026-05-18.md`
- **Author:** /spec.check

## 2026-05-18 — [Spec Update]: AC table reformatted to Given/When/Then

- **Type:** Spec Update
- **Spec modified:** Yes (`spec.md` — Acceptance Criteria table)
- **Code modified:** No
- **AC impacted:** AC-001 through AC-012 (format only, semantics unchanged)
- **Author:** /spec.check (follow-up)

## 2026-05-18 — [Bugfix]: Project Codex agents publish during create

- **Type:** Bugfix
- **Spec modified:** Yes (`spec.md` — Story 2, AC-003, FR-003)
- **Code modified:** `src/commands/agent.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`
- **AC impacted:** AC-003, AC-011, AC-012
- **Author:** Codex
