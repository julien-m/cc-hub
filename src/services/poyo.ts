import { getEnv } from './env.ts';

interface AskOptions {
	model?: string;
	stdin?: string;
	files?: Array<{ path: string; content: string }>;
	json?: boolean;
	jsonSchema?: object;
}

export async function askPoyo(prompt: string, opts: AskOptions = {}): Promise<string> {
	const apiKey = getEnv('POYO_API_KEY');
	if (!apiKey) {
		console.error('POYO_API_KEY non configuré dans .env');
		process.exit(3);
	}
	const model = opts.model || getEnv('ASK_MODEL');
	if (!model) {
		console.error('Aucun modèle spécifié — utilise --model <model>');
		process.exit(1);
	}

	const messages: Array<{ role: string; content: string }> = [];

	if (opts.json) {
		messages.push({ role: 'system', content: 'Respond with valid JSON only. No markdown, no explanation, no code fences.' });
	}

	// Message 1: the prompt (intent first)
	messages.push({ role: 'user', content: prompt });

	// Message 2: files + stdin as context (if any)
	const contextParts: string[] = [];

	if (opts.files?.length) {
		const fileParts = opts.files
			.map((f) => `<file path="${f.path}">\n${f.content}\n</file>`)
			.join('\n\n');
		contextParts.push(fileParts);
	}

	if (opts.stdin) {
		contextParts.push(`<stdin>\n${opts.stdin}\n</stdin>`);
	}

	if (contextParts.length > 0) {
		messages.push({ role: 'user', content: contextParts.join('\n\n') });
	}

	const res = await fetch('https://api.poyo.ai/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model,
			messages,
			...(opts.json && {
				response_format: opts.jsonSchema
					? { type: 'json_schema', json_schema: opts.jsonSchema }
					: { type: 'json_object' },
			}),
		}),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Poyo API error (${res.status}): ${err}`);
	}

	const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
	if (!data.choices?.[0]?.message?.content) {
		throw new Error('Unexpected Poyo response format');
	}

	return data.choices[0].message.content;
}
