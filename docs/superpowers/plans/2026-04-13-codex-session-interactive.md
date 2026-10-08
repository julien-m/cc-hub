# CodexSession Interactive Mode — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `--interactive` flag to `cc-hub codex` that launches a persistent REPL session using the `codex app-server` JSON-RPC protocol.

**Architecture:** A new `CodexSession` class in `src/services/codex-session.ts` adapts the `SpawnedCodexAppServerClient` pattern from `openai/codex-plugin-cc/app-server.mjs` into native TypeScript, implementing the JSON-RPC protocol over stdin/stdout. The existing `codex` command is extended with `--interactive` and `--persist` flags that trigger a readline REPL loop instead of one-shot mode.

**Tech Stack:** Bun runtime, TypeScript, Node.js `child_process.spawn`, Node.js `readline`, `ora` (via existing `Spinner` wrapper), `bun:test` for tests.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/services/codex-session.ts` | **Create** | CodexSession class — process management, JSON-RPC dispatcher, initialize, thread/start, ask, close |
| `src/services/codex.ts` | **Modify** | Export `AUTH_ERROR_PATTERNS` (currently unexported) |
| `src/commands/codex.ts` | **Modify** | Add `--interactive`, `--persist` flags; REPL loop logic; extend `handleError` |
| `tests/services/codex-session.test.ts` | **Create** | Error class tests + options conflict test |
| `README.md` | **Modify** | Document `--interactive` and `--persist` options and new `codex session` usage |
| `.claude/skills/cc-hub/SKILL.md` | **Modify** | Update codex command reference |

---

## Task 1: Export `AUTH_ERROR_PATTERNS` from `src/services/codex.ts`

**Files:**
- Modify: `src/services/codex.ts`

The `codex-session.ts` service needs to detect auth errors from stderr. The patterns are already defined in `codex.ts` but not exported.

- [ ] **Step 1.1: Make `AUTH_ERROR_PATTERNS` exported**

In `src/services/codex.ts`, change line 10:

```typescript
// Before:
const AUTH_ERROR_PATTERNS: readonly string[] = [
// After:
export const AUTH_ERROR_PATTERNS: readonly string[] = [
```

- [ ] **Step 1.2: Verify TypeScript compiles**

```bash
bun run start -- --version
```

Expected: `0.1.0` (or current version, no errors).

- [ ] **Step 1.3: Commit**

```bash
git add src/services/codex.ts
git commit -m "feat(codex): export AUTH_ERROR_PATTERNS for session reuse"
```

---

## Task 2: Create `src/services/codex-session.ts` — Error Classes and Types

**Files:**
- Create: `src/services/codex-session.ts`

Create the file with error classes and the `CodexSessionOptions` interface. No class implementation yet — just the contracts.

- [ ] **Step 2.1: Create the file with errors and types**

Create `src/services/codex-session.ts`:

```typescript
/**
 * Codex app-server interactive session client.
 * Implements the JSON-RPC 2.0 newline-delimited protocol over stdin/stdout.
 * Adapted from SpawnedCodexAppServerClient in openai/codex-plugin-cc.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import readline from 'node:readline';
import { AUTH_ERROR_PATTERNS } from './codex.ts';

/** Thrown when the session times out waiting for turn/completed. */
export class CodexTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodexTimeoutError';
  }
}

/** Thrown for session-level errors: invalid cwd, parse failures, unexpected exit. */
export class CodexSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodexSessionError';
  }
}

/** Thrown when ask() is called on a closed session. */
export class CodexSessionClosedError extends Error {
  constructor() {
    super('CodexSession is already closed.');
    this.name = 'CodexSessionClosedError';
  }
}

export interface CodexSessionOptions {
  model?: string;
  sandbox?: 'read-only' | 'workspace-write';
  /** Keep thread history across turns (ephemeral: false). Default: false. */
  persist?: boolean;
  /** Timeout in ms for each turn. Default: 120_000. */
  timeoutMs?: number;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  method: string;
}

interface JsonRpcNotification {
  method: string;
  params: Record<string, unknown>;
}

