# Preflight Manifest — cc-hub

> Auto-generated from stack by `/spec.init --from-code` on 2026-04-14.
> Editable — changes are preserved on regeneration.
> Re-run: `/spec.preflight`

---

## Tooling

### Bun >= 1.0

```yaml
source: stack (_default.md)
check: bun --version
expected: >= 1.0.0
auto-resolve: false
```

### TypeScript (bun tsc)

```yaml
source: stack (_default.md)
check: bun tsc --noEmit
expected: exit 0
auto-resolve: false
```

### creds CLI

```yaml
source: stack (ADR-003)
check: creds --version
expected: exit 0
auto-resolve: false
note: Required for all API key management. Install from https://github.com/anthropics/keychain-creds
```

---

## Tokens

### TELEGRAM_BOT_TOKEN

```yaml
source: README (required)
check: creds get TELEGRAM_BOT_TOKEN
expected: non-empty string
auto-resolve: false
fix: creds set TELEGRAM_BOT_TOKEN
```

### TELEGRAM_CHAT_ID

```yaml
source: README (required)
check: creds get TELEGRAM_CHAT_ID
expected: non-empty string
auto-resolve: false
fix: creds set TELEGRAM_CHAT_ID
```

### ANTHROPIC_API_KEY

```yaml
source: README (required — used for digest generation)
check: creds get ANTHROPIC_API_KEY
expected: non-empty string
auto-resolve: false
fix: creds set ANTHROPIC_API_KEY
```

### OPENROUTER_API_KEY

```yaml
source: README (required — used for cc-hub ask)
check: creds get OPENROUTER_API_KEY
expected: non-empty string
auto-resolve: false
fix: creds set OPENROUTER_API_KEY
```

### REPLICATE_API_KEY

```yaml
source: README (required — used for imagine/video/music via Poyo)
check: creds get REPLICATE_API_KEY
expected: non-empty string
auto-resolve: false
fix: creds set REPLICATE_API_KEY
```

### TURSO_DATABASE_URL (optional)

```yaml
source: README (optional — Turso Cloud sync)
check: creds get TURSO_DATABASE_URL
expected: non-empty string OR absent
optional: true
fix: creds set TURSO_DATABASE_URL
```

### TURSO_AUTH_TOKEN (optional)

```yaml
source: README (optional — Turso Cloud sync)
check: creds get TURSO_AUTH_TOKEN
expected: non-empty string OR absent
optional: true
fix: creds set TURSO_AUTH_TOKEN
```

---

## Custom

<!-- preflight:custom:start -->
<!-- Add manual checks here. Use the same ### format as above. Set source: manual -->
<!-- preflight:custom:end -->
