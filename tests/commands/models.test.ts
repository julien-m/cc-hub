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
		expect(lines).toHaveLength(2);
		expect(lines.join("\n")).toContain("typesafe/jev-1.13");
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