type NotificationHandler = (msg: JsonRpcNotification) => void;
```

- [ ] **Step 2.2: Verify file parses (no TypeScript errors)**

```bash
bun run start -- --version
```

Expected: no errors.

- [ ] **Step 2.3: Write error class tests**

Create `tests/services/codex-session.test.ts`:

```typescript
import { describe, it, expect } from 'bun:test';
import {
  CodexTimeoutError,
  CodexSessionError,
  CodexSessionClosedError,
} from '../../src/services/codex-session.ts';

describe('CodexSession error classes', () => {
  it('CodexTimeoutError has correct name', () => {
    const err = new CodexTimeoutError('timeout');
    expect(err.name).toBe('CodexTimeoutError');
    expect(err.message).toBe('timeout');
    expect(err).toBeInstanceOf(Error);
  });

  it('CodexSessionError has correct name', () => {
    const err = new CodexSessionError('invalid cwd');
    expect(err.name).toBe('CodexSessionError');
    expect(err).toBeInstanceOf(Error);
  });

  it('CodexSessionClosedError has correct name and default message', () => {
    const err = new CodexSessionClosedError();
    expect(err.name).toBe('CodexSessionClosedError');
    expect(err.message).toBe('CodexSession is already closed.');
    expect(err).toBeInstanceOf(Error);
  });
});
```

- [ ] **Step 2.4: Run tests to confirm they pass**

```bash
bun test tests/services/codex-session.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 2.5: Commit**

```bash
git add src/services/codex-session.ts tests/services/codex-session.test.ts
git commit -m "feat(codex-session): add error classes and CodexSessionOptions type"
```

---

## Task 3: Implement `CodexSession` class — core JSON-RPC client

**Files:**
- Modify: `src/services/codex-session.ts`

Add the `CodexSession` class with process management, the JSON-RPC line dispatcher, `initialize()`, and `create()` factory. No `ask()` yet.

- [ ] **Step 3.1: Add the class body (append to `codex-session.ts`)**

Append to the end of `src/services/codex-session.ts`:

