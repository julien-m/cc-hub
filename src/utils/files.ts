import { Glob } from 'bun';
import { resolve, relative } from 'node:path';

const GLOB_CHARS = /[*?[\]{]/;

/** Resolves file patterns (paths or globs) to deduplicated absolute paths. */
export async function resolveFilePaths(patterns: string[]): Promise<string[]> {
	const seen = new Set<string>();
	const results: string[] = [];

	for (const pattern of patterns) {
		if (GLOB_CHARS.test(pattern)) {
			const glob = new Glob(pattern);
			let matched = false;
			for await (const match of glob.scan({ dot: false, absolute: true })) {
				matched = true;
				const abs = resolve(match);
				if (!seen.has(abs)) {
					seen.add(abs);
					results.push(abs);
				}
			}
			if (!matched) {
				throw new Error(`No files matched glob: ${pattern}`);
			}
		} else {
			const abs = resolve(pattern);
			if (!seen.has(abs)) {
				seen.add(abs);
				results.push(abs);
			}
		}
	}

	return results;
}

/** Reads a file and returns its path + content, or null if binary/directory. */
export async function readFileAsContext(
	filePath: string,
): Promise<{ path: string; content: string } | null> {
	const file = Bun.file(filePath);

	const stat = await file.stat().catch(() => null);
	if (!stat) {
		throw new Error(`File not found: ${filePath}`);
	}
	if (stat.isDirectory()) {
		console.error(`⚠ Skipping directory: ${filePath}`);
		return null;
	}

	const bytes = await file.bytes();
	const sample = bytes.slice(0, 8192);
	if (sample.includes(0)) {
		console.error(`⚠ Skipping binary file: ${filePath}`);
		return null;
	}

	const content = new TextDecoder().decode(bytes);
	const relPath = relative(process.cwd(), filePath);
	return { path: relPath, content };
}

/** Formats file contexts into XML-delimited blocks. */
export function buildFileContext(
	files: Array<{ path: string; content: string }>,
): string {
	return files
		.map((f) => `<file path="${f.path}">\n${f.content}\n</file>`)
		.join('\n\n');
}

/** Rough token estimate (~4 chars per token). */
export function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}
