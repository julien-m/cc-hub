import { Command } from 'commander';
import { statSync } from 'node:fs';
import { askPoyo } from '../services/poyo.ts';
import {
	resolveFilePaths,
	readFileAsContext,
	estimateTokens,
	buildFileContext,
} from '../utils/files.ts';

const DEFAULT_REVIEW_PROMPT = `Agis comme un reviewer technique exigeant. Analyse les fichiers fournis et produis une revue critique :
- Incohérences internes et entre fichiers
- Lacunes, cas non couverts, hypothèses implicites
- Points faibles architecturaux ou de design
- Suggestions concrètes d'amélioration
Sois direct et constructif. Ne résume pas — challenge.`;

const DEFAULT_MODEL = 'gemini-3-flash-preview';

function collect(val: string, acc: string[]): string[] {
	acc.push(val);
	return acc;
}

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

export function createReviewCommand(): Command {
	const review = new Command('review')
		.description('Obtenir une revue critique de fichiers via Poyo (Gemini)')
		.argument('[prompt]', 'Prompt custom pour orienter la revue')
		.option('-f, --file <path>', 'File, directory, or glob to review (repeatable)', collect, [])
		.option('--model <model>', `Modèle Poyo (défaut: ${DEFAULT_MODEL})`)
		.action(async (prompt: string | undefined, opts: { file: string[]; model?: string }) => {
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
						console.error(`📄 ${files.length} file(s) loaded (~${tokens} tokens)`);
						if (tokens > 25000) {
							console.error(`⚠ Large context:`);
							for (const f of files) {
								console.error(`  ${f.path} (~${estimateTokens(f.content)} tokens)`);
							}
						}
					}
				}

				if (files.length === 0 && !stdin) {
					console.error('❌ Nothing to review. Provide files with -f or pipe content via stdin.');
					process.exit(1);
				}

				const reviewPrompt = prompt || DEFAULT_REVIEW_PROMPT;

				const response = await askPoyo(reviewPrompt, {
					model: opts.model || DEFAULT_MODEL,
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

	return review;
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