```typescript
/**
 * Interactive session with Codex via `codex app-server` JSON-RPC protocol.
 * Lifecycle: create() → ask() × N → close()
 */
export class CodexSession {
  private proc!: ChildProcess;
  private rl!: readline.Interface;
  private pending = new Map<number, PendingRequest>();
  private nextId = 1;
  private notificationHandler: NotificationHandler | null = null;
  private stderrBuffer = '';
  private lineBuffer = '';
  private closed = false;
  private exitPromise!: Promise<void>;
  private resolveExit!: () => void;

  private threadId!: string;
  private readonly timeoutMs: number;

  private constructor(private readonly opts: CodexSessionOptions) {
    this.timeoutMs = opts.timeoutMs ?? 120_000;
  }

  /**
   * Spawn `codex app-server`, initialize the JSON-RPC session, and start a thread.
   * @throws CodexSessionError if cwd is invalid.
   * @throws CodexNotFoundError if codex binary is not in PATH.
   * @throws CodexAuthError if codex is not authenticated (detected from stderr on exit).
   */
  static async create(cwd: string, opts: CodexSessionOptions = {}): Promise<CodexSession> {
    // Validate cwd exists and is a directory
    const { stat } = await import('node:fs/promises');
    try {
      const st = await stat(cwd);
      if (!st.isDirectory()) {
        throw new CodexSessionError(`cwd is not a directory: ${cwd}`);
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new CodexSessionError(`cwd does not exist: ${cwd}`);
      }
      throw err;
    }

    const session = new CodexSession(opts);
    await session._initialize(cwd);
    return session;
  }

  /** Initialize process, readline, handshake, and thread. */
  private async _initialize(cwd: string): Promise<void> {
    this.exitPromise = new Promise<void>((resolve) => {
      this.resolveExit = resolve;
    });

    // Import CodexNotFoundError and CodexAuthError from codex.ts
    const { CodexAuthError, CodexNotFoundError } = await import('./codex.ts');

    this.proc = spawn('codex', ['app-server'], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.proc.stderr!.setEncoding('utf8');
    this.proc.stderr!.on('data', (chunk: string) => {
      this.stderrBuffer += chunk;
    });

    this.proc.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        this._handleExit(new CodexNotFoundError());
      } else {
        this._handleExit(new CodexSessionError(err.message));
      }
    });

    this.proc.on('close', () => {
      const isAuthError = AUTH_ERROR_PATTERNS.some((p) =>
        this.stderrBuffer.toLowerCase().includes(p),
      );
      const exitErr = isAuthError
        ? new CodexAuthError(this.stderrBuffer.trim() || 'Authentication required')
        : null;
      this._handleExit(exitErr);
    });

    this.rl = readline.createInterface({ input: this.proc.stdout! });
    this.rl.on('line', (line: string) => this._handleLine(line));

    // JSON-RPC handshake
    await this._request('initialize', {
      clientInfo: { name: 'cc-hub', version: '0.1.0' },
      capabilities: {
        experimentalApi: false,
        optOutNotificationMethods: [
          'item/agentMessage/delta',
          'item/reasoning/summaryTextDelta',
          'item/reasoning/summaryPartAdded',
          'item/reasoning/textDelta',
        ],
      },
    });
    this._notify('initialized', {});

    // Start thread
    const result = await this._request('thread/start', {
      cwd,
      model: this.opts.model ?? null,
      approvalPolicy: 'never',
      sandbox: this.opts.sandbox ?? 'read-only',
      ephemeral: !this.opts.persist,
      serviceName: 'cc-hub',
      experimentalRawEvents: false,
    }) as { thread: { id: string } };

    this.threadId = result.thread.id;
  }

  /** Send a JSON-RPC request and await the response. */
  private _request(method: string, params: unknown): Promise<unknown> {
    if (this.closed) {
      return Promise.reject(new CodexSessionClosedError());
    }
    const id = this.nextId++;
    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this._writeJson({ id, method, params });
    });
  }

  /** Send a JSON-RPC notification (no id, no response expected). */
  private _notify(method: string, params: unknown): void {
    if (this.closed) return;
    this._writeJson({ method, params });
  }

  /** Write a JSON message as a newline-delimited line to stdin. */
  private _writeJson(msg: unknown): void {
    const line = `${JSON.stringify(msg)}\n`;
    this.proc.stdin?.write(line);
  }

  /** Parse and route a line received from the server. */
  private _handleLine(line: string): void {
    if (!line.trim()) return;

    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(line);
    } catch {
      this._handleExit(new CodexSessionError(`Failed to parse codex JSON: ${line}`));
      return;
    }

    // Server-initiated request (has both id and method): reject with -32601
    if (msg['id'] !== undefined && msg['method']) {
      this._writeJson({
        id: msg['id'],
        error: { code: -32601, message: `Unsupported server request: ${msg['method']}` },
      });
      return;
    }

    // Response to a pending request
    if (msg['id'] !== undefined) {
      const pending = this.pending.get(msg['id'] as number);
      if (!pending) return;
      this.pending.delete(msg['id'] as number);
      if (msg['error']) {
        const errData = msg['error'] as { message?: string };
        pending.reject(new CodexSessionError(errData.message ?? `${pending.method} failed`));
      } else {
        pending.resolve(msg['result'] ?? {});
      }
      return;
    }

    // Notification
    if (msg['method'] && this.notificationHandler) {
      this.notificationHandler(msg as JsonRpcNotification);
    }
  }

  /** Called when the process exits (normally or on error). */
  private _handleExit(error: Error | null): void {
    if (this.resolveExit) {
      // Reject all pending requests
      for (const pending of this.pending.values()) {
        pending.reject(error ?? new CodexSessionError('codex app-server closed unexpectedly'));
      }
      this.pending.clear();
      this.resolveExit();
    }
  }

  /**
   * Close the session and terminate the codex process.
   * Idempotent — safe to call multiple times.
   */
  async close(): Promise<void> {
    if (this.closed) {
      await this.exitPromise;
      return;
    }
    this.closed = true;

    // Reject any pending requests immediately
    for (const pending of this.pending.values()) {
      pending.reject(new CodexSessionClosedError());
    }
    this.pending.clear();

    // Stop reading stdout
    this.rl.close();

    // Signal EOF to server
    this.proc.stdin?.end();

    // SIGTERM after 50ms if still alive
    setTimeout(() => {
      if (this.proc.exitCode === null && !this.proc.killed) {
        this.proc.kill('SIGTERM');
      }
    }, 50).unref?.();

    await this.exitPromise;
  }
}
```

- [ ] **Step 3.2: Verify TypeScript (no import errors)**

```bash
bun run start -- --version
```

Expected: version printed, no errors.

