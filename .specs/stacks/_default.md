---
updated: 2026-04-14
---

# Stack — cc-hub

> Detected from codebase by `/spec.init --from-code` on 2026-04-14.
> Status: Observed (from existing codebase). ADRs document each choice.

---

## Runtime & Language

| Layer | Choice | Version | Evidence | Rationale |
|---|---|---|---|---|
| Language | TypeScript | ESNext (strict) | `tsconfig.json`, `.ts` sources throughout | Type safety, IDE support, native Bun support |
| Runtime | Bun | >= 1.0 | `bun.lock`, `@types/bun`, `bun:test`, README | Fastest TS runtime, native SQLite, built-in test runner |

## CLI

| Layer | Choice | Version | Evidence | Rationale |
|---|---|---|---|---|
| CLI Framework | Commander.js | ^13.0.0 | `package.json`, `src/cli.ts` | Mature, composable, minimal overhead |
| Spinner/UX | ora | ^9.3.0 | `package.json`, `src/infra/spinner.ts` | Clean async progress feedback in terminal |

## Data

| Layer | Choice | Version | Evidence | Rationale |
|---|---|---|---|---|
| Database | libSQL (SQLite local) | ^0.14.0 (`@libsql/client`) | `src/db/index.ts` | Local SQLite with optional Turso Cloud sync |
| DB Sync (optional) | Turso Cloud | — | `src/db/index.ts` syncUrl/authToken | Multi-machine sync without changing DB code |

## Integrations

| Layer | Choice | Version | Evidence | Rationale |
|---|---|---|---|---|
| LLM | OpenRouter | — | `src/services/openrouter.ts` | Single API for all LLM providers |
| Image / Video / Music | Poyo | — | `src/services/poyo.ts`, `src/services/poyo-media.ts` | Unified media generation API |
| Audio Transcription | Soniox | — | `src/services/soniox.ts` | High-quality transcription |
| Notifications | Telegram Bot API | — | `src/services/telegram.ts` | Reliable push + file attachments |
| AI CLI (Codex) | OpenAI Codex CLI | — | `src/services/codex.ts`, `src/services/codex-session.ts` | JSON-lines machine protocol for scripts |
| AI CLI (Copilot) | GitHub Copilot CLI | — | `src/services/copilot.ts` | GitHub Copilot integration |

## Security

| Layer | Choice | Version | Evidence | Rationale |
|---|---|---|---|---|
| Credentials | macOS Keychain via `creds` CLI | — | `src/services/creds.ts` | Zero plaintext tokens. Keychain-native. |

## Testing

| Layer | Choice | Version | Evidence | Rationale |
|---|---|---|---|---|
| Test Framework | bun:test | built-in | `tests/*.test.ts`, `import from 'bun:test'` | Built into Bun, no extra dependency |

## Deployment

| Layer | Choice | Version | Evidence | Rationale |
|---|---|---|---|---|
| Deploy | Local binary via `bun link` | — | `package.json` bin, README | macOS global CLI, zero server |
| Platform | macOS only | — | `creds` Keychain dependency | Keychain is macOS-specific |

## Dev Tooling

| Layer | Choice | Version | Evidence | Rationale |
|---|---|---|---|---|
| Package Manager | Bun | — | `bun.lock` binary lockfile | Consistent with runtime |
| Type Checker | TypeScript strict | — | `tsconfig.json` `"strict": true` | No ESLint/Biome detected |

## Design

| Layer | Choice | Notes |
|---|---|---|
| Design Tool | Pencil (MCP enabled) | N/A — cc-hub is a pure CLI with no UI screens |

---

*This file is updated by `/spec.stack` on every stack change.*
