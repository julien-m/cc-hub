/** Independent request/response and fake HTTP coverage for Jev Decisions. */
import { describe, expect, it } from "bun:test";
import { AppError, ConfigError, NetworkError } from "../../src/errors.ts";
import {
	DEFAULT_DECISION_MODEL,
	decide,
	validateDecisionRequest,
	validateDecisionResponse,
} from "../../src/services/decisions.ts";
import type { DecisionRequest } from "../../src/types/decisions.ts";

const request = (): DecisionRequest => ({
	model: DEFAULT_DECISION_MODEL,
	state: { text: "private-input", nested: [null, false, 1] },
	questions: {
		category: { type: "choice", instructions: { classify: true }, criteria: { yes: null, no: ["negative"] } },
		priority: { type: "score", instructions: ["rank"], criteria: ["low", { level: "high" }] },
		flag: { type: "noul", instructions: "Is this positive?", criteria: { true: "yes", false: { meaning: "no" } } },
	},
});

const response = () => ({
	model: "typesafe/jev-1.13-resolved",
	id: "test-id",
	provider: "TypeSafe",
	answers: {
		category: { type: "choice", choice: "yes", probabilities: { yes: 0.8, no: 0.2 }, confidence: 0.8 },
		priority: {
			type: "score",
			score: 0.85,
			probabilities: { "0": 0.15, "1": 0.85 },
			legend: { "0": "low", "1": { level: "high" } },
		},
		flag: { type: "noul", noul: 0.91 },
	},
	usage: { input_tokens: 31, output_tokens: 12, cost: 0.00002, additional_tokens: 4 },
	extra: { future: [true, null] },
});

const config = (key: string): string | undefined => (key === "OPENROUTER_API_KEY" ? "test-secret" : undefined);

describe("decision request validation", () => {
	it("preserves all documented provider metadata, structured guidance and extensions", () => {
		const value = {
			...request(),
			provider: {
				allow_fallbacks: true,
				require_parameters: false,
				data_collection: "deny",
				zdr: true,
				enforce_distillable_text: null,
				order: ["typesafe"],
				only: null,
				ignore: [],
				quantizations: ["fp16"],
				max_price: { prompt: "0.1", completion: "0", image: "0", audio: "0", request: "0" },
				preferred_max_latency: { p50: 2, p75: null, p90: 4, p99: 8 },
				preferred_min_throughput: 10,
				sort: { by: "latency", partition: "none" },
				options: { typesafe: { future_option: [1] } },
				future_routing: { enabled: true },
			},
			trace: {
				trace_id: "trace",
				trace_name: "name",
				span_name: "span",
				generation_name: "gen",
				parent_span_id: "parent",
				extra: [1],
			},
			session_id: "session",
			user: "user",
			extension: { custom: true },
		};
		expect(validateDecisionRequest(value)).toBe(value);
	});

	it.each(["session_id", "user"])("counts Unicode characters for %s metadata", (key) => {
		for (const count of [200, 256]) {
			const value = { ...request(), [key]: "😀".repeat(count) };
			expect(validateDecisionRequest(value)).toBe(value);
		}
		expect(() => validateDecisionRequest({ ...request(), [key]: "😀".repeat(257) })).toThrow(AppError);
	});

	it("accepts each state and guidance shape, nullable provider, and noul without criteria", () => {
		for (const state of ["text", [], {}]) {
			expect(
				validateDecisionRequest({
					...request(),
					state,
					provider: null,
					questions: { flag: { type: "noul", instructions: state } },
				}).state,
			).toEqual(state);
		}
		expect(validateDecisionRequest({ ...request(), model: "unknown/future-decision" }).model).toBe(
			"unknown/future-decision",
		);
	});

	it.each(
		[
			null,
			[],
			{},
			{ ...request(), model: " " },
			{ ...request(), state: null },
			{ ...request(), state: true },
			{ ...request(), questions: {} },
			{ ...request(), questions: [] },
			{ ...request(), questions: { q: { type: "choice", instructions: "test" } } },
			{ ...request(), questions: { q: { type: "choice", instructions: 1, criteria: { a: "x" } } } },
			{ ...request(), questions: { q: { type: "choice", instructions: "test", criteria: { a: false } } } },
			{ ...request(), questions: { q: { type: "score", instructions: "test", criteria: [] } } },
			{ ...request(), questions: { q: { type: "score", instructions: "test", criteria: [null] } } },
			{ ...request(), questions: { q: { type: "score", instructions: "test", criteria: Array(11).fill("level") } } },
			{ ...request(), questions: { q: { type: "noul", instructions: "test", criteria: { true: "yes" } } } },
			{ ...request(), questions: { q: { type: "other", instructions: "test" } } },
			{ ...request(), session_id: "a".repeat(257) },
			{ ...request(), user: 3 },
			{ ...request(), trace: { trace_id: false } },
			{ ...request(), provider: { order: "typesafe" } },
			{ ...request(), provider: { allow_fallbacks: 1 } },
			{ ...request(), provider: { max_price: { prompt: 1 } } },
			{ ...request(), provider: { preferred_max_latency: { p99: "fast" } } },
			{ ...request(), provider: { sort: { by: false } } },
			{ ...request(), provider: { options: { typesafe: [] } } },
			{ ...request(), extension: undefined },
			{ ...request(), extension: Number.NaN },
			{ ...request(), extension: new Date() },
			{ ...request(), state: Array(2) },
		].map((value) => [value]),
	)("rejects malformed input with code 2", (value) => {
		try {
			validateDecisionRequest(value);
			throw new Error("Expected validation failure");
		} catch (error) {
			expect(error).toBeInstanceOf(AppError);
			expect((error as AppError).code).toBe(2);
			expect((error as AppError).message).not.toContain("private-input");
		}
	});

	it("rejects cyclic JSON and registered text models before configuration lookup", async () => {
		const circular: Record<string, unknown> = {};
		circular.self = circular;
		expect(() => validateDecisionRequest({ ...request(), state: circular })).toThrow(AppError);
		let lookups = 0;
		await expect(
			decide(
				{ ...request(), model: "openai/gpt-4.1" },
				{
					getConfig: () => {
						lookups++;
						return undefined;
					},
				},
			),
		).rejects.toBeInstanceOf(AppError);
		expect(lookups).toBe(0);
	});

	it("accepts score boundary sizes and rejects more than 255 choices", () => {
		for (const size of [1, 10]) {
			expect(
				validateDecisionRequest({
					...request(),
					questions: { q: { type: "score", instructions: "rank", criteria: Array(size).fill("level") } },
				}),
			).toBeDefined();
		}
		const criteria = Object.fromEntries(Array.from({ length: 256 }, (_, index) => [String(index), null]));
		expect(() =>
			validateDecisionRequest({ ...request(), questions: { q: { type: "choice", instructions: "pick", criteria } } }),
		).toThrow("255");
	});
});

