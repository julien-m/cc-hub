import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type GenCall = { request: unknown };
const genCalls: GenCall[] = [];
const resolveCalls: string[] = [];
const state = {
	resolveBehavior: async (p: string): Promise<string[]> => [`url-${p.replace(/\.png$/, "")}`],
};

Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });

type CreateCmd = typeof import("../../src/commands/video.ts").createVideoCommand;
let createVideoCommand!: CreateCmd;

const FIXTURES_DIR = join(import.meta.dir, "__fixtures__");

describe("video command", () => {
	let realPoyoMedia: unknown;
	let realImageInput: unknown;
	let realModels: unknown;
	let realArtifacts: unknown;
	let realEnv: unknown;

	beforeAll(async () => {
		realPoyoMedia = { ...(await import("../../src/services/poyo-media.ts")) };
		realImageInput = { ...(await import("../../src/services/image-input.ts")) };
		realModels = { ...(await import("../../src/services/models.ts")) };
		realArtifacts = { ...(await import("../../src/services/artifacts.ts")) };
		realEnv = { ...(await import("../../src/services/env.ts")) };

		mock.module("../../src/services/poyo-media.ts", () => ({
			generateMedia: async (request: unknown) => {
				genCalls.push({ request });
				return { files: [{ file_type: "video", file_url: "https://out/v.mp4" }] };
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

		({ createVideoCommand } = await import("../../src/commands/video.ts"));
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

	it("AC-002: forwards multiple -i into image_urls preserving order", async () => {
		const cmd = createVideoCommand();
		await cmd.parseAsync([
			"node",
			"video",
			"blend",
			"-i",
			"a.png",
			"-i",
			"b.png",
			"-o",
			"/tmp/out.mp4",
			"-m",
			"test-model",
		]);
		expect(resolveCalls).toEqual(["a.png", "b.png"]);
		expect(genCalls).toHaveLength(1);
		const req = genCalls[0].request as { input: { image_urls: string[] } };
		expect(req.input.image_urls).toEqual(["url-a", "url-b"]);
	});

	it("AC-003 / FR-006: single -i payload byte-identical to baseline", async () => {
		state.resolveBehavior = async (_p) => ["url-only"];
		const cmd = createVideoCommand();
		await cmd.parseAsync(["node", "video", "one ref", "-i", "only.png", "-o", "/tmp/out.mp4"]);

		expect(genCalls).toHaveLength(1);
		const baseline = JSON.parse(readFileSync(join(FIXTURES_DIR, "video-single-i.json"), "utf-8"));
		expect(genCalls[0].request).toEqual(baseline);
	});

	it("AC-003: zero -i produces input without image_urls key", async () => {
		const cmd = createVideoCommand();
		await cmd.parseAsync(["node", "video", "no ref", "-o", "/tmp/out.mp4", "-m", "test-model"]);
		expect(genCalls).toHaveLength(1);
		const req = genCalls[0].request as { input: Record<string, unknown> };
		expect("image_urls" in req.input).toBe(false);
	});

	it("AC-004 / FR-005: failing -i aborts before generateMedia and names the path", async () => {
		state.resolveBehavior = async (p: string) => {
			if (p === "missing.png") throw new Error("Image not found: /abs/missing.png");
			return [`url-${p}`];
		};
		const origExit = process.exit;
		const origErr = console.error;
		const errMsgs: string[] = [];
		let exitCode: number | undefined;
		(process as unknown as { exit: (n?: number) => never }).exit = ((n?: number) => {
			exitCode = n;
			throw new Error(`__exit_${n}`);
		}) as never;
		console.error = (msg: string) => {
			errMsgs.push(msg);
		};
		try {
			const cmd = createVideoCommand();
			await expect(
				cmd.parseAsync([
					"node",
					"video",
					"x",
					"-i",
					"exists.png",
					"-i",
					"missing.png",
					"-o",
					"/tmp/out.mp4",
					"-m",
					"test-model",
				]),
			).rejects.toThrow(/__exit_/);
			expect(genCalls).toHaveLength(0);
			expect(exitCode).not.toBe(0);
			expect(errMsgs.join("\n")).toContain("missing.png");
		} finally {
			process.exit = origExit;
			console.error = origErr;
		}
	});
});
