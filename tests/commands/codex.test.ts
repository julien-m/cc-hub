import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

type CodexCall = { prompt: string; opts: { model?: string; effort?: string } };
const codexCalls: CodexCall[] = [];

Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });

type CreateCodexCommand = typeof import("../../src/commands/codex.ts").createCodexCommand;
let createCodexCommand!: CreateCodexCommand;

describe("codex command reasoning effort", () => {
	let realCodex: unknown;
	let realEnv: unknown;
	let realSpinner: unknown;

	beforeAll(async () => {
		realCodex = { ...(await import("../../src/services/codex.ts")) };
		realEnv = { ...(await import("../../src/services/env.ts")) };
		realSpinner = { ...(await import("../../src/infra/spinner.ts")) };

		mock.module("../../src/services/codex.ts", () => ({
			CodexAuthError: class CodexAuthError extends Error {},
			CodexNotFoundError: class CodexNotFoundError extends Error {},
			askCodex: async (prompt: string, opts: { model?: string; effort?: string }) => {
				codexCalls.push({ prompt, opts });
				return "ok";
			},
			reviewCodex: async () => "ok",
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

		({ createCodexCommand } = await import("../../src/commands/codex.ts"));
	});

	afterAll(() => {
		mock.module("../../src/services/codex.ts", () => ({ ...(realCodex as object) }));
		mock.module("../../src/services/env.ts", () => ({ ...(realEnv as object) }));
		mock.module("../../src/infra/spinner.ts", () => ({ ...(realSpinner as object) }));
	});

	beforeEach(() => {
		codexCalls.length = 0;
	});

	it("should use GPT 5.6 Sol as the default Codex model", async () => {
		const realWrite = process.stdout.write;
		process.stdout.write = (() => true) as typeof process.stdout.write;
		try {
			await createCodexCommand().parseAsync(["node", "codex", "question"]);
		} finally {
			process.stdout.write = realWrite;
		}

		expect(codexCalls).toHaveLength(1);
		expect(codexCalls[0].opts.model).toBe("gpt-5.6-sol");
	});

	it("should keep resolving the previous Codex default for codex", async () => {
		const realWrite = process.stdout.write;
		process.stdout.write = (() => true) as typeof process.stdout.write;
		try {
			await createCodexCommand().parseAsync(["node", "codex", "question", "-m", "openai/gpt-5.5"]);
		} finally {
			process.stdout.write = realWrite;
		}

		expect(codexCalls).toHaveLength(1);
		expect(codexCalls[0].opts.model).toBe("gpt-5.5");
	});

	it("should pass ultra effort through for gpt-5.6-sol", async () => {
		const realWrite = process.stdout.write;
		process.stdout.write = (() => true) as typeof process.stdout.write;
		try {
			await createCodexCommand().parseAsync(["node", "codex", "question", "-m", "openai/gpt-5.6-sol", "-e", "ultra"]);
		} finally {
			process.stdout.write = realWrite;
		}

		expect(codexCalls).toHaveLength(1);
		expect(codexCalls[0].opts.model).toBe("gpt-5.6-sol");
		expect(codexCalls[0].opts.effort).toBe("ultra");
	});

	it("should map ultra effort down to max for gpt-5.6-luna", async () => {
		const realWrite = process.stdout.write;
		process.stdout.write = (() => true) as typeof process.stdout.write;
		try {
			await createCodexCommand().parseAsync(["node", "codex", "question", "-m", "openai/gpt-5.6-luna", "-e", "ultra"]);
		} finally {
			process.stdout.write = realWrite;
		}

		expect(codexCalls).toHaveLength(1);
		expect(codexCalls[0].opts.model).toBe("gpt-5.6-luna");
		expect(codexCalls[0].opts.effort).toBe("max");
	});

	it("should map max effort to GPT xhigh before invoking codex exec", async () => {
		const output: string[] = [];
		const realWrite = process.stdout.write;
		process.stdout.write = ((chunk: string) => {
			output.push(chunk);
			return true;
		}) as typeof process.stdout.write;
		try {
			await createCodexCommand().parseAsync(["node", "codex", "question", "-m", "openai/gpt-5.4", "-e", "max"]);
		} finally {
			process.stdout.write = realWrite;
		}

		expect(codexCalls).toHaveLength(1);
		expect(codexCalls[0].opts.model).toBe("gpt-5.4");
		expect(codexCalls[0].opts.effort).toBe("xhigh");
		expect(output.join("")).toContain("ok");
	});
});
