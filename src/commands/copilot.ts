/** Command handler for querying GitHub Copilot CLI. */
import { exitCode } from '../errors.ts';
import { Command } from 'commander';
import { statSync } from 'node:fs';
import { askCopilot, CopilotAuthError } from '../services/copilot.ts';
import { resolveForProvider } from '../services/models.ts';
import { getEnv } from '../services/env.ts';
import { resolvePrompt } from '../infra/prompt.ts';
import { loadFileContext } from '../services/files.ts';

/**
 * Expand directory entries to non-recursive globs so that listing a directory
 * includes its immediate children.
 * @param patterns - File paths or glob patterns.
 * @returns Expanded patterns with directories suffixed by `/*`.
 */
const expandDirectories = (patterns: string[]): string[] =>
  patterns.map((pattern) => {
    try {
      const stat = statSync(pattern);
      if (stat.isDirectory()) {
        const normalized = pattern.endsWith('/') ? pattern : `${pattern}/`;
        return `${normalized}*`;
      }
    } catch {
      // Not a local path or doesn't exist — pass through (could be a glob)
    }
    return pattern;
  });

/**
 * Create the `copilot` command.
 * @returns The configured Commander command.
 */
export const createCopilotCommand = (): Command =>
  new Command('copilot')
    .description('Ask a question via GitHub Copilot CLI')
    .argument('[prompt]', 'Prompt to send to the model (or pipe via stdin)')
    .option('-m, --model <model>', 'Model override (default: gpt-5.4)')
    .option('-f, --file <path>', 'File or glob to include as context (repeatable)', (val: string, acc: string[]) => [...acc, val], [])
    .action(async (promptArg: string | undefined, opts: {
      model?: string;
      file: string[];
    }) => {
      try {
        const resolved = await resolvePrompt(promptArg);
        const { prompt } = resolved;
        const stdin = resolved.stdin;

        const files = opts.file.length > 0
          ? await loadFileContext(expandDirectories(opts.file))
          : [];

        const rawModel = opts.model || getEnv('COPILOT_MODEL') || 'openai/gpt-5.4';
        const nativeModel = resolveForProvider(rawModel, 'copilot');

        const response = await askCopilot(prompt, {
          model: nativeModel,
          stdin,
          files: files.length > 0 ? files : undefined,
        });

        process.stdout.write(response);
        if (!response.endsWith('\n')) process.stdout.write('\n');
      } catch (err) {
        if (err instanceof CopilotAuthError) {
          console.error(
            'GitHub Copilot is not authenticated. Run: gh auth login',
          );
          process.exit(3);
        }
        console.error(
          `Copilot command failed: ${(err as Error).message}. ` +
          'Check the model name and that gh copilot is installed.',
        );
        process.exit(exitCode(err, 4));
      }
    });
