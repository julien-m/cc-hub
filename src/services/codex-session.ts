/**
 * Codex app-server interactive session client.
 * Implements the JSON-RPC 2.0 newline-delimited protocol over stdin/stdout.
 * Adapted from SpawnedCodexAppServerClient in openai/codex-plugin-cc.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface, type Interface as ReadlineInterface } from 'node:readline';
import { stat } from 'node:fs/promises';
import { AUTH_ERROR_PATTERNS, CodexAuthError, CodexNotFoundError } from './codex.ts';

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
  /** Keep thread history across turns (ephemeral: false). Default: false (ephemeral: true). */
  persist?: boolean;
  /** Timeout in ms for each turn. Default: 120_000. */
  timeoutMs?: number;
}

// Internal types
export interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  method: string;
}

export interface JsonRpcNotification {
  method: string;
  params: Record<string, unknown>;
}

export type NotificationHandler = (msg: JsonRpcNotification) => void;

export class CodexSession {
  private proc!: ChildProcess;
  private rl!: ReadlineInterface;
  private pending = new Map<number, PendingRequest>();
  private nextId = 1;
  private notificationHandler: NotificationHandler | null = null;
  private stderrBuffer = '';
  private closed = false;
  private exitHandled = false;
  private exitPromise!: Promise<void>;
  private resolveExit!: () => void;
  private threadId!: string;
  private readonly timeoutMs: number;

  private constructor(private readonly opts: CodexSessionOptions) {
    this.timeoutMs = opts.timeoutMs ?? 120_000;
  }

  static async create(cwd: string, opts: CodexSessionOptions = {}): Promise<CodexSession> {
    let stats: Awaited<ReturnType<typeof stat>>;
    try {
      stats = await stat(cwd);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new CodexSessionError('cwd does not exist: ' + cwd);
      }
      throw err;
    }
    if (!stats.isDirectory()) {
      throw new CodexSessionError('cwd is not a directory: ' + cwd);
    }

    const session = new CodexSession(opts);
    await Promise.race([
      session._initialize(cwd),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new CodexSessionError('app-server handshake timed out — check codex version')),
          10_000,
        ).unref?.(),
      ),
    ]);
    return session;
  }

  private async _initialize(cwd: string): Promise<void> {
    this.exitPromise = new Promise<void>((resolve) => {
      this.resolveExit = resolve;
    });

    this.proc = spawn('codex', ['app-server'], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.proc.stderr?.on('data', (chunk: Buffer) => {
      this.stderrBuffer += chunk.toString();
    });

    this.proc.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        this._handleExit(new CodexNotFoundError());
      } else {
        this._handleExit(new CodexSessionError(err.message));
      }
    });

    this.proc.on('close', () => {
      const stderr = this.stderrBuffer.toLowerCase();
      const authMatch = AUTH_ERROR_PATTERNS.some((p) => stderr.includes(p));
      if (authMatch) {
        this._handleExit(new CodexAuthError('Codex authentication required. Run `codex login`.'));
      } else {
        this._handleExit(null);
      }
    });

    this.rl = createInterface({ input: this.proc.stdout! });
    this.rl.on('line', (line: string) => this._handleLine(line));

    await this._request('initialize', {
      clientInfo: { name: 'cc-hub', version: '1.0.0' },
      capabilities: {},
    });

    this._notify('initialized', {});

    const startResult = (await this._request('thread/start', {
      cwd,
      model: this.opts.model ?? null,
      approvalPolicy: 'never',
      sandbox: this.opts.sandbox ?? 'read-only',
      ephemeral: !this.opts.persist,
      serviceName: 'cc-hub',
      experimentalRawEvents: false,
    })) as { thread: { id: string } };

    this.threadId = startResult.thread.id;
  }

  private _request(method: string, params: unknown): Promise<unknown> {
    if (this.closed) {
      return Promise.reject(new CodexSessionClosedError());
    }
    return new Promise<unknown>((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject, method });
      this._writeJson({ id, method, params });
    });
  }

  private _notify(method: string, params: unknown): void {
    if (this.closed) return;
    this._writeJson({ method, params });
  }

  private _writeJson(msg: unknown): void {
    this.proc.stdin?.write(JSON.stringify(msg) + '\n');
  }

  private _handleLine(line: string): void {
    if (!line.trim()) return;

    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(line) as Record<string, unknown>;
    } catch {
      this._handleExit(new CodexSessionError('Failed to parse JSON-RPC message: ' + line));
      return;
    }

    // Server-initiated request (has both id and method)
    if (msg['id'] !== undefined && msg['method'] !== undefined) {
      this._writeJson({
        id: msg['id'],
        error: { code: -32601, message: 'Unsupported server request: ' + String(msg['method']) },
      });
      return;
    }

    // Response to a pending request (has id, no method)
    if (msg['id'] !== undefined) {
      const id = msg['id'] as number;
      const pending = this.pending.get(id);
      if (pending) {
        this.pending.delete(id);
        if (msg['error'] !== undefined) {
          const err = msg['error'] as { message?: string };
          pending.reject(new CodexSessionError(err.message ?? 'Unknown RPC error'));
        } else {
          pending.resolve(msg['result']);
        }
      }
      return;
    }

    // Notification (has method, no id)
    if (msg['method'] !== undefined) {
      this.notificationHandler?.(msg as unknown as JsonRpcNotification);
    }
  }

  private _handleExit(error: Error | null): void {
    if (this.exitHandled) return;
    this.exitHandled = true;

    for (const pending of this.pending.values()) {
      pending.reject(error ?? new CodexSessionError('Session exited unexpectedly.'));
    }
    this.pending.clear();

    this.resolveExit();
  }

  async ask(prompt: string): Promise<string> {
    if (this.closed) throw new CodexSessionClosedError();

    return new Promise<string>((resolve, reject) => {
      const accumulated: string[] = [];
      let timer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        this.notificationHandler = null;
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
      };

      this.notificationHandler = (msg: JsonRpcNotification) => {
        if (msg.method === 'item/completed') {
          const item = msg.params['item'] as { type?: string; text?: string } | undefined;
          if (item?.type === 'agentMessage' && typeof item.text === 'string') {
            accumulated.push(item.text);
          }
        } else if (msg.method === 'turn/completed') {
          cleanup();
          resolve(accumulated.join(''));
        }
      };

      timer = setTimeout(() => {
        cleanup();
        reject(new CodexTimeoutError(`Codex turn timed out after ${this.timeoutMs}ms.`));
      }, this.timeoutMs);

      this._request('turn/start', {
        threadId: this.threadId,
        input: [{ type: 'text', text: prompt, text_elements: [] }],
      }).catch((err: Error) => {
        cleanup();
        reject(err);
      });
    });
  }

  async close(): Promise<void> {
    if (this.closed) {
      await this.exitPromise;
      return;
    }
    this.closed = true;

    for (const pending of this.pending.values()) {
      pending.reject(new CodexSessionClosedError());
    }
    this.pending.clear();

    this.rl?.close();
    this.proc.stdin?.end();

    setTimeout(() => {
      if (this.proc.exitCode === null && !this.proc.killed) {
        this.proc.kill('SIGTERM');
      }
    }, 50).unref?.();

    await this.exitPromise;
  }
}
