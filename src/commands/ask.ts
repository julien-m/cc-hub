import { readFile } from 'node:fs/promises';
import { Command } from 'commander';
import { askLLM } from '../services/openrouter.ts';
import { askPoyo } from '../services/poyo.ts';
import { getEnv } from '../services/env.ts';
import { resolveForProvider } from '../services/models.ts';
import type { ProviderName } from '../data/models.ts';
import { readStdin } from '../utils/stdin.ts';
import {
	resolveFilePaths,
	readFileAsContext,
	estimateTokens,
	buildFileContext,
} from '../utils/files.ts';

async function parseSchema(value: string): Promise<object> {
	if (value.trimStart().startsWith('{')) {
		return JSON.parse(value) as object;
	}
	const content = await readFile(value, 'utf-8');
	return JSON.parse(content) as object;
}

function collect(val: string, acc: string[]): string[] {
	acc.push(val);
	return acc;
}

export function createAskCommand(): Command {
	const ask = new Command('ask')
		.description('Poser une question à un LLM')
		.argument('<prompt>', 'Prompt à envoyer au modèle')
		.option('--model <model>', 'Modèle à utiliser (surcharge ASK_MODEL)')
		.option('-f, --file <path>', 'File or glob to include as context (repeatable)', collect, [])
		.option('--provider <name>', 'LLM provider (openrouter, poyo)')
		.option('--json', 'Request JSON output from the model')
		.option('--schema <json_or_file>', 'JSON schema for structured output (inline JSON or path to .json file)')
		.action(async (prompt: string, opts: { model?: string; file: string[]; provider?: string; json?: boolean; schema?: string }) => {
			try {
				let stdin: string | undefined;
				if (!process.stdin.isTTY) {
					stdin = await readStdin();
				}

				const files: Array<{ path: string; content: string }> = [];

				if (opts.file.length > 0) {
					const resolved = await resolveFilePaths(opts.file);

					for (const filePath of resolved) {
						const ctx = await readFileAsContext(filePath);
						if (ctx) files.push(ctx);
					}

					if (files.length > 0) {
						const totalContent = buildFileContext(files);
						const tokens = estimateTokens(totalContent);
						if (tokens > 25000) {
							console.error(`⚠ Large context (~${tokens} tokens estimated):`);
							for (const f of files) {
								console.error(`  ${f.path} (~${estimateTokens(f.content)} tokens)`);
							}
						}
					}
				}

				let jsonSchema: object | undefined;
				if (opts.schema) {
					jsonSchema = await parseSchema(opts.schema);
				}

				const provider = opts.provider || getEnv('ASK_PROVIDER') || 'openrouter';
				const rawModel = opts.model || getEnv('ASK_MODEL');
				if (!rawModel) {
					console.error('No model specified — use --model <model> or set ASK_MODEL');
					process.exit(1);
				}
				const providerName: ProviderName = provider === 'poyo' ? 'poyo' : 'openrouter';
				const model = resolveForProvider(rawModel, providerName);
				const askFn = provider === 'poyo' ? askPoyo : askLLM;

				const response = await askFn(prompt, {
					model,
					stdin,
					files: files.length > 0 ? files : undefined,
					json: opts.json || !!jsonSchema,
					jsonSchema,
				});

				process.stdout.write(response);
				if (!response.endsWith('\n')) process.stdout.write('\n');
			} catch (err) {
				console.error(`❌ ${(err as Error).message}`);
				process.exit(4);
			}
		});

	return ask;
}
