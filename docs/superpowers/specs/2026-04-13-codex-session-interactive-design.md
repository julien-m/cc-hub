# Design Spec — CodexSession Interactive

**Date:** 2026-04-13
**Branch:** feat/image-reference
**Task:** Implement interactive session mode for `codex` command using `codex app-server` JSON-RPC protocol

---

## Overview

Add an `--interactive` flag to `cc-hub codex` that launches a persistent REPL session with Codex via `codex app-server`. Based on the `SpawnedCodexAppServerClient` pattern from `openai/codex-plugin-cc`, adapted as native TypeScript.

---

## Architecture

### New Files

**`src/services/codex-session.ts`**
Core session client. Adapts `SpawnedCodexAppServerClient` from `app-server.mjs` (OpenAI official), converting to TypeScript and removing broker/Claude Desktop specifics.

### Modified Files

**`src/commands/codex.ts`**
Add `--interactive` flag. When set, creates a `CodexSession` and runs a REPL loop instead of one-shot mode.

---

## Protocol

The `codex app-server` command exposes a newline-delimited JSON-RPC 2.0 protocol over stdin/stdout.

**Initialization sequence:**
```
→ {"id":1,"method":"initialize","params":{"clientInfo":{...},"capabilities":{...}}}
← {"id":1,"result":{...}}
→ {"method":"initialized","params":{}}
→ {"id":2,"method":"thread/start","params":{"cwd":".","sandbox":"read-only","ephemeral":true,...}}
← {"id":2,"result":{"thread":{"id":"<thread-id>"}}}
```

**Turn sequence:**
```
→ {"id":3,"method":"turn/start","params":{"threadId":"<id>","input":[{"type":"text","text":"<prompt>"}]}}
← {"id":3,"result":{"turn":{"id":"<turn-id>"}}}
← {"method":"item/completed","params":{"item":{"type":"agentMessage","text":"..."}}}
← (more item/completed notifications...)
← {"method":"turn/completed","params":{...}}
```

**Message routing:**
- Messages with `id` + no `method` → responses to pending requests
- Messages with `method` + no `id` → notifications (dispatched to handler)
- Messages with `id` + `method` → server requests (respond with error -32601)

---

## `CodexSession` Class

```typescript
export interface CodexSessionOptions {
  model?: string;
  sandbox?: 'read-only' | 'workspace-write';
  persist?: boolean;    // ephemeral: false — keeps thread history
  timeoutMs?: number;   // default: 120_000
}

export class CodexSession {
  static async create(cwd: string, opts?: CodexSessionOptions): Promise<CodexSession>
  ask(prompt: string): Promise<string>
  close(): Promise<void>
}
```

### `create(cwd, opts)` — Factory
1. Validate `cwd` exists and is a directory (throws `CodexSessionError` if not)
2. Spawn `codex app-server` with `stdio: ['pipe', 'pipe', 'pipe']`
3. Attach `readline.createInterface` on stdout for line-by-line JSON parsing
4. Send `initialize` request → wait for response
5. Send `initialized` notification
6. Send `thread/start` with `{ cwd, sandbox, ephemeral: !persist }` → store `threadId`
7. Return initialized instance

### `ask(prompt)` — Turn
1. Throw `CodexSessionClosedError` if session is closed
2. Send `turn/start` with `{ threadId, input: [{ type: 'text', text: prompt }] }`
3. Accumulate `item/completed` notifications where `item.type === 'agentMessage'`
4. Resolve promise on `turn/completed` with accumulated text
5. Reject with `CodexTimeoutError` if `timeoutMs` elapsed without `turn/completed`
6. On unexpected process exit: reject with `CodexSessionError`, mark session closed

### `close()` — Cleanup
1. If already `closed`, await `exitPromise` and return (idempotent)
2. Set `closed = true`
3. Reject all pending requests with `CodexSessionClosedError`
4. Close `readline` interface (stop consuming stdout)
5. Call `proc.stdin.end()` (signals EOF to server)
6. Schedule `proc.kill('SIGTERM')` via `setTimeout(..., 50).unref()` (conditional: skip if already exited)
7. `await exitPromise` — resolves when `proc` emits `'close'`

### Internal Request Dispatcher
```
Map<id, { resolve, reject, method }> — pending requests
exitPromise: Promise<void>   — resolves when process exits
stderrBuffer: string         — accumulated stderr for auth detection
```
Each line received is parsed and routed:
- Has `id` + no `method` → resolve/reject pending request
- Has `method` + no `id` → call `notificationHandler`
- Has `id` + `method` (server request) → call `writeJson({ id, error: { code: -32601, message: '...' } })`

