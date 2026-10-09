# .specs — cc-hub

> Specification registry for cc-hub. All artifacts produced by LiveSpec are indexed here.
>
> Last updated: 2026-10-09

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
| 010 | Text Model Catalog Update | Implemented | 2026-10-08 | 2026-10-09 | Read [spec](features/010-model-catalog-update/spec.md) |
| 009 | Generic Decision Models | Implemented | 2026-10-07 | 2026-10-09 | Read [spec](features/009-decision-models/spec.md) |
| 008 | Jev OpenRouter Decisions | Implemented | 2026-10-01 | 2026-10-01 | [spec.md](features/008-jev-openrouter/spec.md) |
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
| 2026-10-09 | Feature | [Feature 010] Feature: Register four source-backed OpenRouter text models |
| 2026-10-09 | Feature | [Feature 009] Registry finalized after filtered FR-004 audit48 correction; AC-005 native PASS, broader parent certification pending |
| 2026-10-09 | Bugfix | [Feature 009] Fix: Four audit48 quality gaps closed; filtered FR-004 / AC-005 native PASS |
| 2026-10-09 | Check | [Feature 009] Check: After correction,5/6FR and7/8AC verified |
| 2026-10-09 | Check | [Feature 009] Check: Current alignment5/6FR,7/8AC; convention corrections pending |
| 2026-10-09 | Feature | [Feature 010] Test: 100% AC covered(8/8), 0 tests generated |
| 2026-10-09 | Feature | [Feature 010] Feature: Register four source-backed OpenRouter text models |
| 2026-10-08 | Feature | [Feature 010] Plan review after acceptance format repair |
| 2026-10-08 | Feature | [Feature 010] Plan revalidated after AC heading normalization — 4 implementation steps, 1 sequence; existing plan content preserved, runtime evidence pending |
| 2026-10-08 | Feature | [Feature 010] Spec AC format normalized: eight native-supported headings; unchanged semantics, current independent review and plan readiness |
<!-- readme:activity:end -->

---

*Maintained automatically by LiveSpec commands. Do not remove section markers.*

<!-- finalize:spec-implement:2026-10-08:7b95579a -->

<!-- finalize:spec-implement:2026-10-08:93bb16e4 -->

<!-- finalize:spec-implement:2026-10-08:01c83b0f -->

<!-- finalize:spec-feature:2026-10-08:a972c7a8 -->

<!-- finalize:spec-specify:2026-10-08:b6264089 -->

<!-- finalize:spec-plan:2026-10-08:74cb4620 -->

<!-- finalize:spec-feature:2026-10-08:7793aa77 -->

<!-- finalize:spec-specify:2026-10-08:87d5b083 -->

<!-- finalize:spec-plan:2026-10-08:aeebb87f -->

<!-- finalize:spec-feature:2026-10-08:a0cacc53 -->

<!-- finalize:spec-implement:2026-10-09:9604b97a -->

<!-- finalize:spec-fix:2026-10-09:d3c8441c -->

<!-- finalize:spec-feature:2026-10-09:ee1c68ea -->
