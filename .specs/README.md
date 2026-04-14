# .specs — cc-hub

> Specification registry for cc-hub. All artifacts produced by LiveSpec are indexed here.
>
> Last updated: 2026-04-14

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
<!-- readme:features:end -->

> No features yet. Create your first with `/spec.specify "feature description"`.

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
| 2026-04-14 | Setup | LiveSpec initialized via `spec.init --from-code` |
<!-- readme:activity:end -->

---

*Maintained automatically by LiveSpec commands. Do not remove section markers.*
