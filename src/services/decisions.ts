/** Validated, bounded transport for OpenRouter alpha Decisions without retries. */
import { AppError, ConfigError, NetworkError } from "../errors.ts";
import type { DecisionRequest, DecisionResponse } from "../types/decisions.ts";
import { getEnv } from "./env.ts";
import { findByProviderName, findModel } from "./models.ts";

/** Pinned Jev default; requests may explicitly select another decision model. */
export const DEFAULT_DECISION_MODEL = "typesafe/jev-1.13";

/** Optional transport dependencies allow isolated tests without global mocks. */
export interface DecisionOptions {
	timeoutMs?: number;
	fetch?: (url: string, init: RequestInit) => Promise<Response>;
	getConfig?: (key: string) => string | undefined;
}

type ObjectValue = Record<string, unknown>;
const isObject = (value: unknown): value is ObjectValue =>
	typeof value === "object" && value !== null && !Array.isArray(value);
const has = (value: ObjectValue, key: string): boolean => Object.hasOwn(value, key);
const isGuidance = (value: unknown): boolean => typeof value === "string" || isObject(value) || Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isProbability = (value: unknown): boolean => isFiniteNumber(value) && value >= 0 && value <= 1;

// Reject values JSON.stringify would drop/coerce, including cyclic or non-plain objects.
const isJson = (value: unknown, ancestors = new Set<object>()): boolean => {
	if (value === null || typeof value === "string" || typeof value === "boolean") return true;
	if (typeof value === "number") return Number.isFinite(value);
	if (typeof value !== "object" || ancestors.has(value)) return false;
	if (
		!Array.isArray(value) &&
		Object.getPrototypeOf(value) !== Object.prototype &&
		Object.getPrototypeOf(value) !== null
	) {
		return false;
	}
	if (Object.getOwnPropertySymbols(value).length > 0) return false;
	if (Array.isArray(value) && Object.keys(value).length !== value.length) return false;
	ancestors.add(value);
	const valid = Object.values(value).every((child) => isJson(child, ancestors));
	ancestors.delete(value);
	return valid;
};

function inputError(message: string): never {
	throw new AppError(`Invalid decision request: ${message}`, 2);
}
const requireInput = (condition: boolean, message: string): void => {
	if (!condition) inputError(message);
};
const validateProvider = (value: unknown): void => {
	if (value === null) return;
	if (!isObject(value)) inputError("provider must be an object or null.");
	for (const key of ["allow_fallbacks", "require_parameters", "zdr", "enforce_distillable_text"]) {
		if (has(value, key))
			requireInput(value[key] === null || typeof value[key] === "boolean", `provider.${key} must be boolean or null.`);
	}
	if (has(value, "data_collection")) {
		requireInput(
			value.data_collection === null || typeof value.data_collection === "string",
			"provider.data_collection must be a string or null.",
		);
	}
	for (const key of ["order", "only", "ignore", "quantizations"]) {
		if (has(value, key)) {
			const list = value[key];
			requireInput(
				list === null || (Array.isArray(list) && list.every((item) => typeof item === "string")),
				`provider.${key} must be a string array or null.`,
			);
		}
	}
	if (has(value, "max_price")) {
		const price = value.max_price;
		if (!isObject(price)) inputError("provider.max_price must be an object.");
		for (const key of ["prompt", "completion", "image", "audio", "request"]) {
			if (has(price, key)) requireInput(typeof price[key] === "string", `provider.max_price.${key} must be a string.`);
		}
	}
	for (const key of ["preferred_min_throughput", "preferred_max_latency"]) {
		const cutoff = value[key];
		if (!has(value, key) || cutoff === null || isFiniteNumber(cutoff)) continue;
		if (!isObject(cutoff)) inputError(`provider.${key} must be a number, percentile object or null.`);
		for (const percentile of ["p50", "p75", "p90", "p99"]) {
			if (has(cutoff, percentile))
				requireInput(
					cutoff[percentile] === null || isFiniteNumber(cutoff[percentile]),
					`provider.${key} percentiles must be numbers or null.`,
				);
		}
	}
	if (has(value, "sort") && value.sort !== null && typeof value.sort !== "string") {
		const sort = value.sort;
		if (!isObject(sort)) inputError("provider.sort must be a string, object or null.");
		for (const key of ["by", "partition"]) {
			if (has(sort, key))
				requireInput(
					sort[key] === null || typeof sort[key] === "string",
					`provider.sort.${key} must be a string or null.`,
				);
		}
	}
	if (has(value, "options")) {
		requireInput(
			isObject(value.options) && Object.values(value.options).every(isObject),
			"provider.options must map provider names to objects.",
		);
	}
};

