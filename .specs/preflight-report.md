# Preflight Report — cc-hub

> Generated: 2026-04-14
> Run by: `spec.init --from-code`

---

## Summary

| Category | Checks | ✅ Pass | ❌ Fail | ⚪ Optional |
|---|---|---|---|---|
| Tooling | 3 | 3 | 0 | 0 |
| Tokens (required) | 5 | 0 | 5 | 0 |
| Tokens (optional) | 2 | 0 | 0 | 2 |
| **Total** | **10** | **3** | **5** | **2** |

---

## Tooling

| Check | Result | Notes |
|---|---|---|
| Bun >= 1.0 | ✅ `1.3.9` | |
| TypeScript (bun tsc --noEmit) | ✅ Pass | No type errors |
| creds CLI | ✅ `1.0.0` | |

---

## Tokens (Required)

> These tokens are read at runtime via `creds get <KEY>`. Set them with `creds set <KEY>`.

| Token | Result | Fix |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ❌ Missing | `creds set TELEGRAM_BOT_TOKEN` |
| `TELEGRAM_CHAT_ID` | ❌ Missing | `creds set TELEGRAM_CHAT_ID` |
| `ANTHROPIC_API_KEY` | ❌ Missing | `creds set ANTHROPIC_API_KEY` |
| `OPENROUTER_API_KEY` | ❌ Missing | `creds set OPENROUTER_API_KEY` |
| `REPLICATE_API_KEY` | ❌ Missing | `creds set REPLICATE_API_KEY` |

> Note: These credentials may already be set in the Keychain under a different profile or may not yet be configured. Run `creds get ANTHROPIC_API_KEY` to verify.

---

## Tokens (Optional)

| Token | Result | Notes |
|---|---|---|
| `TURSO_DATABASE_URL` | ⚪ Not set | Only needed for multi-machine sync |
| `TURSO_AUTH_TOKEN` | ⚪ Not set | Only needed for multi-machine sync |

---

## Blockers (Human Action Required)

> Set the following credentials before running `cc-hub` commands that use external APIs:

```bash
creds set TELEGRAM_BOT_TOKEN    # Your Telegram Bot token
creds set TELEGRAM_CHAT_ID      # Your Telegram chat ID
creds set ANTHROPIC_API_KEY     # Anthropic API key (for digest)
creds set OPENROUTER_API_KEY    # OpenRouter key (for cc-hub ask)
creds set REPLICATE_API_KEY     # Replicate key (for imagine/video/music)
```

> Re-run `/spec.preflight` after setting credentials to verify.

---

*Re-run: `/spec.preflight`*
