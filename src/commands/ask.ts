import { Command } from 'commander';
import { askLLM } from '../services/openrouter.ts';
import { askPoyo } from '../services/poyo.ts';
import { getEnv } from '../services/env.ts';
import {
	resolveFilePaths,
	readFileAsContext,
	estimateTokens,
	buildFileContext,
} from '../utils/files.ts';

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
		.action(async (prompt: string, opts: { model?: string; file: string[]; provider?: string }) => {
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

				const provider = opts.provider || getEnv('ASK_PROVIDER') || 'openrouter';
				const askFn = provider === 'poyo' ? askPoyo : askLLM;

				const response = await askFn(prompt, {
					model: opts.model,
					stdin,
					files: files.length > 0 ? files : undefined,
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

function readStdin(): Promise<string> {
	return new Promise((resolve, reject) => {
		let data = '';
		process.stdin.setEncoding('utf-8');
		process.stdin.on('data', (chunk: string) => { data += chunk; });
		process.stdin.on('end', () => resolve(data));
		process.stdin.on('error', reject);
	});
}
