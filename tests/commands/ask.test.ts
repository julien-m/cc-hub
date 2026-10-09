import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

type AskCall = { prompt: string; opts: { model?: string; effort?: string } };
const askCalls: AskCall[] = [];

Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });

type CreateAskCommand = typeof import("../../src/commands/ask.ts").createAskCommand;
let createAskCommand!: CreateAskCommand;

describe("ask command reasoning effort", () => {
	let realOpenRouter: unknown;
	let realPoyo: unknown;
	let realEnv: unknown;
	let realSpinner: unknown;

	beforeAll(async () => {
		realOpenRouter = { ...(await import("../../src/services/openrouter.ts")) };
		realPoyo = { ...(await import("../../src/services/poyo.ts")) };
		realEnv = { ...(await import("../../src/services/env.ts")) };
		realSpinner = { ...(await import("../../src/infra/spinner.ts")) };

		mock.module("../../src/services/openrouter.ts", () => ({
			askLLM: async (prompt: string, opts: { model?: string; effort?: string }) => {
				askCalls.push({ prompt, opts });
				return "ok";
			},
		}));
		mock.module("../../src/services/poyo.ts", () => ({
			askPoyo: async () => "ok",
		}));
		mock.module("../../src/services/env.ts", () => ({
			getEnv: () => undefined,
		}));
		mock.module("../../src/infra/spinner.ts", () => ({
			Spinner: class {
				start(): this {
					return this;
				}
				stop(): void {}
			},
		}));

		({ createAskCommand } = await import("../../src/commands/ask.ts"));
	});

	afterAll(() => {
		mock.module("../../src/services/openrouter.ts", () => ({ ...(realOpenRouter as object) }));
		mock.module("../../src/services/poyo.ts", () => ({ ...(realPoyo as object) }));
		mock.module("../../src/services/env.ts", () => ({ ...(realEnv as object) }));
		mock.module("../../src/infra/spinner.ts", () => ({ ...(realSpinner as object) }));
	});

	beforeEach(() => {
		askCalls.length = 0;
	});

	// @spec FR-002: Native route and existing ask options — .specs/features/010-model-catalog-update/spec.md#fr-002
	// @spec FR-003: Preserve absent effort and map documented bounds — .specs/features/010-model-catalog-update/spec.md#fr-003
	it.each([
		"openai/gpt-6.1-sol",
		"anthropic/claude-sonnet-5.5",
		"anthropic/claude-opus-5.5",
		"xai/grok-4.6",
	])("should route and map all new text efforts for %s", async (id) => {
		const realWrite = process.stdout.write;
		// This compatible stdout output-port fake suppresses only fixture response bytes.
		process.stdout.write = (() => true) as typeof process.stdout.write;
		try {
			for (const effort of [undefined, "minimal", "high", "ultra"]) {
				await createAskCommand().parseAsync([
					"bun",
					"ask",
					"Compiler question",
					"-m",
					id,
					...(effort ? ["-e", effort] : []),
				]);
			}
		} finally {
			process.stdout.write = realWrite;
		}
		expect(askCalls.map((call) => call.prompt)).toEqual(Array<string>(4).fill("Compiler question"));
		expect(askCalls.map((call) => call.opts.model)).toEqual(
			Array<string>(4).fill(id === "xai/grok-4.6" ? "x-ai/grok-4.6" : id),
		);
		expect(askCalls.map((call) => call.opts.effort)).toEqual([
			undefined,
			"low",
			"high",
			id === "xai/grok-4.6" ? "xhigh" : "max",
		]);
	});

	it("should pass xhigh effort for GLM 5.2", async () => {
		const output: string[] = [];
		const realWrite = process.stdout.write;
		process.stdout.write = ((chunk: string) => {
			output.push(chunk);
			return true;
		}) as typeof process.stdout.write;
		try {
			await createAskCommand().parseAsync(["node", "ask", "question", "-m", "z-ai/glm-5.2", "-e", "xhigh"]);
		} finally {
			process.stdout.write = realWrite;
		}

		expect(askCalls).toHaveLength(1);
		expect(askCalls[0].opts.model).toBe("z-ai/glm-5.2");
		expect(askCalls[0].opts.effort).toBe("xhigh");
		expect(output.join("")).toContain("ok");
	});

	it("should map max effort to GLM 5.2 xhigh", async () => {
		const output: string[] = [];
		const realWrite = process.stdout.write;
		process.stdout.write = ((chunk: string) => {
			output.push(chunk);
			return true;
		}) as typeof process.stdout.write;
		try {
			await createAskCommand().parseAsync(["node", "ask", "question", "-m", "z-ai/glm-5.2", "-e", "max"]);
		} finally {
			process.stdout.write = realWrite;
		}

		expect(askCalls).toHaveLength(1);
		expect(askCalls[0].opts.effort).toBe("xhigh");
		expect(output.join("")).toContain("ok");
	});

	it("should map max effort to GPT OSS high", async () => {
		const realWrite = process.stdout.write;
		process.stdout.write = (() => true) as typeof process.stdout.write;
		try {
			await createAskCommand().parseAsync(["node", "ask", "question", "-m", "openai/gpt-oss-120b", "-e", "max"]);
		} finally {
			process.stdout.write = realWrite;
		}

		expect(askCalls).toHaveLength(1);
		expect(askCalls[0].opts.effort).toBe("high");
	});
});

// @spec AC-006: Guard every registered decision selector — .specs/features/009-decision-models/spec.md#ac-006
describe("ask decision model guard", () => {
	it.each([
		"openrouter",
		"poyo",
	])("should reject every registered decision model on %s with a typed-decision usage hint", (provider) => {
		for (const model of [
			"typesafe/jev-1.13",
			"~typesafe/jev-latest",
			"openai/gpt-6-luna-decisions",
			"luna-decisions",
		]) {
			const result = Bun.spawnSync(
				[process.execPath, "bin/cc-hub.ts", "ask", "Classify this", "--provider", provider, "-m", model],
				{
					cwd: new URL("../..", import.meta.url).pathname,
					stdout: "pipe",
					stderr: "pipe",
				},
			);
			expect(result.exitCode).toBe(2);
			expect(result.stdout.toString()).toBe("");
			expect(result.stderr.toString()).toContain("cc-hub decide");
		}
	});
});