- [ ] **Step 3.3: Run existing tests (no regressions)**

```bash
bun test
```

Expected: all tests pass.

- [ ] **Step 3.4: Commit**

```bash
git add src/services/codex-session.ts
git commit -m "feat(codex-session): implement CodexSession class with JSON-RPC client"
```

---

## Task 4: Implement `CodexSession.ask()` — turn execution

**Files:**
- Modify: `src/services/codex-session.ts`

Add the `ask()` method to the class body (insert before the `close()` method).

- [ ] **Step 4.1: Add `ask()` to the CodexSession class**

In `src/services/codex-session.ts`, insert the following method **before** the `close()` method (before the line `async close(): Promise<void>`):

```typescript
  /**
   * Send a prompt and return the assistant's response.
   * Accumulates all agentMessage items until turn/completed.
   * @throws CodexSessionClosedError if session is closed.
   * @throws CodexTimeoutError if no response within timeoutMs.
   * @throws CodexSessionError if the server disconnects unexpectedly.
   */
  async ask(prompt: string): Promise<string> {
    if (this.closed) throw new CodexSessionClosedError();

    return new Promise<string>((resolve, reject) => {
      let accumulated = '';
      let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        this.notificationHandler = null;
      };

      if (this.timeoutMs > 0) {
        timeoutHandle = setTimeout(() => {
          cleanup();
          reject(new CodexTimeoutError(`Turn timed out after ${this.timeoutMs}ms`));
        }, this.timeoutMs);
      }

      this.notificationHandler = (msg) => {
        if (msg.method === 'item/completed') {
          const item = (msg.params as { item?: { type?: string; text?: string } }).item;
          if (item?.type === 'agentMessage' && typeof item.text === 'string') {
            accumulated += item.text;
          }
        } else if (msg.method === 'turn/completed') {
          cleanup();
          resolve(accumulated);
        }
      };

      this._request('turn/start', {
        threadId: this.threadId,
        input: [{ type: 'text', text: prompt, text_elements: [] }],
      }).catch((err: Error) => {
        cleanup();
        reject(err);
      });
    });
  }
```

- [ ] **Step 4.2: Verify TypeScript**

```bash
bun run start -- --version
```

Expected: no errors.

- [ ] **Step 4.3: Run all tests**

```bash
bun test
```

Expected: all pass.

- [ ] **Step 4.4: Commit**

```bash
git add src/services/codex-session.ts
git commit -m "feat(codex-session): implement ask() with turn/start and notification accumulation"
```

---

## Task 5: Extend `handleError` in `src/commands/codex.ts`

**Files:**
- Modify: `src/commands/codex.ts`

Import the new error classes and handle them in `handleError`.

- [ ] **Step 5.1: Add import for new error classes**

In `src/commands/codex.ts`, update the import line at line 4:

```typescript
// Before:
import { askCodex, reviewCodex, CodexAuthError, CodexNotFoundError } from '../services/codex.ts';

// After:
import { askCodex, reviewCodex, CodexAuthError, CodexNotFoundError } from '../services/codex.ts';
import { CodexSession, CodexTimeoutError, CodexSessionError } from '../services/codex-session.ts';
```

- [ ] **Step 5.2: Extend `handleError` function**

Find the `handleError` function at the bottom of `src/commands/codex.ts`. Replace the entire function:

```typescript
/**
 * Handle Codex command errors with appropriate messages and exit codes.
 * @param err - The caught error.
 */
const handleError = (err: unknown): never => {
  if (err instanceof CodexNotFoundError) {
    console.error(err.message);
    process.exit(3);
  }
  if (err instanceof CodexAuthError) {
    console.error('Codex is not authenticated. Run: codex login');
    process.exit(3);
  }
  if (err instanceof CodexTimeoutError) {
    console.error(`Codex timeout: ${err.message}`);
    process.exit(4);
  }
  if (err instanceof CodexSessionError) {
    console.error(`Codex session error: ${err.message}`);
    process.exit(1);
  }
  console.error(
    `Codex command failed: ${(err as Error).message}. ` +
    'Check the model name and that codex CLI is installed.',
  );
  process.exit(exitCode(err, 4));
};
```

- [ ] **Step 5.3: Verify TypeScript**

```bash
bun run start -- --version
```

Expected: no errors.

