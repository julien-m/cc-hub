/** Isolated subprocess proofs for typed decision input, output, and safe CLI failures. */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
let testDirectory: string;
let harnessPath: string;

interface CliResult {
	code: number;
	stdout: string;
	stderr: string;
}

const questions = () => ({
	kind: { type: "choice", instructions: { goal: "Classify" }, criteria: { keep: "Useful", hide: null } },
	quality: { type: "score", instructions: ["Rate relevance"], criteria: ["Poor", { level: "Good" }] },
	claim: { type: "noul", instructions: "Is the claim true?", criteria: { true: "Verified", false: ["False"] } },
});

const request = (overrides: Record<string, unknown> = {}) => ({
	state: { text: "Feed item", nested: [1, true, null] },
	questions: questions(),
	...overrides,
});

const run = async (
	args: string[],
	options: { stdin?: string; failure?: string; tty?: boolean } = {},
): Promise<CliResult> => {
	const child = Bun.spawn([process.execPath, harnessPath, ...args], {
		cwd: testDirectory,
		stdin: options.stdin === undefined ? "ignore" : new Blob([options.stdin]),
		stdout: "pipe",
		stderr: "pipe",
		env: {
			...process.env,
			DECISION_TEST_FAILURE: options.failure ?? "",
			DECISION_TEST_TTY: options.tty ? "true" : "false",
		},
	});
	const [stdout, stderr, code] = await Promise.all([
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
		child.exited,
	]);
	return { code, stdout, stderr };
};

const expectFailure = (result: CliResult, code = 2): void => {
	expect(result.code).toBe(code);
	expect(result.stdout).toBe("");
	expect(result.stderr).toContain("Decision failed:");
};

beforeAll(async () => {
	testDirectory = await mkdtemp(join(tmpdir(), "cc-hub-decide-test-"));
	harnessPath = join(testDirectory, "cli.ts");
	// A fresh subprocess contains each module mock; other Bun suites retain real exports.
	await writeFile(
		harnessPath,
		`import { mock } from "bun:test";
import { Command } from ${JSON.stringify(join(root, "node_modules/commander/esm.mjs"))};
import { ConfigError, NetworkError } from ${JSON.stringify(join(root, "src/errors.ts"))};
import type { DecisionRequest } from ${JSON.stringify(join(root, "src/types/decisions.ts"))};
const servicePath = ${JSON.stringify(join(root, "src/services/decisions.ts"))};
const real = await import(servicePath);
mock.module(servicePath, () => ({ ...real, decide: async (body: DecisionRequest, options: { timeoutMs: number }) => {
 if (process.env.DECISION_TEST_FAILURE === "config") throw new ConfigError("Missing key. Configure OpenRouter credentials.");
 if (process.env.DECISION_TEST_FAILURE === "network") throw new NetworkError("OpenRouter request failed. Retry later.");
 if (process.env.DECISION_TEST_FAILURE === "unexpected") throw new Error("PRIVATE_RESPONSE_PRIVATE_KEY");
 return { model: body.model, id: "response-id", provider: "TypeSafe", usage: { input_tokens: 10, output_tokens: 2, cost: 0.00001 },
 answers: { kind: {type: "choice", choice: "keep", confidence: 0.8, probabilities: {keep: 0.8, hide: 0.2}},
 quality: {type: "score", score: 0.8123456789}, claim: {type: "noul", noul: 0.6} }, extension: { request: body, timeoutMs: options.timeoutMs } };
} }));
if (process.env.DECISION_TEST_TTY === "true") Object.defineProperty(process.stdin, "isTTY", {value: true});
const { createDecideCommand } = await import(${JSON.stringify(join(root, "src/commands/decide.ts"))});
await new Command("cc-hub").addCommand(createDecideCommand()).parseAsync(process.argv);
`,
	);
});

afterAll(async () => {
	await rm(testDirectory, { recursive: true, force: true });
});

