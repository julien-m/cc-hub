import { Command } from 'commander';
import { statSync } from 'node:fs';
import { askGitHubModels } from '../services/github-models.ts';
import { readStdin } from '../utils/stdin.ts';
import {
	resolveFilePaths,
	readFileAsContext,
	estimateTokens,
	buildFileContext,
} from '../utils/files.ts';

/** Expands directory entries to `dir/*` globs for non-recursive file listing. */
function expandDirectories(patterns: string[]): string[] {
	return patterns.map((pattern) => {
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
}

function collect(val: string, acc: string[]): string[] {
	acc.push(val);
	return acc;
}

function parseNumber(val: string): number {
	const n = Number(val);
	if (Number.isNaN(n)) throw new Error(`Invalid number: ${val}`);
	return n;
}

function parseInt(val: string): number {
	const n = Number.parseInt(val, 10);
	if (Number.isNaN(n)) throw new Error(`Invalid integer: ${val}`);
	return n;
}

export function createCopilotCommand(): Command {
	const copilot = new Command('copilot')
		.description('Poser une question via GitHub Models (Copilot)')
		.argument('<prompt>', 'Prompt à envoyer au modèle')
		.option('--model <model>', 'Modèle à utiliser (défaut: gpt-4.1-mini)')
		.option('-f, --file <path>', 'File or glob to include as context (repeatable)', collect, [])
		.option('--temperature <n>', 'Creativity: 0 = deterministic, 1 = creative (range 0-1)', parseNumber)
		.option('--top-p <n>', 'Nucleus sampling: only consider top N% probable tokens (range 0-1)', parseNumber)
		.option('--max-tokens <n>', 'Maximum number of tokens in the response', parseInt)
		.option('--frequency-penalty <n>', 'Penalize repeated tokens by frequency (range -2 to 2)', parseNumber)
		.option('--presence-penalty <n>', 'Penalize tokens already present, encourages new topics (range -2 to 2)', parseNumber)
		.option('--seed <n>', 'Seed for reproducible outputs (same seed + prompt = same response)', parseInt)
		.option('--stop <seq>', 'Stop sequence — generation stops when produced (repeatable)', collect, [])
		.option('--response-format <json>', 'Response format as JSON: {"type":"json_object"} or {"type":"json_schema","json_schema":{...}}')
		.option('--tool-choice <mode>', 'Tool calling mode: auto, required, none')
		.option('--tools <json>', 'Tools definition as JSON array for function calling')
		.action(async (prompt: string, opts: {
			model?: string;
			file: string[];
			temperature?: number;
			topP?: number;
			maxTokens?: number;
			frequencyPenalty?: number;
			presencePenalty?: number;
			seed?: number;
			stop: string[];
			responseFormat?: string;
			toolChoice?: string;
			tools?: string;
		}) => {
			try {
				let stdin: string | undefined;
				if (!process.stdin.isTTY) {
					stdin = await readStdin();
				}

				const files: Array<{ path: string; content: string }> = [];

				if (opts.file.length > 0) {
					const expanded = expandDirectories(opts.file);
					const resolved = await resolveFilePaths(expanded);

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

				let responseFormat: object | undefined;
				if (opts.responseFormat) {
					try {
						responseFormat = JSON.parse(opts.responseFormat);
					} catch {
						throw new Error('Invalid JSON for --response-format');
					}
				}

				let tools: object[] | undefined;
				if (opts.tools) {
					try {
						tools = JSON.parse(opts.tools);
					} catch {
						throw new Error('Invalid JSON for --tools');
					}
				}

				const response = await askGitHubModels(prompt, {
					model: opts.model,
					stdin,
					files: files.length > 0 ? files : undefined,
					temperature: opts.temperature,
					topP: opts.topP,
					maxTokens: opts.maxTokens,
					frequencyPenalty: opts.frequencyPenalty,
					presencePenalty: opts.presencePenalty,
					seed: opts.seed,
					stop: opts.stop.length > 0 ? opts.stop : undefined,
					responseFormat,
					tools,
					toolChoice: opts.toolChoice,
				});

				process.stdout.write(response);
				if (!response.endsWith('\n')) process.stdout.write('\n');
			} catch (err) {
				console.error(`❌ ${(err as Error).message}`);
				process.exit(4);
			}
		});

	return copilot;
}