- [ ] **Step 5.4: Run all tests**

```bash
bun test
```

Expected: all pass.

- [ ] **Step 5.5: Commit**

```bash
git add src/commands/codex.ts
git commit -m "feat(codex): import CodexSession and extend handleError for new error types"
```

---

## Task 6: Add `--interactive` and `--persist` flags + REPL loop

**Files:**
- Modify: `src/commands/codex.ts`

This is the main UX task. Add the flags, validate incompatibility with `--schema`, and implement the REPL loop.

- [ ] **Step 6.1: Add `readline` import at the top of `src/commands/codex.ts`**

Add after the existing imports:

```typescript
import readline from 'node:readline';
```

- [ ] **Step 6.2: Add `--interactive` and `--persist` options to the command**

In `createCodexCommand()`, find the `.option('--schema <path>', ...)` line and add after it:

```typescript
    .option('--interactive', 'Start an interactive REPL session (codex app-server)')
    .option('--persist', 'Keep thread history across turns (ephemeral: false)')
```

- [ ] **Step 6.3: Update the action signature to include new opts**

Update the `.action` type signature. Find:

```typescript
    .action(async (promptArg: string | undefined, opts: {
      model?: string;
      file: string[];
      effort?: string;
      sandbox?: string;
      schema?: string;
    }) => {
```

Replace with:

```typescript
    .action(async (promptArg: string | undefined, opts: {
      model?: string;
      file: string[];
      effort?: string;
      sandbox?: string;
      schema?: string;
      interactive?: boolean;
      persist?: boolean;
    }) => {
```

- [ ] **Step 6.4: Add interactive mode logic at the start of the action**

In the action body, after the `validSandboxes` check block and before the `const resolved = await resolvePrompt(promptArg);` line, insert the entire interactive block:

```typescript
        // ── Interactive mode ─────────────────────────────────────────────
        if (opts.interactive) {
          if (opts.schema) {
            console.error('Error: --schema is not compatible with --interactive');
            process.exit(2);
          }

          const rawModel = opts.model || getEnv('CODEX_MODEL') || 'openai/gpt-5.4';
          const nativeModel = resolveForProvider(rawModel, 'codex');

          let session: CodexSession;
          const initSpinner = new Spinner('connecting...', { elapsed: true }).start();
          try {
            session = await CodexSession.create(process.cwd(), {
              model: nativeModel,
              sandbox: (opts.sandbox as 'read-only' | 'workspace-write') ?? 'read-only',
              persist: opts.persist,
            });
            initSpinner.stop();
          } catch (err) {
            initSpinner.stop();
            handleError(err);
          }

          process.stderr.write('Codex session ready. Type "exit" or Ctrl-C to quit.\n\n');

          // If a prompt was given as argument, send it as the first turn
          if (promptArg) {
            const firstSpinner = new Spinner('thinking...', { elapsed: true }).start();
            try {
              const response = await session!.ask(promptArg);
              firstSpinner.stop();
              process.stdout.write(`Codex: ${response}\n\n`);
            } catch (err) {
              firstSpinner.stop();
              console.error(`Error: ${(err as Error).message}`);
              await session!.close();
              process.exit(exitCode(err, 1));
            }
          }

          // REPL loop
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          const sigintHandler = () => {
            process.stderr.write('\n');
            rl.close();
          };
          process.once('SIGINT', sigintHandler);

          const askLine = (p: string): Promise<string | null> =>
            new Promise((resolve) => {
              rl.question(p, (answer) => resolve(answer));
              rl.once('close', () => resolve(null));
            });

          try {
            while (true) {
              const input = await askLine('You: ');
              if (input === null) break;
              const trimmed = input.trim();
              if (!trimmed) continue;
              if (['exit', 'quit', 'q'].includes(trimmed.toLowerCase())) break;

              const turnSpinner = new Spinner('thinking...', { elapsed: true }).start();
              try {
                const response = await session!.ask(trimmed);
                turnSpinner.stop();
                process.stdout.write(`\nCodex: ${response}\n\n`);
              } catch (err) {
                turnSpinner.stop();
                console.error(`\nError: ${(err as Error).message}`);
                break;
              }
            }
          } finally {
            process.removeListener('SIGINT', sigintHandler);
            if (!rl.terminal) rl.close(); // close if not already closed
            await session!.close();
          }

          return;
        }
        // ── End interactive mode ──────────────────────────────────────────
```