describe("decide JSON input and overrides", () => {
	it("should preserve inline full request extensions and raw response metadata", async () => {
		const body = request({
			model: "~typesafe/jev-latest",
			provider: { only: ["TypeSafe"], extension: [1] },
			extra: { x: 1 },
		});
		const result = await run(["decide", "--input", JSON.stringify(body)]);
		expect(result.code).toBe(0);
		expect(result.stderr).toBe("");
		const output = JSON.parse(result.stdout);
		expect(output.extension.request).toEqual(body);
		expect(output.extension.timeoutMs).toBe(10000);
		expect(output.answers.quality.score).toBe(0.8123456789);
		expect(output.answers.kind.probabilities).toEqual({ keep: 0.8, hide: 0.2 });
		expect(output.usage.cost).toBe(0.00001);
		expect(output.id).toBe("response-id");
		expect(output.provider).toBe("TypeSafe");
	});

	it("should accept request files and override every documented metadata field", async () => {
		const inputPath = join(testDirectory, "request.json");
		await writeFile(
			inputPath,
			JSON.stringify(request({ model: "body-model", session_id: "body-session", user: "body-user" })),
		);
		const state = ["New state", { nested: true }];
		const provider = { only: ["TypeSafe"], max_price: { request: "0.001" }, future: true };
		const trace = { trace_name: "CLI trace", future: { x: 1 } };
		const result = await run([
			"jev",
			"-i",
			inputPath,
			"-s",
			JSON.stringify(state),
			"-q",
			JSON.stringify(questions()),
			"-m",
			"typesafe/jev-1.13",
			"-p",
			JSON.stringify(provider),
			"--session-id",
			"cli-session",
			"--trace",
			JSON.stringify(trace),
			"--user",
			"cli-user",
			"--timeout-ms",
			"2345",
			"--json",
		]);
		expect(result.code).toBe(0);
		const output = JSON.parse(result.stdout);
		expect(output.extension.request).toEqual({
			...request(),
			state,
			provider,
			trace,
			model: "typesafe/jev-1.13",
			session_id: "cli-session",
			user: "cli-user",
		});
		expect(output.extension.timeoutMs).toBe(2345);
	});

	it("should read a complete request from implicit stdin or explicit input dash", async () => {
		for (const args of [["decide"], ["jev", "--input", "-"]]) {
			const result = await run(args, { stdin: JSON.stringify(request()) });
			expect(result.code).toBe(0);
			expect(JSON.parse(result.stdout).extension.request).toEqual({ ...request(), model: "typesafe/jev-1.13" });
		}
	});

	it("should retain positional raw text and use JSON files for state and questions", async () => {
		const statePath = join(testDirectory, "state.json");
		const questionsPath = join(testDirectory, "questions.json");
		await writeFile(statePath, JSON.stringify({ text: "Structured" }));
		await writeFile(questionsPath, JSON.stringify(questions()));
		for (const [args, state] of [
			[["decide", "raw text, not JSON", "-q", questionsPath], "raw text, not JSON"],
			[["decide", "-s", statePath, "-q", questionsPath], { text: "Structured" }],
			[["decide", "-s", '"quoted scalar"', "-q", questionsPath], "quoted scalar"],
		] as const) {
			const result = await run([...args]);
			expect(result.code).toBe(0);
			expect(JSON.parse(result.stdout).extension.request.state).toEqual(state);
		}
	});

	it("should use piped text state with questions and preserve its newlines", async () => {
		const state = "Line one\nLine two\n";
		const result = await run(["decide", "-q", JSON.stringify(questions())], { stdin: state });
		expect(result.code).toBe(0);
		expect(JSON.parse(result.stdout).extension.request.state).toBe(state);
	});

	it("should accept an explicit JSON state stdin source", async () => {
		const result = await run(["decide", "-s", "-", "-q", JSON.stringify(questions())], {
			stdin: '{"text":"stdin state"}',
		});
		expect(result.code).toBe(0);
		expect(JSON.parse(result.stdout).extension.request.state).toEqual({ text: "stdin state" });
	});
});

