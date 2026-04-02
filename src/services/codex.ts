/**
 * Codex CLI integration.
 * Uses `codex exec` in non-interactive mode for LLM queries and code reviews.
 * @see https://developers.openai.com/codex/noninteractive
 */

import { spawn } from 'node:child_process';

/** Auth patterns from `codex` stderr when not logged in or token expired. */
const AUTH_ERROR_PATTERNS: readonly string[] = [
  'not logged in',
  'authentication required',
  'invalid token',
  'token expired',
  'codex login',
  'login is required',
  'unauthorized',
  'api key',
];

/** Thrown when Codex CLI requires authentication. */
export class CodexAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodexAuthError';
  }
}

/** Thrown when Codex CLI binary is not found. */
export class CodexNotFoundError extends Error {
  constructor() {
    super('Codex CLI not found. Install it from https://developers.openai.com/codex');
    this.name = 'CodexNotFoundError';
  }
}

export interface CodexOptions {
  model?: string;
  stdin?: string;
  files?: Array<{ path: string; content: string }>;
  effort?: string;
  sandbox?: string;
  schema?: string;
}

/**
 * Run a task via `codex exec`.
 * @param prompt - The prompt to send.
 * @param opts - Options (model, stdin content, file contexts, effort, sandbox).
 * @returns The model response text.
 * @throws CodexAuthError when Codex requires authentication.
 * @throws CodexNotFoundError when the codex binary is not installed.
 * @throws Error when CLI returns an error.
 */
export const askCodex = async (prompt: string, opts: CodexOptions = {}): Promise<string> => {
  const parts: string[] = [];

  if (opts.files?.length) {
    const { buildFileContext } = await import('./files.ts');
    parts.push(buildFileContext(opts.files));
  }

  if (opts.stdin) {
    parts.push(`<stdin>\n${opts.stdin}\n</stdin>`);
  }

  parts.push(prompt);

  const fullPrompt = parts.join('\n\n');

  const args = ['exec', '-', '--ephemeral', '-s', opts.sandbox || 'read-only'];

  if (opts.model) {
    args.push('-m', opts.model);
  }

  if (opts.effort) {
    args.push('-c', `reasoning.effort=${opts.effort}`);
  }

  if (opts.schema) {
    args.push('--output-schema', opts.schema);
  }

  return runCodex(args, fullPrompt);
};

/**
 * Run a code review via `codex exec review`.
 * @param opts - Review options (model, base branch).
 * @returns The review text.
 * @throws CodexAuthError when Codex requires authentication.
 * @throws CodexNotFoundError when the codex binary is not installed.
 * @throws Error when CLI returns an error.
 */
export const reviewCodex = async (opts: { model?: string; base?: string } = {}): Promise<string> => {
  const args = ['exec', 'review', '--ephemeral', '-s', 'read-only'];

  if (opts.model) {
    args.push('-m', opts.model);
  }

  if (opts.base) {
    args.push('--base', opts.base);
  }

  return runCodex(args);
};

/**
 * Spawn `codex` with the given args and return stdout.
 * Passes prompt via stdin when provided (avoids OS argv length limits).
 * @param args - Arguments to pass to the codex binary.
 * @param stdinPayload - Optional data to write to stdin before closing.
 * @returns The stdout output.
 * @throws CodexNotFoundError when the binary is not found.
 * @throws CodexAuthError when authentication is required.
 * @throws Error for all other errors.
 */
const runCodex = (args: string[], stdinPayload?: string): Promise<string> =>
  new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const child = spawn('codex', args, {
      stdio: [stdinPayload ? 'pipe' : 'ignore', 'pipe', 'pipe'],
    });

    child.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        reject(new CodexNotFoundError());
      } else {
        reject(err);
      }
    });

    if (stdinPayload && child.stdin) {
      child.stdin.write(stdinPayload);
      child.stdin.end();
    }

    child.stdout!.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr!.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.replace(/\n+$/, ''));
      } else {
        const message = stderr.trim() || `codex exited with code ${code}`;
        const lower = message.toLowerCase();
        const isAuthError = AUTH_ERROR_PATTERNS.some((p) => lower.includes(p));
        if (isAuthError) {
          reject(new CodexAuthError(message));
        } else {
          reject(new Error(`Codex CLI error: ${message}`));
        }
      }
    });
  });

