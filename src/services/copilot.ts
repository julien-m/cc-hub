/**
 * GitHub Copilot CLI integration.
 * Uses `gh copilot` in non-interactive mode for LLM queries.
 * @see https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Auth patterns from `gh copilot` stderr when not logged in or token expired. */
const AUTH_ERROR_PATTERNS: readonly string[] = [
	"not logged in",
	"must authenticate",
	"authentication required",
	"invalid token",
	"token expired",
	"auth login",
	"login is required",
	"could not determine token",
];

/** Thrown when GitHub Copilot CLI requires authentication. */
export class CopilotAuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CopilotAuthError";
	}
}

export interface CopilotOptions {
	model?: string;
	stdin?: string;
	files?: Array<{ path: string; content: string }>;
}

/**
 * Asks GitHub Copilot via the `gh copilot` CLI.
 * @param prompt - The prompt to send
 * @param opts - Options (model, stdin content, file contexts)
 * @returns The model response text
 * @throws CopilotAuthError when GitHub Copilot requires authentication
 * @throws Error when no model is specified or CLI returns an error
 */
export const askCopilot = async (prompt: string, opts: CopilotOptions = {}): Promise<string> => {
	const model = opts.model;
	if (!model) throw new Error("No model specified for Copilot");

	const parts: string[] = [];

	if (opts.files?.length) {
		const { buildFileContext } = await import("./files.ts");
		parts.push(buildFileContext(opts.files));
	}

	if (opts.stdin) {
		parts.push(`<stdin>\n${opts.stdin}\n</stdin>`);
	}

	parts.push(prompt);

	const fullPrompt = parts.join("\n\n");

	const args = ["copilot", "-p", fullPrompt, "-s", "--output-format", "json", "--no-ask-user", "--model", model];

	try {
		const { stdout } = await execFileAsync("gh", args, {
			encoding: "utf-8",
			maxBuffer: 10 * 1024 * 1024,
		});

		return parseJsonlResponse(stdout);
	} catch (error: unknown) {
		const err = error as { stderr?: string; message?: string };
		const message = err.stderr?.trim() || err.message || "Unknown error";
		const lower = message.toLowerCase();
		const isAuthError = AUTH_ERROR_PATTERNS.some((p) => lower.includes(p));
		if (isAuthError) {
			throw new CopilotAuthError(message);
		}
		throw new Error(`Copilot CLI error: ${message}`);
	}
};

/**
 * Parses JSONL output from `gh copilot --output-format json`.
 * Extracts content from `assistant.message` events.
 * @param output - The raw JSONL output string
 * @returns The concatenated response text
 */
const parseJsonlResponse = (output: string): string => {
	const lines = output.trim().split("\n");
	const parts: string[] = [];

	for (const line of lines) {
		if (!line.trim()) continue;
		try {
			const parsed = JSON.parse(line);
			if (parsed.type === "assistant.message" && parsed.data?.content) {
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

	return parts.join("");
};
