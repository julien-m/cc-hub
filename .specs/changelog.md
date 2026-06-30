# Changelog

> Global changelog for cc-hub. One entry per spec command that creates or modifies an artifact.
> Read-only commands (`/spec.explain`, `/spec.status`) are exempt.

---

## 2026-06-30 — Feature 006 implemented: Agent sync hooks

- **Type:** Feature implementation
- **Author:** Codex
- **Artifacts:** `src/services/agent-sync-hooks.ts`, `src/commands/hook.ts`, `src/commands/sync.ts`, `src/cli.ts`, `tests/services/agent-sync-hooks.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.specs/features/006-agent-sync-hooks/{spec,plan,progress,implementation,changelog}.md`
- **Notes:** Added first-class `.agent-sync/hooks` / `~/.agent-sync/hooks` SessionStart hook sync for Claude Code and Codex, idempotent JSON config merge, status/repair/unlink lifecycle, aggregate sync inclusion, and isolated tests for config preservation and non-overwrite behavior.

---

## 2026-05-18 — Bugfix: Codex agent generation ignores Claude-only models

- **Type:** Bugfix
- **Author:** Codex
- **Artifacts:** `src/services/agent-sync.ts`, `tests/services/agent-sync.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/{spec,implementation,changelog}.md`
- **Notes:** Generated `codex.toml` files now omit Claude-only agent models (`haiku`, `sonnet`, `opus`, Claude IDs) while preserving Codex-native models and translating supported OpenAI canonical IDs.

---

## 2026-05-18 — Feature 005 implemented: Migration output root override

- **Type:** Feature implementation
- **Author:** Codex
- **Artifacts:** `src/commands/migrate.ts`, `src/services/agent-sync-migrate.ts`, `src/services/agent-sync.ts`, `src/services/agent-sync-rules.ts`, `tests/services/agent-sync-migrate.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.specs/features/005-migration-output-root-override/{spec,plan,progress,implementation,changelog}.md`
- **Notes:** Added `--output <dir>` for folder and targeted migrations so canonical migrated skills, agents, and rules can be written to a custom agent-sync root while `--scope` continues to control provider output publication.

---

## 2026-05-18 — Feature 004 implemented: Portable agent-sync rules

- **Type:** Feature implementation
- **Author:** Codex
- **Artifacts:** `src/services/agent-sync-rules.ts`, `src/services/agent-sync-migrate.ts`, `src/commands/rule.ts`, `src/commands/migrate.ts`, `src/commands/sync.ts`, `tests/services/agent-sync-rules.test.ts`, `tests/services/agent-sync-migrate.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.specs/features/004-portable-agent-sync-rules/{spec,plan,progress,implementation,changelog}.md`
- **Notes:** Added canonical project/global `.agent-sync/rules` registries, generated Claude `.claude/rules` outputs, managed Codex `AGENTS.md` blocks, individual rule links, namespaced global links, Claude rule migration, and aggregate sync/status/repair coverage for rules.

---

## 2026-05-18 — Check: Feature 002 + 003 spec-code alignment verified

- **Type:** Check
- **Author:** /spec.check
- **Summary:** [Feature 002] 100% verified (12/12 FR, 12/12 AC); [Feature 003] 100% verified (12/12 FR, 11/11 AC). Reports saved under each feature's `checks/2026-05-18.md`. Verification: `bun tsc --noEmit` ✅, targeted tests 20/20 pass.

---

## 2026-05-18 — Feature 003 implemented: Migrate provider folders to agent-sync

- **Type:** Feature implementation
- **Author:** Codex
- **Artifacts:** `src/services/agent-sync-migrate.ts`, `src/commands/migrate.ts`, `src/cli.ts`, `tests/services/agent-sync-migrate.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.specs/features/003-migrate-provider-folders-to-agent-sync/{spec,plan,progress,implementation,changelog}.md`
- **Notes:** Added `cc-hub migrate` folder imports for `.claude` and `.codex`, targeted skill/agent/command migrations, Claude command to skill conversion, dry-run reporting, and conflict protection.

---

## 2026-05-17 — Feature 002 implemented: Multi-provider agent sync for Claude and Codex

- **Type:** Feature implementation
- **Author:** Codex
- **Artifacts:** `src/services/agent-sync.ts`, `src/commands/{skill,agent,sync}.ts`, `tests/services/agent-sync.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agents/skills/cc-hub/SKILL.md`, `.specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/{spec,plan,progress,implementation,changelog}.md`
- **Notes:** Added `.agent-sync` canonical skill/agent sources, Claude/Codex symlinks, provider-native agent rendering, status/repair/sync commands, isolated tests, and real smoke verification.

---

## 2026-05-04 — Feature 001 implemented: Multi-reference files for imagine/video/motion

- **Type:** Feature implementation
- **Author:** spec.implement (livespec-implementer agent)
- **Artifacts:** `src/infra/option-collectors.ts`, `src/commands/{imagine,video,motion}.ts`, `tests/infra/option-collectors.test.ts`, `tests/commands/{imagine,video,motion,help-text}.test.ts`, `tests/commands/__fixtures__/*-single-i.json`, `README.md`, `.claude/skills/cc-hub/SKILL.md`, `.specs/features/001-multi-reference-files/{progress,implementation,changelog}.md`
- **Notes:** `imagine`, `video`, `motion` now accept repeated `-i, --image`. Single-`-i` payload remains byte-identical to the pre-feature shape (FR-006), enforced by snapshot fixtures.

---

## 2026-04-14 — Setup: LiveSpec initialized via `spec.init --from-code`

- **Type:** Setup
- **Author:** spec.init
- **Artifacts created:** `spec-system.md`, `constitution.md`, `project.md`, `stacks/_default.md`, 4 ADRs, `testing/strategy.md`, `design/`, `features/`, `roadmap.md`, `README.md`, `preflight.md`
- **Notes:** Reverse-engineered from existing codebase. All 19 features detected as implemented. bootstrap-recap.md validated and moved to `.specs/bootstrap-recap.md`.

---

*Maintained automatically by LiveSpec commands. Do not remove this file.*
