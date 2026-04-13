# Design: cc codex -i Machine-Readable Protocol

**Date:** 2026-04-13  
**Scope:** `src/commands/codex.ts` (interactive mode only) + `.claude/skills/cc-hub/SKILL.md`

## Context

The `-i/--interactive` flag for `cc codex` was built as a human REPL but is exclusively used by scripts and AI agents. The current implementation outputs human-readable text (`You: `, `Codex: ...`, session ready message) that cannot be parsed reliably by machines.

## Protocol Contract

### stdin
One UTF-8 line per prompt. Keywords `exit`, `quit`, `q` (case-insensitive) or EOF (Ctrl-D) terminate the session.

### stdout (JSON lines — one object per line)

| Event | JSON |
|-------|------|
| Session ready | `{"ready":true}` |
| Turn response | `{"response":"..."}` |
| Non-recoverable error | `{"error":"..."}` |

All objects on stdout are valid JSON. No other content appears on stdout.

### stderr
Empty in normal operation. Fatal errors from `handleError` may write text before exit.

### Exit codes
Preserved from existing `handleError`: 3 (auth/not-found), 4 (timeout), 1 (other).

## Startup Sequence

```
[process starts]
  → CodexSession.create()
  → stdout: {"ready":true}
  → (if initial prompt arg provided): process it → stdout: {"response":"..."}
  → enter readline loop
    → read line from stdin
    → stdout: {"response":"..."} or {"error":"..."}
    → on error: exit non-zero
  → on EOF/exit keyword: close session, exit 0
```

## Changes to src/commands/codex.ts (interactive block only)

1. **Option description** — update `-i/--interactive` to state: "Machine-readable interactive session — JSON lines protocol on stdout. For scripts and AI agents only."
2. **Remove** spinner instantiation and all spinner calls within the `-i` block
3. **Remove** the "session ready" stderr message
4. **Add** `process.stdout.write('{"ready":true}\n')` after `CodexSession.create()`
5. **Initial prompt path** — replace `process.stdout.write(`Codex: ${response}\n\n`)` with `process.stdout.write(JSON.stringify({response}) + '\n')`; error path emits `{"error":"..."}`
6. **Readline** — replace `readline.createInterface({ input, output: process.stdout })` + `rl.question()` loop with `readline.createInterface({ input: process.stdin })` + `rl.on('line', ...)` + `rl.on('close', ...)`
7. **Turn response** — replace `process.stdout.write(`\nCodex: ${response}\n\n`)` with `process.stdout.write(JSON.stringify({response}) + '\n')`
8. **Turn error** — emit `process.stdout.write(JSON.stringify({error: message}) + '\n')` then break

## Changes to .claude/skills/cc-hub/SKILL.md

Update the Codex section:
- Mark `-i` as machine-only in description/comments
- Add Python subprocess example showing the full protocol (ready sync + prompt/response loop)

## Non-changes

- Non-interactive codex (`cc codex "prompt"`) — untouched
- `codex review` — untouched  
- `CodexSession` service — untouched
- README — not updated (user request)

## Edge Cases

- **`-i` + `--schema`**: already rejected before this code path (line 51–54) — no change needed
- **Empty lines from stdin**: existing `if (!trimmed) continue` — preserved
- **SIGINT (Ctrl-C)**: existing handler closes rl — preserved; no JSON needed (process exits)
- **Session close error**: caught in `finally`, no stdout emission needed

## Testing

Manual: `echo '{"prompt":"hello"}' | cc codex -i` — not quite right; real usage: `printf 'explain quicksort\nexit\n' | cc codex -i | jq .`
