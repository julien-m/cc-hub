/** Generic decision registry and source-backed capabilities. */
// @spec AC-001: Decision catalog compatibility — .specs/features/009-decision-models/spec.md#ac-001
// @spec AC-002: Known and future selectors — .specs/features/009-decision-models/spec.md#ac-002
// @spec AC-005: Identity-specific bounds — .specs/features/009-decision-models/spec.md#ac-005
import { describe, expect, it } from "bun:test";
import { getDecisionCapabilities } from "../../src/data/decision-models.ts";
import { AppError } from "../../src/errors.ts";
import {
	findByProviderName,
	findModel,
	listModels,
	resolveDecisionModel,
	resolveForProvider,
} from "../../src/services/models.ts";

describe("generic decision capabilities", () => {
	it("should discover Luna aliases with unchanged Jev entries and excludes decisions from text", () => {
		const id = "openai/gpt-6-luna-decisions";
		expect(findModel(id)?.type).toBe("decision");
		expect(findModel("luna-decisions")).toBe(findModel(id));
		expect(findByProviderName("openrouter", id)).toBe(findModel(id));
		expect(resolveForProvider("luna-decisions", "openrouter")).toBe(id);
		expect(listModels({ type: "decision", provider: "openrouter" }).map((model) => model.id)).toEqual([
			"typesafe/jev-1.13",
			"~typesafe/jev-latest",
			id,
		]);
		expect(listModels({ type: "text" }).some((model) => model.id === id)).toBe(false);
	});
	it("should normalize only registered aliases and preserves unknown canonical IDs", () => {
		expect(resolveDecisionModel("luna-decisions")).toBe("openai/gpt-6-luna-decisions");
		expect(resolveDecisionModel("~typesafe/jev-latest")).toBe("~typesafe/jev-latest");
		expect(resolveDecisionModel("unknown/future-decisions")).toBe("unknown/future-decisions");
		for (const model of [
			"",
			"  ",
			"openai/gpt-4.1",
			" unknown/future-decisions ",
			" luna-decisions ",
			" openai/gpt-6-luna-decisions ",
			" openai/gpt-4.1 ",
		])
			expect(() => resolveDecisionModel(model)).toThrow(AppError);
	});
	it("should keep Jev bounds identity scoped while Luna has only its documented question maximum", () => {
		for (const model of ["typesafe/jev-1.13", "~typesafe/jev-latest"])
			expect(getDecisionCapabilities(model)).toMatchObject({ maxChoices: 255, maxScoreLevels: 10 });
		expect(getDecisionCapabilities("luna-decisions")).toMatchObject({ maxQuestions: 200 });
		expect(getDecisionCapabilities("openai/gpt-6-luna-decisions")?.maxChoices).toBeUndefined();
		expect(getDecisionCapabilities("openai/gpt-6-luna-decisions")?.maxScoreLevels).toBeUndefined();
		expect(getDecisionCapabilities("unknown/future-decisions")).toBeUndefined();
	});
});
