import { execFileSync } from 'node:child_process';
import { getEnv } from './env.ts';

export interface AskOptions {
	model?: string;
	stdin?: string;
	files?: Array<{ path: string; content: string }>;
	temperature?: number;
	topP?: number;
	maxTokens?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
	seed?: number;
	stop?: string[];
	stream?: boolean;
	responseFormat?: object;
	tools?: object[];
	toolChoice?: string;
}

const DEFAULT_MODEL = 'gpt-4.1-mini';

/** Retrieves a GitHub token via `gh auth token`. */
function getGitHubToken(): string {
	try {
		return execFileSync('gh', ['auth', 'token'], { encoding: 'utf-8' }).trim();
	} catch {
		throw new Error('Failed to get GitHub token via `gh auth token`. Run `gh auth login` first.');
	}
}

export async function askGitHubModels(prompt: string, opts: AskOptions = {}): Promise<string> {
	const token = getGitHubToken();

	const model = opts.model || getEnv('COPILOT_MODEL') || DEFAULT_MODEL;

	const messages: Array<{ role: string; content: string }> = [];

	messages.push({ role: 'user', content: prompt });

	const contextParts: string[] = [];

	if (opts.files?.length) {
		const { buildFileContext } = await import('../utils/files.ts');
		contextParts.push(buildFileContext(opts.files));
	}

	if (opts.stdin) {
		contextParts.push(`<stdin>\n${opts.stdin}\n</stdin>`);
	}

	if (contextParts.length > 0) {
		messages.push({ role: 'user', content: contextParts.join('\n\n') });
	}

	const body: Record<string, unknown> = { model, messages };

	if (opts.temperature !== undefined) body.temperature = opts.temperature;
	if (opts.topP !== undefined) body.top_p = opts.topP;
	if (opts.maxTokens !== undefined) body.max_tokens = opts.maxTokens;
	if (opts.frequencyPenalty !== undefined) body.frequency_penalty = opts.frequencyPenalty;
	if (opts.presencePenalty !== undefined) body.presence_penalty = opts.presencePenalty;
	if (opts.seed !== undefined) body.seed = opts.seed;
	if (opts.stop?.length) body.stop = opts.stop;
	if (opts.stream !== undefined) body.stream = opts.stream;
	if (opts.responseFormat) body.response_format = opts.responseFormat;
	if (opts.tools?.length) body.tools = opts.tools;
	if (opts.toolChoice) body.tool_choice = opts.toolChoice;

	const res = await fetch('https://models.github.ai/inference/chat/completions', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
			'Accept': 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2026-03-10',
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`GitHub Models API error (${res.status}): ${err}`);
	}

	const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
	if (!data.choices?.[0]?.message?.content) {
		throw new Error('Unexpected GitHub Models response format');
	}

	return data.choices[0].message.content;
}
