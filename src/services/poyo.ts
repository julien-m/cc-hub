import { getEnv } from './env.ts';

interface AskOptions {
	model?: string;
	stdin?: string;
	files?: Array<{ path: string; content: string }>;
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

	const parts: Array<{ text: string }> = [];

	// Intent first
	parts.push({ text: prompt });

	// Files as context
	if (opts.files?.length) {
		const fileParts = opts.files
			.map((f) => `<file path="${f.path}">\n${f.content}\n</file>`)
			.join('\n\n');
		parts.push({ text: fileParts });
	}

	// Stdin as context
	if (opts.stdin) {
		parts.push({ text: `<stdin>\n${opts.stdin}\n</stdin>` });
	}

	const body = {
		contents: [{ role: 'user', parts }],
	};

	const res = await fetch(
		`https://api.poyo.ai/v1beta/models/${model}:generateContent`,
		{
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		},
	);

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Poyo API error (${res.status}): ${err}`);
	}

	const json = await res.json() as {
		code?: number;
		data?: {
			error?: { message?: string };
			candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
		};
	};

	if (json.code !== 200 || json.data?.error) {
		const msg = json.data?.error?.message || `Unexpected status code: ${json.code}`;
		throw new Error(`Poyo API error: ${msg}`);
	}

	const text = json.data?.candidates?.[0]?.content?.parts?.[0]?.text;
	if (!text) {
		throw new Error('Unexpected Poyo response format');
	}

	return text;
}
