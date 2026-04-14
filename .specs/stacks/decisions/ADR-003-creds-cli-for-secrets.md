# ADR-003: creds CLI (macOS Keychain) for Secret Management

- **Date:** 2026-04-14
- **Status:** Observed (from existing codebase)
- **Context:** cc-hub integrates with multiple external APIs (OpenRouter, Telegram, Poyo, Soniox, Turso). These credentials must be stored securely without ever appearing in plaintext in config files, `.env` files, or git history.
- **Decision:** All API keys and secrets are stored in the macOS Keychain and read exclusively via the `creds` CLI (`creds get KEY` / `creds set KEY`).
- **Evidence:** `src/services/creds.ts` (`getCred()`, `tryGetCred()`), README credentials setup section, all services calling `tryGetCred()` before API calls.
- **Alternatives considered:**
  - **`.env` file** — Simple but secrets on disk in plaintext. Risk of accidental git commit.
  - **`process.env` directly** — Requires secrets in shell environment, leaks in process listings.
  - **OS keyring (libsecret/gnome-keyring)** — Cross-platform, but cc-hub targets macOS only.
  - **Encrypted vault (1Password CLI, etc.)** — More complex setup, not available without additional install.
- **Consequences:**
  - Zero plaintext secrets anywhere in the project
  - First-time setup requires `creds set KEY` for each credential (documented in README)
  - macOS-only constraint — `creds` uses the macOS Security framework
  - `tryGetCred()` returns `undefined` for missing optional credentials (e.g., Turso); `getCred()` throws for required credentials

---

*Note: This ADR documents an observed choice, not a deliberate decision made during planning.*
