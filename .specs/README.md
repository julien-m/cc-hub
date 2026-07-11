# .specs — cc-hub

> Specification registry for cc-hub. All artifacts produced by LiveSpec are indexed here.
>
> Last updated: 2026-07-11

---

## System Files

| Document | Description |
|---|---|
| [spec-system.md](spec-system.md) | Universal spec rules (read first) |
| [constitution.md](constitution.md) | Architecture principles |
| [project.md](project.md) | Project profile (vision, users, constraints) |
| [stacks/_default.md](stacks/_default.md) | Current tech stack |
| [testing/strategy.md](testing/strategy.md) | Testing strategy |
| [changelog.md](changelog.md) | Global changelog |
| [roadmap.md](roadmap.md) | Feature backlog (Implemented / Post-MVP / Future) |

---

## Design

| Document | Description |
|---|---|
| [design/](design/) | UI mockups and screen references (N/A — pure CLI) |
| [design/changelog.md](design/changelog.md) | Design change history |

---

## Features

<!-- readme:features:start -->
| # | Feature | Status | Created | Updated | Spec |
|---|---|---|---|---|---|
| 007 | Add GPT-5.6 Sol/Terra/Luna to Codex Provider | Implemented | 2026-07-11 | 2026-07-11 | [spec.md](features/007-add-gpt-56-sol-terra-luna-to-codex-provider/spec.md) |
| 006 | Agent Sync Hooks | Implemented | 2026-06-30 | 2026-06-30 | [spec.md](features/006-agent-sync-hooks/spec.md) |
| 005 | Migration Output Root Override | Implemented | 2026-05-18 | 2026-05-18 | [spec.md](features/005-migration-output-root-override/spec.md) |
| 004 | Portable Agent Sync Rules | Implemented | 2026-05-18 | 2026-05-18 | [spec.md](features/004-portable-agent-sync-rules/spec.md) |
| 003 | Migrate Provider Folders to Agent Sync | Implemented | 2026-05-18 | 2026-05-18 | [spec.md](features/003-migrate-provider-folders-to-agent-sync/spec.md) |
| 002 | Multi-provider Agent Sync for Claude and Codex Skills and Agents | Implemented | 2026-05-17 | 2026-05-18 | [spec.md](features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/spec.md) |
<!-- readme:features:end -->

---

## Architecture Decisions

<!-- readme:decisions:start -->
| ADR | Decision | Date | Status |
|---|---|---|---|
| [ADR-001](stacks/decisions/ADR-001-bun-over-node.md) | Bun over Node.js | 2026-04-14 | Active |
| [ADR-002](stacks/decisions/ADR-002-libsql-over-better-sqlite3.md) | @libsql/client over better-sqlite3 | 2026-04-14 | Active |
| [ADR-003](stacks/decisions/ADR-003-creds-cli-for-secrets.md) | creds CLI (macOS Keychain) for secrets | 2026-04-14 | Active |
| [ADR-004](stacks/decisions/ADR-004-openrouter-for-llm.md) | OpenRouter as unified LLM gateway | 2026-04-14 | Active |
<!-- readme:decisions:end -->

---

## Recent Activity

> Latest entries from [changelog.md](changelog.md).

<!-- readme:activity:start -->
| Date | Type | Description |
|---|---|---|
<!-- readme:activity:end -->

---

*Maintained automatically by LiveSpec commands. Do not remove section markers.*
