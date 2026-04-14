# ADR-002: @libsql/client over better-sqlite3

- **Date:** 2026-04-14
- **Status:** Observed (from existing codebase)
- **Context:** The PRD specified `better-sqlite3` for local SQLite access. The actual implementation uses `@libsql/client` (Turso's libSQL client). This ADR documents the observed choice and its rationale.
- **Decision:** Use `@libsql/client` instead of `better-sqlite3`.
- **Evidence:** `"@libsql/client": "^0.14.0"` in `package.json`, `createClient()` usage in `src/db/index.ts`, Turso sync via `syncUrl`/`authToken`.
- **Alternatives considered:**
  - **better-sqlite3** — Synchronous SQLite, very fast for local-only use. No Turso sync without a rewrite.
  - **Bun built-in SQLite** (`bun:sqlite`) — Zero dependencies, but no Turso Cloud sync.
  - **Prisma** — ORM with migrations, but overkill for a 2-table schema.
- **Consequences:**
  - Local SQLite works identically to better-sqlite3 for local-only use
  - Opt-in Turso Cloud sync: set `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` via `creds` to enable multi-machine sync
  - `@libsql/client` is async (`await client.execute()`), unlike better-sqlite3's sync API
  - Slightly heavier dependency for the sync capability

---

*Note: This ADR documents an observed choice, not a deliberate decision made during planning.*
