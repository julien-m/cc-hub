/** Commander entry point for typed OpenRouter decisions and scriptable JSON output. */

import { Command } from "commander";
import { AppError, exitCode } from "../errors.ts";
import {
	type DecisionInputOptions,
	type DecisionOutputOptions,
	resolveDecisionInput,
	resolveDecisionTimeout,
	writeDecisionOutput,
} from "../services/decision-input.ts";
import { decide } from "../services/decisions.ts";

interface DecideOptions extends DecisionInputOptions, DecisionOutputOptions {
	timeoutMs: string;
	answersOnly?: boolean;
	dryRun?: boolean;
	json?: boolean;
}

/**
 * Create decide, aliased as jev, with JSON/file/stdin inputs and complete JSON output.
 * @returns Independently parseable command; input failures report code 2 on stderr.
 */
// @spec FR-002: Scriptable decide/jev command — .specs/features/008-jev-openrouter/spec.md#fr-002
// @spec FR-004: Raw JSON and dry run controls — .specs/features/008-jev-openrouter/spec.md#fr-004
export const createDecideCommand = (): Command =>
	new Command("decide")
		.alias("jev")
		.description("Get typed Jev decisions from state and questions (JSON output by default)")
		.argument("[state]", "Raw text state; without state/questions options, stdin is a full JSON request")
		.option("-i, --input <json_or_file>", "Full request JSON, JSON file, or '-' for stdin")
		.option("-s, --state <json_or_file>", "State JSON value or file (quote JSON strings); '-' reads stdin")
		.option("-q, --questions <json_or_file>", "Questions JSON object or file; '-' reads stdin")
		.option("-m, --model <model>", "Model override (default: typesafe/jev-1.13, or request model)")
		.option("-p, --provider <json_or_file>", "Provider routing JSON or file; '-' reads stdin")
		.option("--session-id <id>", "Session identifier override")
		.option("--trace <json_or_file>", "Trace metadata JSON or file; '-' reads stdin")
		.option("--user <id>", "User identifier override")
		.option("--timeout-ms <milliseconds>", "Positive integer API timeout; no automatic retry", "10000")
		.option("-j, --json", "Emit JSON (the default)")
		.option("--answers-only", "Emit only the response answers object")
		.option("--pretty", "Indent JSON output")
		.option("-o, --output <path>", "Write JSON at this exact path and leave stdout empty")
		.option("--dry-run", "Emit the validated effective request without credentials or network")
		.action(async (stateArg: string | undefined, options: DecideOptions) => {
			try {
				const timeoutMs = resolveDecisionTimeout(options.timeoutMs);
				const request = await resolveDecisionInput(stateArg, options);
				if (options.dryRun) {
					await writeDecisionOutput(request, options);
					return;
				}
				const response = await decide(request, { timeoutMs });
				await writeDecisionOutput(options.answersOnly ? response.answers : response, options);
			} catch (error) {
				// Only typed application failures have safe messages; unexpected errors may contain payloads.
				const message =
					error instanceof AppError ? error.message : "Unexpected decision failure. Check the request and retry.";
				console.error(`Decision failed: ${message}`);
				process.exitCode = exitCode(error, 4);
			}
		});
