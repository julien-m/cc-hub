/**
 * GitHub Copilot CLI integration.
 * Uses `gh copilot` in non-interactive mode for LLM queries.
 * @see https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference
 */

import { execFile } from 'node:child_process';
import { getEnv } from './env.ts';

export interface CopilotOptions {
	model?: string;
	stdin?: string;
	files?: Array<{ path: string; content: string }>;
}

const DEFAULT_MODEL = 'gpt-4.1';

/**
 * Asks GitHub Copilot via the `gh copilot` CLI.
 * @param prompt - The prompt to send
 * @param opts - Options (model, stdin content, file contexts)
 * @returns The model response text
 */
export async function askCopilot(prompt: string, opts: CopilotOptions = {}): Promise<string> {
	const model = opts.model || getEnv('COPILOT_MODEL') || DEFAULT_MODEL;

	const parts: string[] = [];

	if (opts.files?.length) {
		const { buildFileContext } = await import('../utils/files.ts');
		parts.push(buildFileContext(opts.files));
	}

	if (opts.stdin) {
		parts.push(`<stdin>\n${opts.stdin}\n</stdin>`);
	}

	parts.push(prompt);

	const fullPrompt = parts.join('\n\n');

	const args = ['copilot', '-p', fullPrompt, '-s', '--output-format', 'json', '--no-ask-user'];

	if (model) {
		args.push('--model', model);
	}

	return new Promise((resolve, reject) => {
		const child = execFile('gh', args, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
			if (error) {
				const message = stderr?.trim() || error.message;
				reject(new Error(`Copilot CLI error: ${message}`));
				return;
			}

			const text = parseJsonlResponse(stdout);
			resolve(text);
		});

		child.stdin?.end();
	});
}

/**
 * Parses JSONL output from `gh copilot --output-format json`.
 * Extracts content from `assistant.message` events.
 */
function parseJsonlResponse(output: string): string {
	const lines = output.trim().split('\n');
	const parts: string[] = [];

	for (const line of lines) {
		if (!line.trim()) continue;
		try {
			const parsed = JSON.parse(line);
			if (parsed.type === 'assistant.message' && parsed.data?.content) {
				parts.push(parsed.data.content);
			}
		} catch {
			// Not JSON — treat as plain text
			parts.push(line);
		}
	}

	if (parts.length === 0) {
		return output.trim();
	}

	return parts.join('');
}
