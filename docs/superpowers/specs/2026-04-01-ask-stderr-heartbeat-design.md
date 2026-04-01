# cc-hub ask — stderr heartbeat

## Purpose

Prevent Claude Code's Bash tool from auto-backgrounding `cc-hub ask` by emitting periodic progress markers on stderr during the API wait.

## Architecture

No architectural change. Single-file modification in the existing command handler.

## Component

`src/commands/ask.ts` — only file modified.

## Change

Before the `await askFn(...)` call, start a `setInterval` that writes `[cc-hub] waiting... {N}s\n` to stderr every 1 second. Counter increments each tick. Stop the interval in a `finally` block after response (or error).

## Data flow

```
stdin/files → build prompt → START heartbeat → await askFn() → STOP heartbeat → stdout
```

## Decisions

| Question | Choice | Rationale |
|----------|--------|-----------|
| Placement | `ask.ts` command handler | CLI/UX concern, not service concern |
| Flag | Always-on | stderr doesn't break stdout piping |
| Interval | 1 second | User-requested, defensive against auto-backgrounding |
| Format | `[cc-hub] waiting... {N}s\n` | Consistent with `[codex]` pattern, counter adds info |
| Scope | `ask` only | Only command affected in roundtable workflow |
| Cleanup | `clearInterval` in `finally` | Guarantees cleanup on error |

## Edge cases

- Fast response (<1s): 0 markers emitted, no noise
- Network error/timeout: finally cleanup guarantees stop
- Piping stdout: unaffected (heartbeat = stderr only)
- Piping stderr (`2>&1`): markers visible — intended for Claude Code
