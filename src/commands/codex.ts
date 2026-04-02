/** Command handler for querying OpenAI Codex CLI. */
import { exitCode } from '../errors.ts';
import { Command } from 'commander';
import { askCodex, reviewCodex, CodexAuthError, CodexNotFoundError } from '../services/codex.ts';
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
    .option('--model <model>', 'Model override (default: gpt-5.4)')
    .option('-f, --file <path>', 'File or glob to include as context (repeatable)', (val: string, acc: string[]) => [...acc, val], [])
    .option('--effort <level>', 'Reasoning effort level (low, medium, high)')
    .option('--sandbox <mode>', 'Sandbox mode (read-only, workspace-write)', 'read-only')
    .option('--schema <path>', 'JSON Schema file for structured output')
    .action(async (promptArg: string | undefined, opts: {
      model?: string;
      file: string[];
      effort?: string;
      sandbox?: string;
      schema?: string;
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
    .option('--model <model>', 'Model override (default: gpt-5.4)')
    .option('--base <ref>', 'Git base reference for review (e.g. main)')
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
  console.error(
    `Codex command failed: ${(err as Error).message}. ` +
    'Check the model name and that codex CLI is installed.',
  );
  process.exit(exitCode(err, 4));
};
