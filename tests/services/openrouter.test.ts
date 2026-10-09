/** Tests the unchanged OpenRouter request builder in isolated Bun processes. */
import { describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Build independent exact expected plain JSON envelope. */
const expectedJsonBody = (native: string): Record<string, unknown> => ({
	model: native,
	messages: [
		{ role: "system", content: "Respond with valid JSON only. No markdown, no explanation, no code fences." },
		{ role: "user", content: "JSON question" },
	],
	response_format: { type: "json_object" },
});

/** Build independent exact context/schema envelope with reasoning only when explicitly selected. */
const expectedContextBody = (
	native: string,
	schema: Record<string, unknown>,
	effort: string | undefined,
): Record<string, unknown> => ({
	model: native,
	messages: [
		{ role: "system", content: "Respond with valid JSON only. No markdown, no explanation, no code fences." },
		{ role: "user", content: "Compiler question" },
		{
			role: "user",
			content:
				'<file path="context.ts">\nexport const answer = 42;\n</file>\n\n<stdin>\npiped compiler context\n</stdin>',
		},
	],
	response_format: { type: "json_schema", json_schema: schema },
	...(effort ? { reasoning: { effort, exclude: true } } : {}),
});

/** Controlled isolated child request and response observations. */
interface ObservedRequests {
	requests: Array<{ url: string; body: Record<string, unknown> }>;
	outputs: string[];
}

/** Import real client after mocking only external HTTP/config boundaries and capture its envelopes. */
const observeRequests = (
	id: string,
	schema: Record<string, unknown>,
	directory: string,
	root: string,
): ObservedRequests => {
	// Import real client and mapper after replacing only configuration/HTTP output boundaries.
	const script = `import { mock } from "bun:test";
mock.module(${JSON.stringify(join(root, "src/services/env.ts"))},()=>({getEnv:(key:string)=>key==="OPENROUTER_BASE_URL"?"https://fixture.test/api/v1":key==="OPENROUTER_API_KEY"?"fixture-only":undefined}));
const requests: Array<{url:string;body:unknown}> = [];
// The isolated client always supplies URL/RequestInit, and this fixture returns a real Response.
globalThis.fetch = (async (url:unknown, options:RequestInit) => {requests.push({url:String(url),body:JSON.parse(String(options.body))});return new Response(JSON.stringify({choices:[{message:{content:"fixture-output"}}]}));}) as typeof fetch;
const {askLLM}=await import(${JSON.stringify(join(root, "src/services/openrouter.ts"))});
const {mapReasoningEffortForModel,resolveForProvider}=await import(${JSON.stringify(join(root, "src/services/models.ts"))});
const model=resolveForProvider(${JSON.stringify(id)},"openrouter");
const outputs=[];
for(const effort of [undefined,"minimal","high","ultra"] as const){outputs.push(await askLLM("Compiler question",{model,files:[{path:"context.ts",content:"export const answer = 42;"}],stdin:"piped compiler context",json:true,jsonSchema:${JSON.stringify(schema)},effort:effort?mapReasoningEffortForModel(${JSON.stringify(id)},effort):undefined}));}
outputs.push(await askLLM("JSON question",{model,json:true}));
console.log(JSON.stringify({requests,outputs}));`;
	const path = join(directory, "observe.ts");
	writeFileSync(path, script);
	// Run isolated argv with a timeout so persistent Bun module mocks cannot contaminate other suites.
	const result = Bun.spawnSync([process.execPath, path], { cwd: root, stdout: "pipe", stderr: "pipe", timeout: 10000 });
	expect(result.exitCode).toBe(0);
	// The child emits only the controlled fixture envelope; its successful exit is asserted first.
	return JSON.parse(result.stdout.toString()) as ObservedRequests;
};

// @spec FR-002: Preserve actual HTTP request contract — .specs/features/010-model-catalog-update/spec.md#fr-002
// @spec FR-003: Omitted or exclude-true reasoning — .specs/features/010-model-catalog-update/spec.md#fr-003
// @spec FR-006: Deterministic HTTP boundary proof — .specs/features/010-model-catalog-update/spec.md#fr-006
describe("new model OpenRouter HTTP boundaries", () => {
	it.each([
		"openai/gpt-6.1-sol",
		"anthropic/claude-sonnet-5.5",
		"anthropic/claude-opus-5.5",
		"xai/grok-4.6",
	])("should preserve full requests and provider-default reasoning for %s", (id) => {
		const directory = mkdtempSync(join(tmpdir(), "model-catalog-http-"));
		const root = new URL("../..", import.meta.url).pathname;
		const native = id === "xai/grok-4.6" ? "x-ai/grok-4.6" : id;
		const schema = { name: "answer", schema: { type: "object" } };
		try {
			const observed = observeRequests(id, schema, directory, root);
			expect(observed.outputs).toEqual(Array<string>(5).fill("fixture-output"));
			for (const [index, effort] of [undefined, "low", "high", id === "xai/grok-4.6" ? "xhigh" : "max"].entries()) {
				expect(observed.requests[index]).toEqual({
					url: "https://fixture.test/api/v1/chat/completions",
					body: expectedContextBody(native, schema, effort),
				});
			}
			expect(observed.requests[4].body).toEqual(expectedJsonBody(native));
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});
});
