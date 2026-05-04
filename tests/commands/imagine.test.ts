import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Captured args (must be mutated in place — mocks close over these references)
type GenCall = { request: unknown };
const genCalls: GenCall[] = [];
const resolveCalls: string[] = [];
const state = {
	resolveBehavior: async (p: string): Promise<string[]> => [`url-${p.replace(/\.png$/, "")}`],
};

// Force TTY so resolvePrompt does not block on stdin in the test process
Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });

// Import the command lazily inside beforeAll, AFTER mocks are registered.
// `mock.module` is global across test files in a single bun test run, so we
// install mocks in beforeAll and restore real modules in afterAll.
type CreateCmd = typeof import("../../src/commands/imagine.ts").createImagineCommand;
let createImagineCommand!: CreateCmd;

const FIXTURES_DIR = join(import.meta.dir, "__fixtures__");

describe("imagine command", () => {
	let realPoyoMedia: unknown;
	let realImageInput: unknown;
	let realModels: unknown;
	let realArtifacts: unknown;
	let realEnv: unknown;

	beforeAll(async () => {
		// Eagerly snapshot real exports — `await import(...)` returns a live
		// namespace object that re-reflects subsequent mock.module() swaps.
		realPoyoMedia = { ...(await import("../../src/services/poyo-media.ts")) };
		realImageInput = { ...(await import("../../src/services/image-input.ts")) };
		realModels = { ...(await import("../../src/services/models.ts")) };
		realArtifacts = { ...(await import("../../src/services/artifacts.ts")) };
		realEnv = { ...(await import("../../src/services/env.ts")) };

		mock.module("../../src/services/poyo-media.ts", () => ({
			generateMedia: async (request: unknown, _onProgress?: (n: number) => void) => {
				genCalls.push({ request });
				return { files: [{ file_type: "image", file_url: "https://out/img.png" }] };
			},
			downloadFile: async (_url: string, destPath: string) => destPath,
		}));
		mock.module("../../src/services/image-input.ts", () => ({
			resolveImageInput: async (path: string) => {
				resolveCalls.push(path);
				return state.resolveBehavior(path);
			},
			resolveVideoInput: async (path: string) => `url-${path}`,
			validateImageExtension: () => "image/png",
			validateVideoExtension: () => "video/mp4",
		}));
		mock.module("../../src/services/models.ts", () => ({
			resolveForProvider: (input: string, _provider: string) => input,
			modelToSlug: (id: string) => id.replace(/\//g, "-"),
		}));
		mock.module("../../src/services/artifacts.ts", () => ({
			resolveOutputPath: (_url: string, output: string, _ext: string) => output,
		}));
		mock.module("../../src/services/env.ts", () => ({
			getEnv: () => undefined,
		}));

		({ createImagineCommand } = await import("../../src/commands/imagine.ts"));
	});

	afterAll(() => {
		mock.module("../../src/services/poyo-media.ts", () => ({ ...(realPoyoMedia as object) }));
		mock.module("../../src/services/image-input.ts", () => ({ ...(realImageInput as object) }));
		mock.module("../../src/services/models.ts", () => ({ ...(realModels as object) }));
		mock.module("../../src/services/artifacts.ts", () => ({ ...(realArtifacts as object) }));
		mock.module("../../src/services/env.ts", () => ({ ...(realEnv as object) }));
	});

	beforeEach(() => {
		genCalls.length = 0;
		resolveCalls.length = 0;
		state.resolveBehavior = async (p: string) => [`url-${p.replace(/\.png$/, "")}`];
	});

	it("AC-001: forwards multiple -i into image_urls preserving order", async () => {
		const cmd = createImagineCommand();
		await cmd.parseAsync([
			"node",
			"imagine",
			"blend",
			"-i",
			"a.png",
			"-i",
			"b.png",
			"-i",
			"c.png",
			"-o",
			"/tmp/out.png",
			"--model",
			"test-model",
		]);
		expect(resolveCalls).toEqual(["a.png", "b.png", "c.png"]);
		expect(genCalls).toHaveLength(1);
		const req = genCalls[0].request as { input: { image_urls: string[] } };
		expect(req.input.image_urls).toEqual(["url-a", "url-b", "url-c"]);
	});

	it("AC-003 / FR-006: single -i payload byte-identical to baseline", async () => {
		state.resolveBehavior = async (_p) => ["url-only"];
		const cmd = createImagineCommand();
		await cmd.parseAsync(["node", "imagine", "one ref", "-i", "only.png", "-o", "/tmp/out.png"]);

		expect(genCalls).toHaveLength(1);
		const baseline = JSON.parse(readFileSync(join(FIXTURES_DIR, "imagine-single-i.json"), "utf-8"));
		expect(genCalls[0].request).toEqual(baseline);
	});

	it("AC-003: zero -i produces input without image_urls key", async () => {
		const cmd = createImagineCommand();
		await cmd.parseAsync(["node", "imagine", "no ref", "-o", "/tmp/out.png", "--model", "test-model"]);
		expect(genCalls).toHaveLength(1);
		const req = genCalls[0].request as { input: Record<string, unknown> };
		expect("image_urls" in req.input).toBe(false);
	});

	it("AC-004 / FR-005: failing -i aborts before generateMedia and names the path", async () => {
		state.resolveBehavior = async (p: string) => {
			if (p === "missing.png") throw new Error("Image not found: /abs/missing.png");
			return [`url-${p}`];
		};
		const exitSpy = (() => {
			const orig = process.exit;
			let captured: number | undefined;
			(process as unknown as { exit: (n?: number) => never }).exit = ((n?: number) => {
				captured = n;
				throw new Error(`__exit_${n}`);
			}) as never;
			return {
				get code() {
					return captured;
				},
				restore: () => {
					process.exit = orig;
				},
			};
		})();
		const errSpy = (() => {
			const orig = console.error;
			const messages: string[] = [];
			console.error = (msg: string) => {
				messages.push(msg);
			};
			return { messages, restore: () => (console.error = orig) };
		})();
		try {
			const cmd = createImagineCommand();
			await expect(
				cmd.parseAsync([
					"node",
					"imagine",
					"x",
					"-i",
					"exists.png",
					"-i",
					"missing.png",
					"-o",
					"/tmp/out.png",
					"--model",
					"test-model",
				]),
			).rejects.toThrow(/__exit_/);
			expect(genCalls).toHaveLength(0);
			expect(exitSpy.code).not.toBe(0);
			const joined = errSpy.messages.join("\n");
			expect(joined).toContain("missing.png");
		} finally {
			exitSpy.restore();
			errSpy.restore();
		}
	});
});
