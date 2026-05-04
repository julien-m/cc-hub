import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type GenCall = { request: unknown };
const genCalls: GenCall[] = [];
const resolveImageCalls: string[] = [];
const state = {
	resolveImageBehavior: async (p: string): Promise<string[]> => [`url-${p.replace(/\.png$/, "")}`],
};

Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });

type CreateCmd = typeof import("../../src/commands/motion.ts").createMotionCommand;
let createMotionCommand!: CreateCmd;

const FIXTURES_DIR = join(import.meta.dir, "__fixtures__");

describe("motion command", () => {
	let realPoyoMedia: unknown;
	let realImageInput: unknown;
	let realArtifacts: unknown;

	beforeAll(async () => {
		realPoyoMedia = { ...(await import("../../src/services/poyo-media.ts")) };
		realImageInput = { ...(await import("../../src/services/image-input.ts")) };
		realArtifacts = { ...(await import("../../src/services/artifacts.ts")) };

		mock.module("../../src/services/poyo-media.ts", () => ({
			generateMedia: async (request: unknown) => {
				genCalls.push({ request });
				return { files: [{ file_type: "video", file_url: "https://out/v.mp4" }] };
			},
			downloadFile: async (_url: string, destPath: string) => destPath,
		}));
		mock.module("../../src/services/image-input.ts", () => ({
			resolveImageInput: async (path: string) => {
				resolveImageCalls.push(path);
				return state.resolveImageBehavior(path);
			},
			resolveVideoInput: async (path: string) => `url-${path.replace(/\.mp4$/, "").replace(/\W+/g, "-")}`,
			validateImageExtension: () => "image/png",
			validateVideoExtension: () => "video/mp4",
		}));
		mock.module("../../src/services/artifacts.ts", () => ({
			resolveOutputPath: (_url: string, output: string, _ext: string) => output,
		}));

		({ createMotionCommand } = await import("../../src/commands/motion.ts"));
	});

	afterAll(() => {
		mock.module("../../src/services/poyo-media.ts", () => ({ ...(realPoyoMedia as object) }));
		mock.module("../../src/services/image-input.ts", () => ({ ...(realImageInput as object) }));
		mock.module("../../src/services/artifacts.ts", () => ({ ...(realArtifacts as object) }));
	});

	beforeEach(() => {
		genCalls.length = 0;
		resolveImageCalls.length = 0;
		state.resolveImageBehavior = async (p: string) => [`url-${p.replace(/\.png$/, "")}`];
	});

	it("AC-005: forwards multiple -i into image_urls; -v stays scalar", async () => {
		const cmd = createMotionCommand();
		await cmd.parseAsync([
			"node",
			"motion",
			"walk",
			"-i",
			"front.png",
			"-i",
			"side.png",
			"-v",
			"ref.mp4",
			"-o",
			"/tmp/out.mp4",
		]);
		expect(resolveImageCalls).toEqual(["front.png", "side.png"]);
		expect(genCalls).toHaveLength(1);
		const req = genCalls[0].request as { input: { image_urls: string[]; video_url: unknown } };
		expect(req.input.image_urls).toEqual(["url-front", "url-side"]);
		expect(typeof req.input.video_url).toBe("string");
	});

	it("AC-003 / FR-006: single -i payload byte-identical to baseline", async () => {
		state.resolveImageBehavior = async (_p) => ["url-hero"];
		const cmd = createMotionCommand();
		await cmd.parseAsync(["node", "motion", "walk", "-i", "hero.png", "-v", "ref.mp4", "-o", "/tmp/out.mp4"]);
		expect(genCalls).toHaveLength(1);
		const baseline = JSON.parse(readFileSync(join(FIXTURES_DIR, "motion-single-i.json"), "utf-8"));
		expect(genCalls[0].request).toEqual(baseline);
	});

	it("AC-005: zero -i is rejected before any HTTP call with a clear message", async () => {
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
			const cmd = createMotionCommand();
			await expect(cmd.parseAsync(["node", "motion", "walk", "-v", "ref.mp4", "-o", "/tmp/out.mp4"])).rejects.toThrow(
				/__exit_/,
			);
			expect(genCalls).toHaveLength(0);
			expect(exitCode).not.toBe(0);
			expect(errMsgs.join("\n")).toMatch(/-i, --image/);
		} finally {
			process.exit = origExit;
			console.error = origErr;
		}
	});
});
