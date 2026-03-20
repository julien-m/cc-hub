import { Command } from 'commander';
import { statSync } from 'node:fs';
import { askCopilot } from '../services/copilot.ts';
import { resolveForProvider } from '../services/models.ts';
import { getEnv } from '../services/env.ts';
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

export function createCopilotCommand(): Command {
	const copilot = new Command('copilot')
		.description('Poser une question via GitHub Copilot CLI')
		.argument('<prompt>', 'Prompt à envoyer au modèle')
		.option('--model <model>', 'Modèle à utiliser (défaut: gpt-4.1)')
		.option('-f, --file <path>', 'File or glob to include as context (repeatable)', collect, [])
		.action(async (prompt: string, opts: {
			model?: string;
			file: string[];
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

				const rawModel = opts.model || getEnv('COPILOT_MODEL') || 'openai/gpt-4.1';
				const nativeModel = resolveForProvider(rawModel, 'copilot');

				const response = await askCopilot(prompt, {
					model: nativeModel,
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

	return copilot;
}