Internal `writeJson(msg)` method writes `JSON.stringify(msg) + '\n'` to stdin.

**Stderr listener:** Attach `proc.stderr.on('data')` during init, accumulate into `stderrBuffer`. On process exit with non-zero code, check `stderrBuffer` against `AUTH_ERROR_PATTERNS` (imported from `codex.ts` or duplicated) to decide `CodexAuthError` vs `CodexSessionError`.

---

## Error Hierarchy

All extend the existing `Error` class (not `AppError`, to match existing `CodexAuthError`/`CodexNotFoundError` pattern in `src/services/codex.ts`):

| Class | Trigger | Exit code |
|---|---|---|
| `CodexAuthError` | auth patterns in stderr (existing) | 3 |
| `CodexNotFoundError` | ENOENT on spawn (existing) | 3 |
| `CodexTimeoutError` | `turn/completed` not received within `timeoutMs` | 4 |
| `CodexSessionError` | invalid cwd, parse error, unexpected exit | 1 |
| `CodexSessionClosedError` | `ask()` called after `close()` | 1 |

Note: new error classes go in `src/services/codex-session.ts`, not in `src/errors.ts` (matching the pattern of `codex.ts` which keeps its errors colocated).

`handleError` in `src/commands/codex.ts` must be extended to handle `CodexTimeoutError` (exit 4) and `CodexSessionError` (exit 1). `CodexSessionClosedError` is a programming error — if it surfaces to the user, it falls through to generic exit 1.

---

## Command Changes — `src/commands/codex.ts`

Add to the main `codex` command:
```
.option('--interactive', 'Start an interactive REPL session via codex app-server')
.option('--persist', 'Keep thread history across turns (ephemeral: false)')
```

**When `--interactive` is set:**
1. Validate `--schema` not set (incompatible, exit 2)
2. Resolve model (same as one-shot mode)
3. Validate `--sandbox` value
4. Create `CodexSession` (throws on auth/not-found/timeout → handled by extended `handleError`)
5. Print welcome message to stderr: `Codex session ready. Type "exit" or Ctrl-C to quit.`
6. If a prompt argument was provided → resolve it via `resolvePrompt()` **before** creating readline (avoids stdin conflict), send as first turn, print response
7. Create `readline.Interface` on `process.stdin` / `process.stdout` **after** consuming any piped prompt
8. Register `process.once('SIGINT', ...)` → calls `rl.close()` for clean exit (removed after handler fires)
9. REPL loop via `rl.question('You: ', callback)`:
   - Empty input → re-prompt
   - `exit` / `quit` / `q` → `rl.close()`, break
   - Other → spinner start → `session.ask(input)` → spinner stop → print response
10. On error in `ask()` → `spinner.stop()` → print error → break loop
11. Finally (after loop): `rl.close()` if not already closed, `await session.close()`

**Spinner behavior:**
- Start `Spinner('thinking...', { elapsed: true })` before `ask()`
- Stop spinner before printing response
- Use existing `src/infra/spinner.ts` (wraps `ora` already in deps)

**Mutual exclusivity:** `--interactive` and piped stdin prompt are compatible (prompt = first message). `--interactive` and `--schema` are incompatible (REPL doesn't support structured output mode) → error exit code 2.

---

## UX Flow

```
$ cc-hub codex --interactive
Codex session ready. Type "exit" or Ctrl-C to quit.

You: What is the capital of France?
⏳ thinking... (2s)
Codex: Paris is the capital of France.

You: And of Germany?
⏳ thinking... (1s)
Codex: Berlin is the capital of Germany.

You: exit
```

**SIGINT (Ctrl-C):**
- During readline prompt → triggers `rl.close()` → exit loop → `session.close()`
- During `ask()` await → caught via `process.on('SIGINT')` → `session.close()` + exit 0

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| `codex` not in PATH | `CodexNotFoundError` before REPL starts |
| Not authenticated | `CodexAuthError` before REPL starts (detected from stderr during init) |
| `cwd` doesn't exist | `CodexSessionError` before spawn |
| `turn/completed` timeout | `CodexTimeoutError` → print error, close session, exit |
| Codex process dies mid-turn | `CodexSessionError` → print error, exit loop |
| Empty input | Skip silently, re-prompt |
| `--schema` + `--interactive` | Error: incompatible options, exit 2 |

---

## Files Summary

| File | Action | Lines (est.) |
|---|---|---|
| `src/services/codex-session.ts` | Create | ~180 |
| `src/commands/codex.ts` | Modify | +60 lines |
| `README.md` | Update codex section | ~10 lines |
| `.claude/skills/cc-hub/SKILL.md` | Update command reference | ~5 lines |
