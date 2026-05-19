# Changelog — Portable Agent Sync Rules

## 2026-05-18 — [Feature]: Initial spec and implementation plan

- **Type:** Feature
- **Spec modified:** Yes (initial feature spec, plan, pipeline, progress)
- **Code modified:** None
- **AC impacted:** AC-001 through AC-012
- **Author:** codex

## 2026-05-18 — [Feature]: Portable rule sync implemented

- **Type:** Feature
- **Spec modified:** No
- **Code modified:** `src/services/agent-sync-rules.ts`, `src/services/agent-sync-migrate.ts`, `src/commands/rule.ts`, `src/commands/migrate.ts`, `src/commands/sync.ts`, `tests/services/agent-sync-rules.test.ts`, `tests/services/agent-sync-migrate.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`
- **AC impacted:** AC-001 through AC-012
- **Author:** codex

## 2026-05-19 — [Bugfix]: Claude rule outputs are symlinks

- **Type:** Bugfix
- **Spec modified:** Yes (Claude rule output semantics, AC-013, FR-013)
- **Code modified:** `src/services/agent-sync-rules.ts`, `tests/services/agent-sync-rules.test.ts`, `tests/services/agent-sync-migrate.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`
- **AC impacted:** AC-001, AC-003, AC-009, AC-011, AC-013
- **Author:** codex
