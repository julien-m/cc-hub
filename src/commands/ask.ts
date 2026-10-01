/** Command handler for querying LLMs via OpenRouter or Poyo. */
import { readFile } from "node:fs/promises";
import { Command } from "commander";
import type { ProviderName } from "../data/models.ts";
import { exitCode } from "../errors.ts";
import { resolvePrompt } from "../infra/prompt.ts";
import { Spinner } from "../infra/spinner.ts";
import { getEnv } from "../services/env.ts";
import { loadFileContext } from "../services/files.ts";
import {
	findModel,
	mapReasoningEffortForModel,
	type ReasoningEffort,
	resolveForProvider,
	VALID_REASONING_EFFORTS,
} from "../services/models.ts";
import { askLLM } from "../services/openrouter.ts";
import { askPoyo } from "../services/poyo.ts";

/**
 * Parse a JSON schema from an inline string or a file path.
 * @param value - Inline JSON or path to a .json file.
 * @returns The parsed schema object.
 * @throws {SyntaxError} When the JSON is invalid.
 */
const parseSchema = async (value: string): Promise<Record<string, unknown>> => {
	if (value.trimStart().startsWith("{")) {
		return JSON.parse(value) as Record<string, unknown>;
	}
	const content = await readFile(value, "utf-8");
	return JSON.parse(content) as Record<string, unknown>;
};

/**
 * Create the `ask` command.
 * @returns The configured Commander command.
 */
export const createAskCommand = (): Command =>
	new Command("ask")
		.description("Ask a question to an LLM")
		.argument("[prompt]", "Prompt to send to the model (or pipe via stdin)")
		.option("-m, --model <model>", "Model override (replaces ASK_MODEL)")
		.option(
			"-f, --file <path>",
			"File or glob to include as context (repeatable)",
			(val: string, acc: string[]) => [...acc, val],
			[],
		)
		.option("-p, --provider <name>", "LLM provider (openrouter, poyo)")
		.option("-j, --json", "Request JSON output from the model")
		.option("-s, --schema <json_or_file>", "JSON schema for structured output (inline JSON or path to .json file)")
		.option("-e, --effort <level>", `Reasoning effort level (${VALID_REASONING_EFFORTS.join(", ")})`)
		.action(
			async (
				promptArg: string | undefined,
				opts: { model?: string; file: string[]; provider?: string; json?: boolean; schema?: string; effort?: string },
			) => {
				try {
					const resolved = await resolvePrompt(promptArg);
					const { prompt } = resolved;
					const stdin = resolved.stdin;

					const files = opts.file.length > 0 ? await loadFileContext(opts.file) : [];

					let jsonSchema: Record<string, unknown> | undefined;
					if (opts.schema) {
						jsonSchema = await parseSchema(opts.schema);
					}

					const provider = opts.provider || getEnv("ASK_PROVIDER") || "openrouter";
					if (provider === "copilot") {
						console.error('Use "cc-hub copilot" instead of "cc-hub ask --provider copilot"');
						process.exit(2);
					}
					if (provider === "codex") {
						console.error('Use "cc-hub codex" instead of "cc-hub ask --provider codex"');
						process.exit(2);
					}
					const rawModel = opts.model || getEnv("ASK_MODEL");
					if (!rawModel) {
						console.error("No model specified — use --model <model> or set ASK_MODEL");
						process.exit(2);
					}
					const providerName: ProviderName = provider === "poyo" ? "poyo" : "openrouter";
					// @spec FR-005: Reject decisions on chat route — .specs/features/008-jev-openrouter/spec.md#fr-005
					if (findModel(rawModel)?.type === "decision") {
						console.error(
							"Decision models use typed questions. Use cc-hub decide --input request.json (or cc-hub jev).",
						);
						process.exit(2);
					}
					const model = resolveForProvider(rawModel, providerName);
					const askFn = provider === "poyo" ? askPoyo : askLLM;

					if (opts.effort && !VALID_REASONING_EFFORTS.includes(opts.effort as ReasoningEffort)) {
						console.error(
							`Invalid effort level: ${opts.effort}. Must be one of: ${VALID_REASONING_EFFORTS.join(", ")}`,
						);
						process.exit(2);
					}
					const effort = opts.effort as ReasoningEffort | undefined;
					const openRouterEffort = effort ? mapReasoningEffortForModel(rawModel, effort) : undefined;

					const spinner = new Spinner("waiting...", { elapsed: true }).start();

					try {
						const response = await askFn(prompt, {
							model,
							stdin,
							files: files.length > 0 ? files : undefined,
							json: opts.json || !!jsonSchema,
							jsonSchema,
							effort: openRouterEffort,
						});

						spinner.stop();
						process.stdout.write(response);
						if (!response.endsWith("\n")) process.stdout.write("\n");
					} finally {
						spinner.stop();
					}
				} catch (err) {
					console.error(`Ask command failed: ${(err as Error).message}. Check the model name and API credentials.`);
					process.exit(exitCode(err, 4));
				}
			},
		);