describe("decide output and dry run", () => {
	it("should output a validated effective request without calling the service", async () => {
		const result = await run(
			["decide", "--input", JSON.stringify(request()), "--dry-run", "--answers-only", "--pretty"],
			{ failure: "config" },
		);
		expect(result.code).toBe(0);
		expect(result.stderr).toBe("");
		expect(JSON.parse(result.stdout)).toEqual({ ...request(), model: "typesafe/jev-1.13" });
		expect(result.stdout).toContain('\n  "state":');
	});

	it("should write answers only to the exact output path with empty stdout", async () => {
		const outputPath = join(testDirectory, "answers.custom-extension");
		const result = await run([
			"decide",
			"-i",
			JSON.stringify(request()),
			"--answers-only",
			"--pretty",
			"-o",
			outputPath,
		]);
		expect(result.code).toBe(0);
		expect(result.stdout).toBe("");
		expect(result.stderr).toBe("");
		const contents = await readFile(outputPath, "utf8");
		expect(JSON.parse(contents).quality.score).toBe(0.8123456789);
		expect(JSON.parse(contents).model).toBeUndefined();
		expect(contents).toContain('\n  "kind":');
	});

	it("should report unwritable output safely without stdout", async () => {
		const result = await run([
			"decide",
			"-i",
			JSON.stringify(request()),
			"-o",
			join(testDirectory, "missing", "output.json"),
		]);
		expectFailure(result);
		expect(result.stderr).toContain("Cannot write decision output");
	});
});

describe("decide safe failures", () => {
	it("should reject invalid requests before service access without logging private data", async () => {
		for (const input of [
			"PRIVATE_BAD_JSON",
			JSON.stringify(request({ model: null })),
			JSON.stringify(request({ questions: { PRIVATE_QUESTION: { type: "choice", instructions: "PRIVATE_STATE" } } })),
			"[]",
		]) {
			const result = await run(["decide", "-i", input], { failure: "config" });
			expectFailure(result);
			expect(result.stderr).not.toContain("PRIVATE");
		}
	});

	it("should reject empty stdin, missing TTY input, and conflicting sources", async () => {
		const cases: Array<{ args: string[]; stdin?: string; tty?: boolean }> = [
			{ args: ["decide"], stdin: " \n" },
			{ args: ["decide"], tty: true },
			{ args: ["decide", "-s", "-", "-q", "-"], stdin: JSON.stringify(request()) },
			{ args: ["decide", "-p", "-"], stdin: JSON.stringify(request()) },
			{ args: ["decide", "text", "-s", '"other"', "-q", JSON.stringify(questions())] },
			{ args: ["decide", "-q", "-"], stdin: JSON.stringify(questions()) },
		];
		for (const scenario of cases) expectFailure(await run(scenario.args, scenario));
	});

	it("should reject invalid timeout values before service or stdin access", async () => {
		for (const timeout of ["0", "-1", "1.5", "Infinity", "NaN", "1e3", "2147483648", "9007199254740992"]) {
			const result = await run(["decide", "--timeout-ms", timeout], { failure: "config", tty: true });
			expectFailure(result);
			expect(result.stderr).toContain("positive integer");
		}
	});

	it("should keep output files untouched for configuration and network failures", async () => {
		for (const [failure, code] of [
			["config", 3],
			["network", 4],
			["unexpected", 4],
		] as const) {
			const outputPath = join(testDirectory, `failed-${failure}.json`);
			await writeFile(outputPath, "existing content");
			const result = await run(["decide", "-i", JSON.stringify(request()), "-o", outputPath], { failure });
			expectFailure(result, code);
			expect(result.stderr).not.toContain("PRIVATE");
			expect(await readFile(outputPath, "utf8")).toBe("existing content");
		}
	});
});