- [ ] **Step 6.5: Verify TypeScript compiles**

```bash
bun run start -- --version
```

Expected: `0.1.0`, no errors.

- [ ] **Step 6.6: Smoke-test the options parsing (no codex needed)**

```bash
bun run start -- codex --help
```

Expected: output includes `--interactive` and `--persist` in the options list.

- [ ] **Step 6.7: Test --schema + --interactive conflict**

```bash
bun run start -- codex --interactive --schema /tmp/schema.json "test" 2>&1; echo "exit: $?"
```

Expected: `Error: --schema is not compatible with --interactive` and exit code `2`.

- [ ] **Step 6.8: Run all tests**

```bash
bun test
```

Expected: all pass.

- [ ] **Step 6.9: Commit**

```bash
git add src/commands/codex.ts
git commit -m "feat(codex): add --interactive REPL mode with --persist flag"
```

---

## Task 7: Update documentation

**Files:**
- Modify: `README.md`
- Modify: `.claude/skills/cc-hub/SKILL.md`

- [ ] **Step 7.1: Update README.md — add interactive section**

Find the `### \`codex\` — LLM via OpenAI Codex CLI` section. After the existing options table (which ends with `| \`--schema <path>\``), add:

```markdown
| `--interactive` | Start an interactive REPL session (persistent thread via `codex app-server`) |
| `--persist` | Keep thread history across turns |

#### `cc-hub codex --interactive`

Launch a persistent conversational session with Codex:

```bash
cc-hub codex --interactive
cc-hub codex --interactive "Start with this question"
cc-hub codex --interactive --sandbox workspace-write
cc-hub codex --interactive --persist   # keep history between runs
```

Type `exit` or press Ctrl-C to end the session.
```

- [ ] **Step 7.2: Update `.claude/skills/cc-hub/SKILL.md`**

Find the `cc-hub codex` section. After the existing one-shot usage examples, add:

```markdown
cc-hub codex --interactive            # interactive REPL session
cc-hub codex --interactive "prompt"   # start session with initial prompt
cc-hub codex --interactive --persist  # persistent thread history
```

And add `--interactive` and `--persist` to the options description line.

- [ ] **Step 7.3: Verify no broken markdown**

```bash
grep -c "interactive" README.md
```

Expected: at least 3 matches.

- [ ] **Step 7.4: Commit**

```bash
git add README.md .claude/skills/cc-hub/SKILL.md
git commit -m "docs(codex): document --interactive and --persist options"
```

---

## Self-Review Checklist

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| `src/services/codex-session.ts` created | Task 3+4 |
| Error classes: `CodexTimeoutError`, `CodexSessionError`, `CodexSessionClosedError` | Task 2 |
| `AUTH_ERROR_PATTERNS` exported | Task 1 |
| `create()` validates cwd | Task 3 |
| `create()` spawns `codex app-server` | Task 3 |
| JSON-RPC handshake (initialize → initialized → thread/start) | Task 3 |
| `ask()` accumulates agentMessage items | Task 4 |
| `ask()` resolves on `turn/completed` | Task 4 |
| `ask()` times out with `CodexTimeoutError` | Task 4 |
| `close()` idempotent, rejects pending, sends SIGTERM | Task 3 |
| `handleError` extended for new error types | Task 5 |
| `--interactive` flag on `codex` command | Task 6 |
| `--persist` flag | Task 6 |
| `--schema` + `--interactive` conflict check | Task 6 |
| SIGINT handler (once, removed after) | Task 6 |
| First prompt from arg sent before readline loop | Task 6 |
| Spinner during connection + each turn | Task 6 |
| README + SKILL.md updated | Task 7 |
| stderr auth detection on process close | Task 3 |
| Server-initiated requests rejected with -32601 | Task 3 |

**Type consistency check:**
- `CodexSession` exported from `codex-session.ts` ✓
- `CodexTimeoutError`, `CodexSessionError`, `CodexSessionClosedError` imported in `codex.ts` command ✓
- `session.ask(prompt)` returns `Promise<string>` ✓
- `session.close()` returns `Promise<void>` ✓
- `CodexSession.create(cwd, opts)` returns `Promise<CodexSession>` ✓
