/** Command handler for querying LLMs via OpenRouter or Poyo. */
import { readFile } from 'node:fs/promises';
import { Command } from 'commander';
import { askLLM } from '../services/openrouter.ts';
import { askPoyo } from '../services/poyo.ts';
import { getEnv } from '../services/env.ts';
import { resolveForProvider } from '../services/models.ts';
import type { ProviderName } from '../data/models.ts';
import { resolvePrompt } from '../infra/prompt.ts';
import { loadFileContext } from '../services/files.ts';
import { exitCode } from '../errors.ts';

/**
 * Parse a JSON schema from an inline string or a file path.
 * @param value - Inline JSON or path to a .json file.
 * @returns The parsed schema object.
 * @throws {SyntaxError} When the JSON is invalid.
 */
const parseSchema = async (value: string): Promise<Record<string, unknown>> => {
  if (value.trimStart().startsWith('{')) {
    return JSON.parse(value) as Record<string, unknown>;
  }
  const content = await readFile(value, 'utf-8');
  return JSON.parse(content) as Record<string, unknown>;
};

/**
 * Create the `ask` command.
 * @returns The configured Commander command.
 */
export const createAskCommand = (): Command =>
  new Command('ask')
    .description('Ask a question to an LLM')
    .argument('[prompt]', 'Prompt to send to the model (or pipe via stdin)')
    .option('--model <model>', 'Model override (replaces ASK_MODEL)')
    .option('-f, --file <path>', 'File or glob to include as context (repeatable)', (val: string, acc: string[]) => [...acc, val], [])
    .option('--provider <name>', 'LLM provider (openrouter, poyo)')
    .option('--json', 'Request JSON output from the model')
    .option('--schema <json_or_file>', 'JSON schema for structured output (inline JSON or path to .json file)')
    .option('--effort <level>', 'Reasoning effort level (low, medium, high)')
    .action(async (promptArg: string | undefined, opts: { model?: string; file: string[]; provider?: string; json?: boolean; schema?: string; effort?: string }) => {
      try {
        const resolved = await resolvePrompt(promptArg);
        const { prompt } = resolved;
        const stdin = resolved.stdin;

        const files = opts.file.length > 0
          ? await loadFileContext(opts.file)
          : [];

        let jsonSchema: Record<string, unknown> | undefined;
        if (opts.schema) {
          jsonSchema = await parseSchema(opts.schema);
        }

        const provider = opts.provider || getEnv('ASK_PROVIDER') || 'openrouter';
        const rawModel = opts.model || getEnv('ASK_MODEL');
        if (!rawModel) {
          console.error('No model specified — use --model <model> or set ASK_MODEL');
          process.exit(2);
        }
        const providerName: ProviderName = provider === 'poyo' ? 'poyo' : 'openrouter';
        const model = resolveForProvider(rawModel, providerName);
        const askFn = provider === 'poyo' ? askPoyo : askLLM;

        const effort = opts.effort as 'low' | 'medium' | 'high' | undefined;

        let seconds = 0;
        const heartbeat = setInterval(() => {
          seconds++;
          process.stderr.write(`[cc-hub] waiting... ${seconds}s\n`);
        }, 1000);

        try {
          const response = await askFn(prompt, {
            model,
            stdin,
            files: files.length > 0 ? files : undefined,
            json: opts.json || !!jsonSchema,
            jsonSchema,
            effort,
          });

          process.stdout.write(response);
          if (!response.endsWith('\n')) process.stdout.write('\n');
        } finally {
          clearInterval(heartbeat);
        }
      } catch (err) {
        console.error(
          `Ask command failed: ${(err as Error).message}. ` +
          'Check the model name and API credentials.',
        );
        process.exit(exitCode(err, 4));
      }
    });