// @spec FR-003: Validate before auth and HTTP — .specs/features/008-jev-openrouter/spec.md#fr-003
/**
 * Validates documented request fields without dropping JSON extensions or performing I/O.
 * @param value Untrusted parsed request envelope.
 * @returns The same envelope, narrowed to complete typed decision input.
 * @throws {AppError} Invalid JSON, model, questions or metadata (exit code 2).
 */
export const validateDecisionRequest = (value: unknown): DecisionRequest => {
	if (!isObject(value)) inputError("the envelope must be an object.");
	let jsonValid = false;
	try {
		jsonValid = isJson(value);
	} catch {
		/* Excessively nested JSON is rejected safely. */
	}
	requireInput(jsonValid, "all fields must contain finite, acyclic JSON data.");
	requireInput(typeof value.model === "string" && value.model.trim().length > 0, "model must be a nonempty string.");
	if (typeof value.model === "string") {
		const known = findModel(value.model) ?? findByProviderName("openrouter", value.model);
		if (known && known.type !== "decision")
			inputError("the selected model does not support decisions; use a decision model or cc-hub ask for text models.");
	}
	requireInput(isGuidance(value.state), "state must be a string, object or array.");
	const questions = value.questions;
	if (!isObject(questions) || Object.keys(questions).length === 0) inputError("questions must be a nonempty object.");
	for (const question of Object.values(questions)) {
		if (!isObject(question)) inputError("each question must be an object.");
		requireInput(isGuidance(question.instructions), "question instructions must be a string, object or array.");
		switch (question.type) {
			case "choice":
				requireInput(
					isObject(question.criteria) &&
						Object.keys(question.criteria).length > 0 &&
						Object.keys(question.criteria).length <= 255 &&
						Object.values(question.criteria).every((criterion) => criterion === null || isGuidance(criterion)),
					"choice criteria must contain 1 to 255 guidance or null values.",
				);
				break;
			case "score":
				requireInput(
					Array.isArray(question.criteria) &&
						question.criteria.length >= 1 &&
						question.criteria.length <= 10 &&
						question.criteria.every(isGuidance),
					"score criteria must contain 1 to 10 guidance levels.",
				);
				break;
			case "noul":
				if (has(question, "criteria"))
					requireInput(
						isObject(question.criteria) && isGuidance(question.criteria.true) && isGuidance(question.criteria.false),
						"noul criteria must include true and false guidance.",
					);
				break;
			default:
				inputError("question type must be choice, score or noul.");
		}
	}
	// JSON Schema maxLength counts Unicode codepoints, not UTF-16 units.
	for (const key of ["session_id", "user"]) {
		if (has(value, key))
			requireInput(
				typeof value[key] === "string" && [...value[key]].length <= 256,
				`${key} must be a string of at most 256 characters.`,
			);
	}
	if (has(value, "provider")) validateProvider(value.provider);
	if (has(value, "trace")) {
		if (!isObject(value.trace)) inputError("trace must be an object.");
		for (const key of ["trace_id", "trace_name", "span_name", "generation_name", "parent_span_id"]) {
			if (has(value.trace, key)) requireInput(typeof value.trace[key] === "string", `trace.${key} must be a string.`);
		}
	}
	// All documented fields and every recursive JSON value were narrowed above.
	return value as DecisionRequest;
};

function invalidResponse(): never {
	throw new NetworkError("OpenRouter returned an invalid Decisions response. Check the model and retry explicitly.");
}

// @spec FR-004: Preserve validated raw response — .specs/features/008-jev-openrouter/spec.md#fr-004
/**
 * Validates response fields and matching answers without I/O or removing extensions.
 * @param value Untrusted parsed API response.
 * @param request Validated request defining the expected questions and answer types.
 * @returns The same response with typed answers, usage and optional provider metadata.
 * @throws {NetworkError} Missing, malformed or mismatched response fields (exit code 4).
 */
