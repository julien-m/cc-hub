# Constitution — cc-hub

> This constitution defines the architectural principles and conventions for this project.
> All implementation decisions are validated against these principles.
> AI tools must check this file before making architectural choices.

---

## Project Identity

- **Name:** cc-hub
- **Description:** All-in-one AI Swiss-army knife CLI. Centralizes AI agent execution logs, sends daily digest to Telegram, exposes multi-model AI capabilities (LLM, image, video, audio, music), and provides Claude Code integration utilities. Zero server, fully local.
- **Vision:** A personal developer tool that makes the AI agent ecosystem manageable — one morning digest, one CLI entrypoint for all AI capabilities.
- **Repository:** `https://github.com/julien-m/cc-hub`
- **Stack Reference:** See `.specs/stacks/_default.md`

---

## Architecture Principles

### 1. Zero Server — Local First

cc-hub runs entirely on the local machine. No cloud backend, no server process. Every command is a synchronous CLI invocation that reads/writes to `~/.claude-hub/`. Multi-machine sync is opt-in (Turso Cloud) and never required.

**Rule:** Do not introduce server dependencies, background daemons, or mandatory cloud services.

### 2. Credentials via macOS Keychain Only

API keys are stored and read exclusively via the `creds` CLI (macOS Keychain). No token is ever written to disk in plaintext, not in `.env`, not in config files.

**Rule:** All sensitive values go through `creds get <KEY>` at runtime. Use `tryGetCred()` from `src/services/creds.ts` — never `process.env` for secrets.

### 3. Single Entrypoint — Commander.js Module Pattern

Each command is a `create*Command()` function in `src/commands/`, registered in `src/cli.ts`. Commands are composable, independently testable.

**Rule:** New commands follow the `create*Command(): Command` pattern. Never add top-level logic outside a command factory.

### 4. Fail Fast with Clear Messages

When a required credential is missing, a service is unavailable, or a file doesn't exist — fail immediately with an actionable error message pointing to the fix (e.g., `creds set KEY`).

**Rule:** No silent failures. No fallback to degraded modes unless explicitly designed. User sees what went wrong and how to fix it.

### 5. Simplicity First

cc-hub is a personal tool for one developer. No over-engineering for imagined scale. No dependency injection frameworks. No abstractions until a third use case demands them.

**Rule:** If it works for one user on one machine, it's good enough. Optimize when the pain is real.

### 6. Explicit Over Implicit

No magic. Configuration lives in `~/.claude-hub/.env` (non-secret defaults) and `~/.claude-hub/config.json` (preferences). Dependencies are explicit in function signatures. Side effects (DB writes, Telegram sends, file creation) are isolated in services.

**Rule:** Business logic in `src/commands/`. Infrastructure in `src/services/` and `src/db/`. Pure utilities in `src/infra/`.

---

## Module Structure

```
src/
├── cli.ts              — Commander.js root: registers all commands
├── commands/           — Command factories (create*Command())
├── services/           — External integrations (OpenRouter, Telegram, creds, Poyo, Soniox...)
├── db/                 — libSQL singleton + schema init
├── infra/              — Pure utilities (paths, spinner, stdin, prompt)
├── data/               — Static data (model catalog)
├── types/              — TypeScript type definitions
└── errors.ts           — Typed error classes
```

**Naming:**
- Files: kebab-case (`digest-generator.ts`)
- Functions: camelCase (`createDigestCommand`, `generateDigest`)
- Constants: SCREAMING_SNAKE_CASE (`DB_PATH`)
- Types/Interfaces: PascalCase (`EventRow`, `AskOptions`)

---

## Testing Standards

### What to Test

- **Unit tests:** Pure functions in `src/infra/`, `src/services/`, `src/data/` — no I/O, no Bun runtime
- **Integration tests:** Services that call external APIs (mocked) or SQLite (test DB)
- **No E2E tests:** CLI command E2E via subprocess is optional — use unit + integration coverage

### How to Test

- Framework: `bun:test` (built-in)
- Test file convention: `*.test.ts` next to source OR in `tests/` mirroring `src/` structure
- Test names reference the behavior: `"findModel: returns model by canonical ID"`
- No mock libraries needed — `bun:test` has built-in `mock()`/`spyOn()`

### What NOT to Test

- Telegram message formatting end-to-end (mock the API)
- Real Keychain access (use `tryGetCred` with mocked creds)
- Real OpenRouter/Poyo/Soniox calls (mock HTTP responses)

---

## Spec Conventions

### Gherkin + Mermaid Required

Every user story in a spec.md MUST have Gherkin scenarios (source of truth for test derivation) and a matching Mermaid flowchart (visual aid). See `spec-system.md` for full rules.

### Design Mockups

cc-hub is a pure CLI — there are no UI screens. Design artifacts are N/A for this project. The `.specs/design/` directory exists for tooling compatibility but no screens will be created.

### Living Documentation

- Specs updated when behavior changes
- `implementation.md` updated after every code change with `@spec` anchor comments
- `changelog.md` entry for every feature/bugfix/refactor

---

## Decision Rules

When uncertain about an architectural choice, apply in order:

1. **Does the constitution say anything about it?** → Follow it
2. **Does an existing pattern in `src/` solve it?** → Follow the pattern
3. **Is there a relevant ADR in `.specs/stacks/decisions/`?** → Follow the decision
4. **Still unclear?** → Add a `[DECISION NEEDED]` marker and ask the human

Do NOT make silent architectural decisions. Document them.

---

*Generated by `/spec.init --from-code` — LiveSpec v1.1*
*Update this constitution as the project evolves.*
