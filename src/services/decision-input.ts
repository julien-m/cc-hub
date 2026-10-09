/** JSON/file/stdin input and output boundaries for decision commands. */

import { readFile, writeFile } from "node:fs/promises";
import { AppError } from "../errors.ts";
import type { DecisionRequest } from "../types/decisions.ts";
import { DEFAULT_DECISION_MODEL, validateDecisionRequest } from "./decisions.ts";

/** Explicit CLI overrides; JSON sources accept inline JSON, a file, or stdin (-). */
export interface DecisionInputOptions {
	input?: string;
	state?: string;
	questions?: string;
	model?: string;
	provider?: string;
	sessionId?: string;
	trace?: string;
	user?: string;
}

/** JSON output controls shared by dry runs and successful responses. */
export interface DecisionOutputOptions {
	pretty?: boolean;
	output?: string;
}

const parseJson = (source: string, label: string): unknown => {
	try {
		return JSON.parse(source);
	} catch {
		throw new AppError(`Invalid JSON for ${label}. Provide valid JSON without comments.`, 2);
	}
};

const readJsonSource = async (source: string, label: string): Promise<unknown> => {
	try {
		return JSON.parse(source);
	} catch {
		// Valid JSON strings must be quoted; unquoted values are treated as file paths.
		let contents: string;
		try {
			contents = await readFile(source, "utf8");
		} catch {
			throw new AppError(`Cannot read ${label}. Provide inline JSON or a readable JSON file.`, 2);
		}
		return parseJson(contents, label);
	}
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Resolve a full request or state/questions sources, then validate explicit overrides.
 * Reads stdin only when needed and rejects competing consumers before consuming it.
 * @param stateArg - Optional raw text state; JSON state uses --state instead.
 * @param options - CLI sources and metadata overrides.
 * @returns The effective validated request, including extension fields.
 * @throws {AppError} For missing, ambiguous, unreadable, or invalid input (code 2).
 */
// @spec FR-002: Explicit body default model precedence — .specs/features/009-decision-models/spec.md#fr-002
// @spec FR-003: Preserve full native input envelope — .specs/features/009-decision-models/spec.md#fr-003
// @spec FR-002: Full request, sources and overrides — .specs/features/008-jev-openrouter/spec.md#fr-002
export const resolveDecisionInput = async (
	stateArg: string | undefined,
	options: Readonly<DecisionInputOptions>,
): Promise<DecisionRequest> => {
	if (stateArg !== undefined && options.state !== undefined) {
		throw new AppError("Choose positional text state or --state JSON, not both.", 2);
	}
	const jsonSources = [options.input, options.state, options.questions, options.provider, options.trace];
	const stdinSources = jsonSources.filter((source) => source === "-").length;
	const implicitBody =
		options.input === undefined &&
		stateArg === undefined &&
		options.state === undefined &&
		options.questions === undefined;
	const implicitTextState =
		options.input === undefined &&
		stateArg === undefined &&
		options.state === undefined &&
		options.questions !== undefined;
	if (stdinSources > 1 || (stdinSources > 0 && (implicitBody || implicitTextState))) {
		throw new AppError(
			"Stdin has competing inputs. Use '-' for only one source and files or inline JSON for others.",
			2,
		);
	}
	let stdinConsumed = false;
	const consumeStdin = async (label: string): Promise<string> => {
		if (stdinConsumed) {
			throw new AppError("Stdin has competing inputs. Provide the missing state or JSON source explicitly.", 2);
		}
		// Terminal input must fail immediately; only a noninteractive pipe can supply data.
		if (process.stdin.isTTY) {
			throw new AppError(`No ${label} provided. Pass --input JSON, state/questions options, or pipe input.`, 2);
		}
		stdinConsumed = true;
		let contents = "";
		try {
			process.stdin.setEncoding("utf8");
			for await (const chunk of process.stdin) {
				contents += chunk;
			}
		} catch {
			throw new AppError("Cannot read stdin. Provide a readable JSON file or inline input.", 2);
		}
		if (!contents.trim()) {
			throw new AppError("Stdin is empty. Provide a nonempty request or state.", 2);
		}
		return contents;
	};
	const readSource = async (source: string, label: string): Promise<unknown> =>
		source === "-" ? parseJson(await consumeStdin(label), label) : readJsonSource(source, label);

	let body: unknown = {};
	if (options.input !== undefined) {
		body = await readSource(options.input, "--input");
	} else if (implicitBody) {
		body = parseJson(await consumeStdin("request"), "stdin request");
	}
	if (!isRecord(body)) {
		throw new AppError("The decision request must be a JSON object containing state and questions.", 2);
	}
	const request: Record<string, unknown> = { ...body };
	if (stateArg !== undefined) request.state = stateArg;
	if (options.state !== undefined) request.state = await readSource(options.state, "--state");
	if (options.questions !== undefined) request.questions = await readSource(options.questions, "--questions");
	if (request.state === undefined && options.questions !== undefined) {
		request.state = await consumeStdin("state");
	}
	if (options.provider !== undefined) request.provider = await readSource(options.provider, "--provider");
	if (options.trace !== undefined) request.trace = await readSource(options.trace, "--trace");
	if (options.sessionId !== undefined) request.session_id = options.sessionId;
	if (options.user !== undefined) request.user = options.user;
	request.model = options.model ?? (request.model === undefined ? DEFAULT_DECISION_MODEL : request.model);
	return validateDecisionRequest(request);
};

/**
 * Validate the CLI timeout before any stdin or credential access.
 * @param value - Positive decimal integer milliseconds, defaulting to 10000.
 * @returns A finite, positive, safe integer timeout.
 * @throws {AppError} For an invalid timeout (code 2).
 */
export const resolveDecisionTimeout = (value = "10000"): number => {
	const timeoutMs = Number(value);
	if (!/^\d+$/.test(value) || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647) {
		throw new AppError("--timeout-ms must be a positive integer in milliseconds (maximum 2147483647).", 2);
	}
	return timeoutMs;
};

/**
 * Emit one JSON document to stdout or write the exact requested file path.
 * @param value - Validated request or response data to serialize.
 * @param options - Optional indentation and output destination.
 * @throws {AppError} When the output file cannot be written (code 2).
 */
// @spec FR-004: Complete JSON or exact file output — .specs/features/008-jev-openrouter/spec.md#fr-004
export const writeDecisionOutput = async (value: unknown, options: Readonly<DecisionOutputOptions>): Promise<void> => {
	const json = `${JSON.stringify(value, null, options.pretty ? 2 : undefined)}\n`;
	if (options.output !== undefined) {
		try {
			await writeFile(options.output, json, "utf8");
		} catch {
			throw new AppError("Cannot write decision output. Check the output path and directory permissions.", 2);
		}
		return;
	}
	process.stdout.write(json);
};