describe("decision response validation", () => {
	it("retains raw metadata, unknown fields and score decimals", () => {
		const value = response();
		expect(validateDecisionResponse(value, request())).toBe(value);
		expect(validateDecisionResponse(value, request()).answers.priority).toEqual(value.answers.priority);
	});

	it("accepts absent optional answer and envelope fields", () => {
		const value = {
			model: "jev",
			answers: {
				category: { type: "choice", choice: "yes" },
				priority: { type: "score", score: 0 },
				flag: { type: "noul", noul: 1 },
			},
			usage: { input_tokens: 0, output_tokens: 0 },
		};
		expect(validateDecisionResponse(value, request())).toBe(value);
	});

	it.each([
		{},
		{ ...response(), usage: {} },
		{ ...response(), model: null },
		{ ...response(), usage: { input_tokens: -1, output_tokens: 1 } },
		{ ...response(), usage: { input_tokens: 1.5, output_tokens: 1 } },
		{ ...response(), provider: 1 },
		{ ...response(), extra: Number.POSITIVE_INFINITY },
	])("rejects malformed required response fields", (value) => {
		expect(() => validateDecisionResponse(value, request())).toThrow(NetworkError);
	});

	it.each([
		{ type: "choice", choice: "outside" },
		{ type: "score", score: 0 },
		{ type: "choice", choice: "yes", confidence: 1.1 },
		{ type: "choice", choice: "yes", probabilities: { yes: -0.1 } },
		{ type: "choice", choice: "yes", probabilities: [] },
	])("rejects choices outside criteria and invalid matching or optional values", (answer) => {
		expect(() =>
			validateDecisionResponse({ ...response(), answers: { ...response().answers, category: answer } }, request()),
		).toThrow(NetworkError);
	});

	it("rejects missing/extra answers, out-of-range noul and invalid score/legend", () => {
		const valid = response();
		for (const answers of [
			{ ...valid.answers, extra: { type: "noul", noul: 1 } },
			{ category: valid.answers.category, priority: valid.answers.priority },
			{ ...valid.answers, flag: { type: "noul", noul: 1.01 } },
			{ ...valid.answers, priority: { type: "score", score: 1.01 } },
			{ ...valid.answers, priority: { type: "score", score: 0.5, legend: { "0": null } } },
		])
			expect(() => validateDecisionResponse({ ...valid, answers }, request())).toThrow(NetworkError);
	});
});

