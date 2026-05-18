# Changelog — Multi-provider Agent Sync for Claude and Codex Skills and Agents

## 2026-05-17 — [Feature]: Multi-provider agent sync implemented

- **Type:** Feature
- **Spec modified:** Yes (created `spec.md`, `plan.md`, `progress.md`, `implementation.md`)
- **Code modified:** `src/services/agent-sync.ts`, `src/commands/skill.ts`, `src/commands/agent.ts`, `src/commands/sync.ts`, `src/infra/prompt.test.ts`, `tests/services/agent-sync.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agents/skills/cc-hub/SKILL.md`
- **AC impacted:** AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012
- **Author:** Codex
- **Notes:** Added `.agent-sync` canonical skill/agent sources, Claude/Codex provider symlinks, provider-native agent rendering, status/repair/sync commands, isolated filesystem tests, and real smoke verification.
