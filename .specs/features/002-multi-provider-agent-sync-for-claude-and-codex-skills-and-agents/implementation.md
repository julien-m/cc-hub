---
title: "Implementation: Multi-provider Agent Sync for Claude and Codex Skills and Agents"
status: Implemented
feature_number: "002"
feature: 002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents
spec_ref: .specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/spec.md
created: 2026-05-17
updated: 2026-05-18
---

# Implementation — Multi-provider Agent Sync for Claude and Codex Skills and Agents

## Requirement Mapping

| Requirement | File(s) | @spec Anchor | Status | Last Verified |
|---|---|---|---|---|
| [FR-001: Canonical `.agent-sync` roots](spec.md#fr-001) | `src/services/agent-sync.ts` | `@spec FR-001: Canonical agent-sync roots ...` | ✅ Implemented | 2026-05-17 |
| [FR-002: Skill canonicalization and provider symlinks](spec.md#fr-002) | `src/services/agent-sync.ts`, `src/commands/skill.ts` | `@spec FR-002: Canonical skill source and provider symlink ...` | ✅ Implemented | 2026-05-17 |
| [FR-003: Portable agent source and publish on create](spec.md#fr-003) | `src/services/agent-sync.ts`, `src/commands/agent.ts` | `@spec FR-003: Portable agent source ...` | ✅ Implemented | 2026-05-18 |
| [FR-004: Provider-native agent rendering](spec.md#fr-004) | `src/services/agent-sync.ts` | `@spec FR-004: Render provider-native agents ...` | ✅ Implemented | 2026-05-18 |
| [FR-005: Agent provider file symlinks](spec.md#fr-005) | `src/services/agent-sync.ts`, `src/commands/agent.ts` | `@spec FR-005: Provider links target generated files ...` | ✅ Implemented | 2026-05-17 |
| [FR-006: Status classification](spec.md#fr-006) | `src/services/agent-sync.ts`, `src/commands/{skill,agent,sync}.ts` | `@spec FR-006: Classify provider sync status ...` | ✅ Implemented | 2026-05-17 |
| [FR-007: Repair missing/broken symlinks](spec.md#fr-007) | `src/services/agent-sync.ts`, `src/commands/{skill,agent,sync}.ts` | `@spec FR-007: Repair missing or broken symlinks ...` | ✅ Implemented | 2026-05-17 |
| [FR-008: Aggregate sync commands](spec.md#fr-008) | `src/services/agent-sync.ts`, `src/commands/sync.ts` | `@spec FR-008: Aggregate skill and agent sync ...` | ✅ Implemented | 2026-05-17 |
| [FR-009: Target validation](spec.md#fr-009) | `src/services/agent-sync.ts` | `@spec FR-009: Validate provider targets ...` | ✅ Implemented | 2026-05-17 |
| [FR-010: Extensible provider registry](spec.md#fr-010) | `src/services/agent-sync.ts` | `@spec FR-010: Data-driven provider registry ...` | ✅ Implemented | 2026-05-17 |
| [FR-011: Documentation](spec.md#fr-011) | `README.md`, `.agent-sync/skills/cc-hub/SKILL.md` | N/A documentation files | ✅ Implemented | 2026-05-18 |
| [FR-012: Isolated real symlink tests](spec.md#fr-012) | `tests/services/agent-sync.test.ts`, `tests/commands/agent-sync-cli.test.ts` | Test names map to AC/FR behavior | ✅ Implemented | 2026-05-18 |

## Acceptance Criteria Mapping

| AC | Test File / Evidence | Status |
|---|---|---|
| AC-001 | `tests/services/agent-sync.test.ts` — project skill symlinks to `.claude/skills` and `.agents/skills`; real smoke test confirms. | ✅ |
| AC-002 | `tests/services/agent-sync.test.ts` — global skill link with injected HOME. | ✅ |
| AC-003 | `tests/services/agent-sync.test.ts`, `tests/commands/agent-sync-cli.test.ts` — `agent create --scope project --targets codex` creates source files, `dist/codex.toml`, and `.codex/agents/<name>.toml`. | ✅ |
| AC-004 | `tests/services/agent-sync.test.ts`, `tests/commands/agent-sync-cli.test.ts` — build writes `dist/claude.md` and `dist/codex.toml`; service regression verifies Claude-only model aliases are omitted from Codex TOML. | ✅ |
| AC-005 | `tests/services/agent-sync.test.ts`, `tests/commands/agent-sync-cli.test.ts`, real smoke test — provider agent symlinks point to generated files. | ✅ |
| AC-006 | `tests/services/agent-sync.test.ts` — OK, MISSING, BROKEN, LOCAL status coverage. | ✅ |
| AC-007 | `tests/services/agent-sync.test.ts`, real repair smoke test — repair recreates missing link. | ✅ |
| AC-008 | `tests/services/agent-sync.test.ts`, `tests/commands/agent-sync-cli.test.ts` — `sync run/status/repair/clean` service and CLI coverage. | ✅ |
| AC-009 | `tests/services/agent-sync.test.ts` — unsupported target error lists supported targets. | ✅ |
| AC-010 | `src/services/agent-sync.ts` provider registry + tests resolving providers through shared service. | ✅ |
| AC-011 | `README.md`, `.agents/skills/cc-hub/SKILL.md` updated. `.Codex/skills/cc-hub/SKILL.md` was not present in this repository; the active Codex skill location is `.agents/skills/cc-hub/SKILL.md`. | ✅ |
| AC-012 | `tests/services/agent-sync.test.ts`, `tests/commands/agent-sync-cli.test.ts`, smoke tests with temp HOME/project. | ✅ |

## Files Created/Modified

| Path | Description |
|---|---|
| `src/services/agent-sync.ts` | New provider registry, canonical roots, agent renderers, symlink status/repair/sync logic. |
| `src/commands/skill.ts` | Replaced Claude-only skill wrapper with portable skill commands. |
| `src/commands/agent.ts` | Portable agent create/build/link/status/repair/unlink; `create` now publishes selected provider files immediately. |
| `src/commands/sync.ts` | Added agent-sync run/status/repair/clean and moved Turso sync to `sync db` / `sync db-status`. |
| `tests/services/agent-sync.test.ts` | Filesystem tests for canonical sources, provider symlinks, status, repair, and target validation. |
| `tests/commands/agent-sync-cli.test.ts` | Commander-level tests for skill/agent/sync commands in temp HOME/project. |
| `src/infra/prompt.test.ts` | Test harness fix: keep `process.stdin.isTTY` configurable so the full suite can redefine it safely. |
| `README.md` | Updated sync, skill, agent command docs, and Codex agent model rendering behavior. |
| `.agent-sync/skills/cc-hub/SKILL.md` | Updated cc-hub skill command reference and Codex agent model rendering behavior. |
| `.specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/*` | LiveSpec artifacts for this feature. |

## Verification

| Command | Result |
|---|---|
| `bun test tests/services/agent-sync.test.ts` | Pass — includes Claude-only model alias omission regression |
| `bun test tests/commands/agent-sync-cli.test.ts` | Pass — includes project Codex publish-on-create regression |
| `bun tsc --noEmit` | Pass |
| `bun test` | Pass — 115 tests |
| Real smoke: temp project/HOME skill link + agent create/build/link + status | Pass — Claude/Codex skill and agent symlinks all OK |
| Real smoke: `agent create local-reviewer --scope project --targets codex` | Pass — `.codex/agents/local-reviewer.toml` symlinked to `.agent-sync/agents/local-reviewer/dist/codex.toml` |
| Real smoke: remove Codex skill link then `sync repair` | Pass — status MISSING before repair, OK after repair |
| `livespec validate .specs/features/002... --format full --warn-only` | Pass — 0 errors, 0 warnings |