export const validateDecisionResponse = (value: unknown, request: DecisionRequest): DecisionResponse => {
	let jsonValid = false;
	try {
		jsonValid = isJson(value);
	} catch {
		/* Excessively nested JSON is rejected safely. */
	}
	if (
		!jsonValid ||
		!isObject(value) ||
		typeof value.model !== "string" ||
		!value.model.trim() ||
		!isObject(value.answers) ||
		!isObject(value.usage)
	)
		invalidResponse();
	for (const key of ["id", "provider"]) if (has(value, key) && typeof value[key] !== "string") invalidResponse();
	for (const key of ["input_tokens", "output_tokens"]) {
		const count = value.usage[key];
		if (!isFiniteNumber(count) || !Number.isInteger(count) || count < 0) invalidResponse();
	}
	if (has(value.usage, "cost") && (!isFiniteNumber(value.usage.cost) || value.usage.cost < 0)) invalidResponse();
	const answers = value.answers;
	if (Object.keys(answers).length !== Object.keys(request.questions).length) invalidResponse();
	for (const [key, question] of Object.entries(request.questions)) {
		const answer = has(answers, key) ? answers[key] : undefined;
		if (!isObject(answer) || answer.type !== question.type) invalidResponse();
		switch (question.type) {
			case "choice":
				if (typeof answer.choice !== "string" || !has(question.criteria, answer.choice)) invalidResponse();
				break;
			case "score":
				if (!isFiniteNumber(answer.score) || answer.score < 0 || answer.score > question.criteria.length - 1)
					invalidResponse();
				if (has(answer, "legend") && (!isObject(answer.legend) || !Object.values(answer.legend).every(isGuidance)))
					invalidResponse();
				break;
			case "noul":
				if (!isProbability(answer.noul)) invalidResponse();
				break;
		}
		if (has(answer, "confidence") && !isProbability(answer.confidence)) invalidResponse();
		if (
			has(answer, "probabilities") &&
			(!isObject(answer.probabilities) || !Object.values(answer.probabilities).every(isProbability))
		)
			invalidResponse();
	}
	// The entire raw JSON envelope and required variant fields passed boundary validation.
	return value as DecisionResponse;
};

const decisionEndpoint = (base: string | undefined): string => {
	if (!base) return "https://openrouter.ai/api/alpha/decisions";
	try {
		const url = new URL(base);
		if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash)
			throw new Error();
		url.pathname = `${url.pathname.replace(/\/+$/, "").replace(/\/v1$/, "")}/alpha/decisions`;
		return url.toString();
	} catch {
		throw new ConfigError(
			"OPENROUTER_BASE_URL must be an HTTP(S) API base URL without credentials, query or fragment.",
		);
	}
};

const httpFailure = (status: number): string => {
	if (status === 401 || status === 403) return "Check the configured OpenRouter key and its permissions.";
	if (status === 402) return "Check your OpenRouter credits.";
	if (status === 400 || status === 404 || status === 413)
		return "Check the model, request parameters and payload size.";
	if (status === 429) return "Rate limit reached; wait before retrying explicitly.";
	return "The provider is unavailable; retry explicitly later.";
};

// @spec FR-003: One bounded safe Decisions POST — .specs/features/008-jev-openrouter/spec.md#fr-003
/**
 * Sends one bounded HTTP request using configured credentials, without retries.
 * @param request Complete decision input, validated before configuration or network access.
 * @param opts Optional timeout and isolated transport/configuration dependencies.
 * @returns Validated raw answers, usage and provider metadata, including JSON extensions.
 * @throws {AppError} Invalid request or timeout (exit code 2).
 * @throws {ConfigError} Missing credentials or invalid API base URL (exit code 3).
 * @throws {NetworkError} HTTP, timeout, network or response failure (exit code 4).
 */
export const decide = async (request: DecisionRequest, opts: DecisionOptions = {}): Promise<DecisionResponse> => {
	const validated = validateDecisionRequest(request);
	const timeoutMs = opts.timeoutMs ?? 10_000;
	requireInput(
		Number.isSafeInteger(timeoutMs) && timeoutMs > 0 && timeoutMs <= 2_147_483_647,
		"timeoutMs must be a positive integer no greater than 2147483647.",
	);
	const config = opts.getConfig ?? getEnv;
	const endpoint = decisionEndpoint(config("OPENROUTER_BASE_URL"));
	const apiKey = config("OPENROUTER_API_KEY");
	if (!apiKey?.trim())
		throw new ConfigError(
			"OPENROUTER_API_KEY is not configured. Configure its existing creds: Keychain reference in the cc-hub .env file.",
		);
	const signal = AbortSignal.timeout(timeoutMs);
	try {
		const response = await (opts.fetch ?? fetch)(endpoint, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				"HTTP-Referer": "https://github.com/cc-hub",
				"X-Title": "cc-hub",
			},
			body: JSON.stringify(validated),
			signal,
		});
		if (!response.ok)
			throw new NetworkError(`OpenRouter Decisions HTTP ${response.status}. ${httpFailure(response.status)}`);
		let value: unknown;
		try {
			value = await response.json();
		} catch {
			throw new NetworkError(
				"OpenRouter returned malformed Decisions JSON. Retry explicitly or check provider availability.",
			);
		}
		return validateDecisionResponse(value, validated);
	} catch (error) {
		if (signal.aborted)
			throw new NetworkError(
				`OpenRouter Decisions timed out after ${timeoutMs} ms. Increase --timeout-ms or retry explicitly.`,
			);
		if (error instanceof NetworkError) throw error;
		throw new NetworkError("OpenRouter Decisions request failed. Check your network connection and API base URL.");
	}
};
