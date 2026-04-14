import { ConfigError } from "../errors.ts";
import type { AskOptions } from "../types/ask.ts";
import { getEnv } from "./env.ts";

/**
 * Sends a prompt to an LLM via the Poyo API.
 * @param prompt - The user prompt to send
 * @param opts - Options including model, files, stdin, and JSON mode
 * @returns The model response text
 * @throws ConfigError if POYO_API_KEY is not configured
 * @throws Error if no model is specified or the API returns an error
 */
export const askPoyo = async (prompt: string, opts: AskOptions = {}): Promise<string> => {
	const apiKey = getEnv("POYO_API_KEY");
	if (!apiKey) {
		throw new ConfigError("POYO_API_KEY not configured in .env");
	}
	const model = opts.model;
	if (!model) throw new Error("No model specified");

	const messages: Array<{ role: string; content: string }> = [];

	if (opts.json) {
		messages.push({
			role: "system",
			content: "Respond with valid JSON only. No markdown, no explanation, no code fences.",
		});
	}

	if (opts.systemPrompt) {
		messages.push({ role: "system", content: opts.systemPrompt });
	}

	// Message 1: the prompt (intent first)
	messages.push({ role: "user", content: prompt });

	// Message 2: files + stdin as context (if any)
	const contextParts: string[] = [];

	if (opts.files?.length) {
		const fileParts = opts.files.map((f) => `<file path="${f.path}">\n${f.content}\n</file>`).join("\n\n");
		contextParts.push(fileParts);
	}

	if (opts.stdin) {
		contextParts.push(`<stdin>\n${opts.stdin}\n</stdin>`);
	}

	if (contextParts.length > 0) {
		messages.push({ role: "user", content: contextParts.join("\n\n") });
	}

	const res = await fetch("https://api.poyo.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model,
			messages,
			...(opts.json && {
				response_format: opts.jsonSchema
					? { type: "json_schema", json_schema: opts.jsonSchema }
					: { type: "json_object" },
			}),
		}),
		signal: AbortSignal.timeout(60_000),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Poyo API error (${res.status}): ${err}`);
	}

	const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
	if (!data.choices?.[0]?.message?.content) {
		throw new Error("Unexpected Poyo response format");
	}

	return data.choices[0].message.content;
};