describe("decision transport", () => {
	it("posts complete JSON once to the default endpoint with attribution and auth", async () => {
		let calls = 0;
		const body = request();
		const result = await decide(body, {
			getConfig: config,
			fetch: async (url, init) => {
				calls++;
				expect(url).toBe("https://openrouter.ai/api/alpha/decisions");
				expect(init.method).toBe("POST");
				expect(init.headers).toMatchObject({
					Authorization: "Bearer test-secret",
					"Content-Type": "application/json",
					"X-Title": "cc-hub",
				});
				expect(JSON.parse(String(init.body))).toEqual(body);
				expect(init.signal).toBeInstanceOf(AbortSignal);
				return Response.json(response());
			},
		});
		expect(calls).toBe(1);
		expect(result).toEqual(response());
	});

	it("uses a fake HTTP server and strips trailing /v1/ from configured API base", async () => {
		let observedPath = "";
		let observedBody: unknown;
		const server = Bun.serve({
			hostname: "127.0.0.1",
			port: 0,
			async fetch(req) {
				observedPath = new URL(req.url).pathname;
				observedBody = await req.json();
				return Response.json(response());
			},
		});
		try {
			await decide(request(), {
				getConfig: (key) => (key === "OPENROUTER_BASE_URL" ? `http://127.0.0.1:${server.port}/api/v1///` : config(key)),
			});
			expect(observedPath).toBe("/api/alpha/decisions");
			expect(observedBody).toEqual(request());
		} finally {
			server.stop(true);
		}
	});

	it("requires a credential and rejects unsafe configured URLs without HTTP", async () => {
		await expect(decide(request(), { getConfig: () => undefined })).rejects.toBeInstanceOf(ConfigError);
		for (const base of [
			"invalid",
			"ftp://example.com/api",
			"https://user:secret@example.com/api",
			"https://example.com/api?key=secret",
		]) {
			await expect(
				decide(request(), { getConfig: (key) => (key === "OPENROUTER_BASE_URL" ? base : config(key)) }),
			).rejects.toBeInstanceOf(ConfigError);
		}
	});

	it("validates input and timeout before any credential or fetch access", async () => {
		for (const timeoutMs of [0, -1, 1.5, Number.POSITIVE_INFINITY, 2_147_483_648]) {
			let touched = false;
			await expect(
				decide(request(), {
					timeoutMs,
					getConfig: () => {
						touched = true;
						return undefined;
					},
				}),
			).rejects.toBeInstanceOf(AppError);
			expect(touched).toBe(false);
		}
	});

	it.each([
		400, 401, 402, 403, 404, 413, 429, 500, 502, 503, 524, 529,
	])("keeps HTTP %i failure actionable, safe and without retry", async (status) => {
		let calls = 0;
		try {
			await decide(request(), {
				getConfig: config,
				fetch: async () => {
					calls++;
					return new Response("private-input test-secret unsafe-response", { status });
				},
			});
			throw new Error("Expected HTTP failure");
		} catch (error) {
			expect(error).toBeInstanceOf(NetworkError);
			const safe = error as NetworkError;
			expect(safe.code).toBe(4);
			expect(safe.message).toContain(String(status));
			for (const secret of ["private-input", "test-secret", "unsafe-response"])
				expect(safe.message).not.toContain(secret);
		}
		expect(calls).toBe(1);
	});

	it("sanitizes network and malformed JSON failures", async () => {
		for (const fetcher of [
			async () => {
				throw new Error("test-secret private-input");
			},
			async () => new Response("test-secret private-input"),
			async () => Response.json({ error: "test-secret private-input" }),
		]) {
			try {
				await decide(request(), { getConfig: config, fetch: fetcher });
				throw new Error("Expected network failure");
			} catch (error) {
				expect(error).toBeInstanceOf(NetworkError);
				expect((error as NetworkError).message).not.toContain("test-secret");
				expect((error as NetworkError).message).not.toContain("private-input");
			}
		}
	});

	it("aborts fetch with a bounded timeout and performs no retry", async () => {
		let calls = 0;
		await expect(
			decide(request(), {
				timeoutMs: 5,
				getConfig: config,
				fetch: async (_url, init) => {
					calls++;
					return new Promise<Response>((_resolve, reject) =>
						init.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true }),
					);
				},
			}),
		).rejects.toThrow("timed out after 5 ms");
		expect(calls).toBe(1);
	});
});
