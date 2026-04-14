# ADR-001: Bun over Node.js

- **Date:** 2026-04-14
- **Status:** Observed (from existing codebase)
- **Context:** The project initially defined Node.js as the runtime in `prd.md`. The actual implementation uses Bun, with `bun.lock`, `@types/bun`, and `bun:test` throughout. This ADR documents the observed choice and its rationale.
- **Decision:** Use Bun as the runtime instead of Node.js.
- **Evidence:** `bun.lock` binary lockfile, `@types/bun` devDependency, `import { describe, it } from 'bun:test'` in all test files, `"start": "bun bin/cc-hub.ts"` script, README prerequisites.
- **Alternatives considered:**
  - **Node.js** — Original PRD target. Larger ecosystem, but requires ts-node or build step for TypeScript. Slower cold start.
  - **Deno** — Also TypeScript-native, but smaller ecosystem and different module system.
- **Consequences:**
  - Native TypeScript execution without transpilation
  - Built-in test runner (`bun:test`) — no Jest/Vitest needed
  - Built-in SQLite support (available but using libSQL for Turso compatibility)
  - macOS `bun link` for global CLI installation
  - Constraint: Contributors must have Bun >= 1.0 installed

---

*Note: This ADR documents an observed choice, not a deliberate decision made during planning. The rationale was reconstructed from the codebase.*
