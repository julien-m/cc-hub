/** Command handler for querying OpenAI Codex CLI. */
import readline from 'node:readline';
import { exitCode } from '../errors.ts';
import { Command } from 'commander';
import { askCodex, reviewCodex, CodexAuthError, CodexNotFoundError } from '../services/codex.ts';
import { CodexSession, CodexTimeoutError, CodexSessionError } from '../services/codex-session.ts';
import { resolveForProvider } from '../services/models.ts';
import { getEnv } from '../services/env.ts';
import { resolvePrompt } from '../infra/prompt.ts';
import { loadFileContext } from '../services/files.ts';
import { Spinner } from '../infra/spinner.ts';

/**
 * Create the `codex` command.
 * @returns The configured Commander command.
 */
export const createCodexCommand = (): Command => {
  const cmd = new Command('codex')
    .description('Ask a question or run a review via OpenAI Codex CLI')
    .argument('[prompt]', 'Prompt to send to the model (or pipe via stdin)')
    .option('-m, --model <model>', 'Model override (default: gpt-5.4)')
    .option('-f, --file <path>', 'File or glob to include as context (repeatable)', (val: string, acc: string[]) => [...acc, val], [])
    .option('-e, --effort <level>', 'Reasoning effort level (low, medium, high)')
    .option('-s, --sandbox <mode>', 'Sandbox mode (read-only, workspace-write)', 'read-only')
    .option('-x, --schema <path>', 'JSON Schema file for structured output')
    .option('-i, --interactive', 'Machine-readable interactive session (JSON lines on stdout). One prompt per stdin line, one {"response":"..."} per stdout line. For scripts and AI agents only.')
    .option('-p, --persist', 'Keep thread history across turns (ephemeral: false)')
    .action(async (promptArg: string | undefined, opts: {
      model?: string;
      file: string[];
      effort?: string;
      sandbox?: string;
      schema?: string;
      interactive?: boolean;
      persist?: boolean;
    }) => {
      try {
        const validEfforts = ['low', 'medium', 'high'];
        if (opts.effort && !validEfforts.includes(opts.effort)) {
          console.error(`Invalid effort level: ${opts.effort}. Must be one of: low, medium, high`);
          process.exit(2);
        }
        const validSandboxes = ['read-only', 'workspace-write'];
        if (!validSandboxes.includes(opts.sandbox!)) {
          console.error(`Invalid sandbox mode: ${opts.sandbox}. Must be one of: read-only, workspace-write`);
          process.exit(2);
        }

        // ── Interactive mode ─────────────────────────────────────────────
        // Machine-readable JSON-lines protocol. Never used by humans directly.
        // stdout: {"ready":true} at startup, {"response":"..."} per turn, {"error":"..."} on failure.
        if (opts.interactive) {
          if (opts.schema) {
            console.error('Error: --schema is not compatible with --interactive');
            process.exit(2);
          }

          const rawModel = opts.model || getEnv('CODEX_MODEL') || 'openai/gpt-5.4';
          const nativeModel = resolveForProvider(rawModel, 'codex');

          const session = await (async (): Promise<CodexSession> => {
            try {
              return await CodexSession.create(process.cwd(), {
                model: nativeModel,
                sandbox: (opts.sandbox ?? 'read-only') as 'read-only' | 'workspace-write',
                persist: opts.persist,
              });
            } catch (err) {
              return handleError(err);
            }
          })();

          // Signal readiness — consumer waits for this before sending first prompt
          process.stdout.write('{"ready":true}\n');

          // Process initial prompt arg if provided
          if (promptArg) {
            try {
              const response = await session.ask(promptArg);
              process.stdout.write(JSON.stringify({ response }) + '\n');
            } catch (err) {
              process.stdout.write(JSON.stringify({ error: (err as Error).message }) + '\n');
              await session.close();
              process.exit(exitCode(err, 1));
            }
          }

          // for-await-of is sequential: reads one line, awaits body, then reads next
          const rl = readline.createInterface({ input: process.stdin, output: undefined });

          const sigintHandler = () => { rl.close(); };
          process.once('SIGINT', sigintHandler);

          try {
            // Note: SIGINT closes readline but an in-flight session.ask() continues until
            // the turn completes. CodexSession has no abort — pre-existing limitation.
            // The controlling process should send SIGTERM/SIGKILL for immediate termination.
            for await (const line of rl) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              if (['exit', 'quit', 'q'].includes(trimmed.toLowerCase())) break;
              try {
                const response = await session.ask(trimmed);
                process.stdout.write(JSON.stringify({ response }) + '\n');
              } catch (err) {
                process.stdout.write(JSON.stringify({ error: (err as Error).message }) + '\n');
                break;
              }
            }
          } finally {
            process.removeListener('SIGINT', sigintHandler);
            rl.close(); // idempotent — safe if already closed by sigintHandler
            await session.close();
          }

          return;
        }
        // ── End interactive mode ──────────────────────────────────────────

        const resolved = await resolvePrompt(promptArg);
        const { prompt } = resolved;
        const stdin = resolved.stdin;

        const files = opts.file.length > 0
          ? await loadFileContext(opts.file)
          : [];

        const rawModel = opts.model || getEnv('CODEX_MODEL') || 'openai/gpt-5.4';
        const nativeModel = resolveForProvider(rawModel, 'codex');

        const spinner = new Spinner('waiting...', { elapsed: true }).start();

        try {
          const response = await askCodex(prompt, {
            model: nativeModel,
            stdin,
            files: files.length > 0 ? files : undefined,
            effort: opts.effort,
            sandbox: opts.sandbox,
            schema: opts.schema,
          });

          spinner.stop();
          process.stdout.write(response);
          if (!response.endsWith('\n')) process.stdout.write('\n');
        } finally {
          spinner.stop();
        }
      } catch (err) {
        handleError(err);
      }
    });

  cmd
    .command('review')
    .description('Run a code review on the current repository')
    .option('-m, --model <model>', 'Model override (default: gpt-5.4)')
    .option('-b, --base <ref>', 'Git base reference for review (e.g. main)')
    .action(async (opts: { model?: string; base?: string }) => {
      try {
        const rawModel = opts.model || getEnv('CODEX_MODEL') || 'openai/gpt-5.4';
        const nativeModel = resolveForProvider(rawModel, 'codex');

        const spinner = new Spinner('reviewing...', { elapsed: true }).start();

        try {
          const response = await reviewCodex({
            model: nativeModel,
            base: opts.base,
          });

          spinner.stop();
          process.stdout.write(response);
          if (!response.endsWith('\n')) process.stdout.write('\n');
        } finally {
          spinner.stop();
        }
      } catch (err) {
        handleError(err);
      }
    });

  return cmd;
};

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
    console.error(`Codex session timed out: ${err.message}`);
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
