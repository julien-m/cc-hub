import { describe, expect, it } from "bun:test";
import { createModelsCommand } from "../../src/commands/models.ts";

describe("models command", () => {
	it("should list both Jev decision versions without labeling them text", async () => {
		const lines: string[] = [];
		const realLog = console.log;
		console.log = (message?: unknown) => lines.push(String(message));
		try {
			await createModelsCommand().parseAsync([
				"node",
				"models",
				"list",
				"--provider",
				"openrouter",
				"--type",
				"decision",
			]);
		} finally {
			console.log = realLog;
		}
		expect(lines).toHaveLength(3);
		expect(lines.join("\n")).toContain("typesafe/jev-1.13");
		expect(lines.join("\n")).toContain("openai/gpt-6-luna-decisions");
		expect(lines.join("\n")).toContain("~typesafe/jev-latest");
		expect(lines.every((line) => line.includes("decision") && line.includes("openrouter"))).toBe(true);
	});
	it("should show max reasoning effort when listing OpenRouter text models", async () => {
		const lines: string[] = [];
		const realLog = console.log;
		console.log = (message?: unknown) => {
			lines.push(String(message));
		};
		try {
			await createModelsCommand().parseAsync(["node", "models", "list", "--provider", "openrouter", "--type", "text"]);
		} finally {
			console.log = realLog;
		}

		expect(lines.find((line) => line.includes("z-ai/glm-5.2"))).toContain("max-effort:xhigh");
		expect(lines.find((line) => line.includes("anthropic/claude-sonnet-4.6"))).toContain("max-effort:max");
	});
});

// @spec FR-001: Discover four exact text models — .specs/features/010-model-catalog-update/spec.md#fr-001
// @spec FR-006: Actual command output assertions — .specs/features/010-model-catalog-update/spec.md#fr-006
describe("new text models command discovery", () => {
	it("should display exactly one OpenRouter text row and documented maximum for each new model", async () => {
		const lines: string[] = [];
		const realLog = console.log;
		console.log = (message?: unknown) => lines.push(String(message));
		try {
			await createModelsCommand().parseAsync(["bun", "models", "list", "--provider", "openrouter", "--type", "text"]);
		} finally {
			console.log = realLog;
		}
		for (const id of [
			"openai/gpt-6.1-sol",
			"anthropic/claude-sonnet-5.5",
			"anthropic/claude-opus-5.5",
			"xai/grok-4.6",
		]) {
			const matched = lines.filter((line) => line.split(/\s+/)[0] === id);
			expect(matched).toHaveLength(1);
			expect(matched[0]).toContain("text");
			expect(matched[0]).toContain("openrouter");
			expect(matched[0]).toContain(`max-effort:${id === "xai/grok-4.6" ? "xhigh" : "max"}`);
		}
	});
});
