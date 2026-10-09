/** Tests pure catalog lookup, capability routing and bounded effort mapping. */
import { describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { MODELS, type ProviderName, type ReasoningEffort } from "../../src/data/models.ts";
import {
	findByProviderName,
	findModel,
	getMaxReasoningEffort,
	getReasoningEfforts,
	isReasoningEffortSupported,
	listModels,
	mapReasoningEffortForModel,
	modelToSlug,
	resolveForProvider,
	toProviderName,
} from "../../src/services/models.ts";

// ---------------------------------------------------------------------------
// findModel
// ---------------------------------------------------------------------------
describe("findModel", () => {
	it("should discover pinned Jev and latest as OpenRouter-only decision models", () => {
		for (const id of ["typesafe/jev-1.13", "~typesafe/jev-latest"]) {
			expect(findModel(id)?.type).toBe("decision");
			expect(toProviderName(id, "openrouter")).toBe(id);
			expect(() => resolveForProvider(id, "codex")).toThrow("not available");
			expect(listModels({ type: "text" }).some((model) => model.id === id)).toBe(false);
		}
		expect(listModels({ type: "decision", provider: "openrouter" })).toHaveLength(3);
	});
	it("should return model by canonical ID", () => {
		const m = findModel("anthropic/claude-sonnet-4");
		expect(m).toBeDefined();
		expect(m?.id).toBe("anthropic/claude-sonnet-4");
		expect(m?.type).toBe("text");
	});

	it("should return undefined for unknown ID", () => {
		expect(findModel("unknown/model-99")).toBeUndefined();
	});

	it("should return OpenAI gpt-oss-120b by canonical ID", () => {
		const model = findModel("openai/gpt-oss-120b");
		expect(model).toBeDefined();
		expect(model?.id).toBe("openai/gpt-oss-120b");
		expect(model?.type).toBe("text");
		expect(model?.providers.openrouter).toBe("openai/gpt-oss-120b");
	});

	it("should return Z.AI glm-5.2 by canonical ID", () => {
		const model = findModel("z-ai/glm-5.2");
		expect(model).toBeDefined();
		expect(model?.id).toBe("z-ai/glm-5.2");
		expect(model?.type).toBe("text");
		expect(model?.providers.openrouter).toBe("z-ai/glm-5.2");
	});
});

// ---------------------------------------------------------------------------
// findByProviderName
// ---------------------------------------------------------------------------
describe("findByProviderName", () => {
	it("should find by copilot display name", () => {
		const m = findByProviderName("copilot", "claude-sonnet-4");
		expect(m).toBeDefined();
		expect(m?.id).toBe("anthropic/claude-sonnet-4");
	});

	it("should find by poyo native name", () => {
		const m = findByProviderName("poyo", "kling-3.0/pro");
		expect(m).toBeDefined();
		expect(m?.id).toBe("kuaishou/kling-3.0-pro");
	});

	it("should return undefined for unknown provider name", () => {
		expect(findByProviderName("copilot", "Nonexistent Model")).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// toProviderName
// ---------------------------------------------------------------------------
describe("toProviderName", () => {
	it("should translate canonical ID to copilot name", () => {
		expect(toProviderName("openai/gpt-4.1", "copilot")).toBe("gpt-4.1");
	});

	it("should translate canonical ID to poyo name", () => {
		expect(toProviderName("google/nano-banana-2", "poyo")).toBe("nano-banana-2");
	});

	it("should self-map openrouter (ID equals provider name)", () => {
		expect(toProviderName("anthropic/claude-sonnet-4", "openrouter")).toBe("anthropic/claude-sonnet-4");
	});

	it("should throw for unknown model ID", () => {
		expect(() => toProviderName("unknown/model", "copilot")).toThrow("Unknown model");
	});

	it("should throw for unavailable provider", () => {
		// gemini-2.5-flash has no copilot entry
		expect(() => toProviderName("google/gemini-2.5-flash", "copilot")).toThrow("not available on copilot");
	});

	it("should keep gpt-5.6 variants unavailable on openrouter", () => {
		expect(() => toProviderName("openai/gpt-5.6-sol", "openrouter")).toThrow("not available");
	});
});

// ---------------------------------------------------------------------------
// resolveForProvider
// ---------------------------------------------------------------------------
describe("resolveForProvider", () => {
	it("should resolve registered model to copilot name", () => {
		expect(resolveForProvider("openai/gpt-4.1", "copilot")).toBe("gpt-4.1");
	});

	it("should resolve registered model to poyo name", () => {
		expect(resolveForProvider("google/gemini-3.1-flash-image", "poyo")).toBe("nano-banana-2-new");
	});

	it("should resolve nano-banana-2 pro to poyo name", () => {
		expect(resolveForProvider("google/nano-banana-2", "poyo")).toBe("nano-banana-2");
	});

	it("should resolve nano-banana-2-edit pro to poyo name", () => {
		expect(resolveForProvider("google/nano-banana-2-edit", "poyo")).toBe("nano-banana-2-edit");
	});

	it("should resolve registered model to openrouter name", () => {
		expect(resolveForProvider("anthropic/claude-sonnet-4", "openrouter")).toBe("anthropic/claude-sonnet-4");
	});

	it("should resolve OpenAI gpt-oss-120b to its OpenRouter name", () => {
		expect(resolveForProvider("openai/gpt-oss-120b", "openrouter")).toBe("openai/gpt-oss-120b");
	});

	it("should resolve Z.AI glm-5.2 to its OpenRouter name", () => {
		expect(resolveForProvider("z-ai/glm-5.2", "openrouter")).toBe("z-ai/glm-5.2");
	});

	it("should pass through unregistered model for openrouter", () => {
		expect(resolveForProvider("meta/llama-4-scout", "openrouter")).toBe("meta/llama-4-scout");
	});

	it("should throw for unregistered model on copilot", () => {
		expect(() => resolveForProvider("meta/llama-4-scout", "copilot")).toThrow("Unknown model");
		expect(() => resolveForProvider("meta/llama-4-scout", "copilot")).toThrow("cc-hub models list");
	});

	it("should throw for unregistered model on poyo", () => {
		expect(() => resolveForProvider("meta/llama-4-scout", "poyo")).toThrow("Unknown model");
	});

	it("should throw with helpful message for registered model unavailable on provider", () => {
		// gemini-2.5-flash has only openrouter
		expect(() => resolveForProvider("google/gemini-2.5-flash", "copilot")).toThrow("not available on copilot");
		expect(() => resolveForProvider("google/gemini-2.5-flash", "copilot")).toThrow("cc-hub models list");
	});

	it("should resolve gpt-5.6 variants to codex native names", () => {
		expect(resolveForProvider("openai/gpt-5.6-sol", "codex")).toBe("gpt-5.6-sol");
		expect(resolveForProvider("openai/gpt-5.6-terra", "codex")).toBe("gpt-5.6-terra");
		expect(resolveForProvider("openai/gpt-5.6-luna", "codex")).toBe("gpt-5.6-luna");
	});
});

// ---------------------------------------------------------------------------
// modelToSlug
// ---------------------------------------------------------------------------
describe("modelToSlug", () => {
	it("should convert standard ID with slash", () => {
		expect(modelToSlug("anthropic/claude-sonnet-4")).toBe("anthropic-claude-sonnet-4");
	});

	it("should handle codex ID (already no dots)", () => {
		expect(modelToSlug("openai/gpt-53-codex")).toBe("openai-gpt-53-codex");
	});

	it("should convert poyo image model ID", () => {
		expect(modelToSlug("google/gemini-3.1-flash-image")).toBe("google-gemini-31-flash-image");
	});

	it("should strip dots from kling ID", () => {
		expect(modelToSlug("kuaishou/kling-3.0-pro")).toBe("kuaishou-kling-30-pro");
	});

	it("should return empty for empty string", () => {
		expect(modelToSlug("")).toBe("");
	});

	it("should lowercase uppercase input", () => {
		expect(modelToSlug("OpenAI/GPT-4.1")).toBe("openai-gpt-41");
	});
});

// ---------------------------------------------------------------------------
// listModels
// ---------------------------------------------------------------------------
describe("listModels", () => {
	it("should return all models when no filter", () => {
		const all = listModels();
		expect(all.length).toBeGreaterThan(0);
	});

	it("should filter by type", () => {
		const images = listModels({ type: "image" });
		expect(images.length).toBeGreaterThan(0);
		expect(images.every((m) => m.type === "image")).toBe(true);
	});

	it("should filter by provider", () => {
		const copilot = listModels({ provider: "copilot" });
		expect(copilot.length).toBeGreaterThan(0);
		expect(copilot.every((m) => m.providers.copilot !== undefined)).toBe(true);
	});

	it("should apply combined type + provider filter", () => {
		const textPoyo = listModels({ type: "text", provider: "poyo" });
		expect(textPoyo.every((m) => m.type === "text" && m.providers.poyo !== undefined)).toBe(true);
	});

	it("should include OpenAI gpt-oss-120b in OpenRouter text models", () => {
		const openrouterText = listModels({ type: "text", provider: "openrouter" });
		expect(openrouterText.some((m) => m.id === "openai/gpt-oss-120b")).toBe(true);
	});

	it("should include Z.AI glm-5.2 in OpenRouter text models", () => {
		const openrouterText = listModels({ type: "text", provider: "openrouter" });
		expect(openrouterText.some((m) => m.id === "z-ai/glm-5.2")).toBe(true);
	});

	it("should return empty array when no matches", () => {
		const result = listModels({ type: "audio", provider: "copilot" });
		expect(result).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// reasoning efforts
// ---------------------------------------------------------------------------
describe("reasoning efforts", () => {
	it("should expose supported efforts for GLM 5.2", () => {
		expect(getReasoningEfforts("z-ai/glm-5.2")).toEqual(["high", "xhigh"]);
		expect(getMaxReasoningEffort("z-ai/glm-5.2")).toBe("xhigh");
	});

	it("should expose max effort for Claude 4.6 models", () => {
		expect(getReasoningEfforts("anthropic/claude-sonnet-4.6")).toEqual(["low", "medium", "high", "max"]);
		expect(getMaxReasoningEffort("anthropic/claude-sonnet-4.6")).toBe("max");
	});

	it("should validate effort against model-specific support when known", () => {
		expect(isReasoningEffortSupported("z-ai/glm-5.2", "xhigh")).toBe(true);
		expect(isReasoningEffortSupported("z-ai/glm-5.2", "max")).toBe(false);
	});

	it("should map requested effort down to the closest supported effort", () => {
		expect(mapReasoningEffortForModel("z-ai/glm-5.2", "max")).toBe("xhigh");
		expect(mapReasoningEffortForModel("openai/gpt-oss-120b", "max")).toBe("high");
		expect(mapReasoningEffortForModel("openai/gpt-oss-120b", "medium")).toBe("medium");
	});

	it("should allow any valid OpenRouter effort when model support is unknown", () => {
		expect(getReasoningEfforts("google/gemini-2.5-flash")).toBeUndefined();
		expect(isReasoningEffortSupported("google/gemini-2.5-flash", "xhigh")).toBe(true);
		expect(mapReasoningEffortForModel("google/gemini-2.5-flash", "xhigh")).toBe("xhigh");
	});

	it("should expose ultra as max effort for sol and cap luna at max", () => {
		expect(getMaxReasoningEffort("openai/gpt-5.6-sol")).toBe("ultra");
		expect(getMaxReasoningEffort("openai/gpt-5.6-luna")).toBe("max");
		expect(mapReasoningEffortForModel("openai/gpt-5.6-luna", "ultra")).toBe("max");
	});
});

// @spec FR-001: Exact source-backed text entries — .specs/features/010-model-catalog-update/spec.md#fr-001
// @spec FR-003: Ordered supported effort bounds — .specs/features/010-model-catalog-update/spec.md#fr-003
// @spec FR-004: Preserve prior catalog values — .specs/features/010-model-catalog-update/spec.md#fr-004
// @spec FR-006: Prove catalog regressions — .specs/features/010-model-catalog-update/spec.md#fr-006
describe("source-backed text catalog additions", () => {
	const ids = ["openai/gpt-6.1-sol", "anthropic/claude-sonnet-5.5", "anthropic/claude-opus-5.5", "xai/grok-4.6"];
	it("should register exactly one OpenRouter-only text entry per requested ID", () => {
		for (const id of ids) {
			const native = id === "xai/grok-4.6" ? "x-ai/grok-4.6" : id;
			expect(MODELS.filter((model) => model.id === id)).toHaveLength(1);
			expect(findModel(id)?.type).toBe("text");
			expect(findModel(id)?.providers).toEqual({ openrouter: native });
			expect(resolveForProvider(id, "openrouter")).toBe(native);
		}
	});
	it("should preserve source effort lists and map minimal/ultra to their documented bounds", () => {
		for (const id of ids) {
			const upperEfforts: ReasoningEffort[] = id === "xai/grok-4.6" ? [] : ["max"];
			const efforts: ReasoningEffort[] = ["low", "medium", "high", "xhigh", ...upperEfforts];
			expect(getReasoningEfforts(id)).toEqual(efforts);
			for (const effort of efforts) expect(mapReasoningEffortForModel(id, effort)).toBe(effort);
			expect(mapReasoningEffortForModel(id, "minimal")).toBe("low");
			expect(mapReasoningEffortForModel(id, "ultra")).toBe(id === "xai/grok-4.6" ? "xhigh" : "max");
		}
	});
	it("should retain every pre-addition field and order from the independent 105-entry capture", () => {
		const captured = readFileSync(new URL("../fixtures/model-catalog-baseline.json", import.meta.url));
		expect(createHash("sha256").update(captured).digest("hex")).toBe(
			"19ef7f285fbe1f4ff026f8fa5653b0fe2390961b316a59f16d2a3d700945a96a",
		);
		const baseline: unknown = JSON.parse(captured.toString());
		expect(baseline).toHaveLength(105);
		expect(MODELS).toHaveLength(109);
		// Compare only the independently captured prior IDs; additions cannot rewrite the baseline.
		// Compare the unknown JSON boundary directly, without coercing it into trusted Model records.
		expect<unknown>(MODELS.filter((model) => !ids.includes(model.id))).toEqual(baseline);
		const priorJSON = JSON.stringify(MODELS.filter((model) => !ids.includes(model.id)));
		expect(priorJSON).toBe(JSON.stringify(baseline));
		// Canonical digest is derived only from the immutable pre-app capture, never from the additions.
		expect(createHash("sha256").update(priorJSON).digest("hex")).toBe(
			"00d3955ab961b03a398f68f4098b13d3cdee5c264332af155cbbeb5558bcc0cc",
		);
		expect(findModel("openai/gpt-6-luna-decisions")?.type).toBe("decision");
		expect(findModel("typesafe/jev-1.13")?.type).toBe("decision");
	});
});

// @spec FR-002: Verify provider-only resolution — .specs/features/010-model-catalog-update/spec.md#fr-002
describe("new text provider capabilities", () => {
	it("should include every new text model only on its verified provider", () => {
		const unsupportedProviders: ProviderName[] = ["copilot", "codex", "poyo"];
		for (const id of [
			"openai/gpt-6.1-sol",
			"anthropic/claude-sonnet-5.5",
			"anthropic/claude-opus-5.5",
			"xai/grok-4.6",
		]) {
			expect(listModels({ type: "text", provider: "openrouter" }).filter((model) => model.id === id)).toHaveLength(1);
			for (const provider of unsupportedProviders) {
				expect(listModels({ provider }).some((model) => model.id === id)).toBe(false);
				expect(() => resolveForProvider(id, provider)).toThrow(`${id} is not available on ${provider}`);
				expect(() => resolveForProvider(id, provider)).toThrow(`cc-hub models list --provider ${provider}`);
			}
		}
	});

	// @spec FR-004: Preserve defaults and ask routing — .specs/features/010-model-catalog-update/spec.md#fr-004
	it("should retain default-bearing configuration and ask routing from independent pre-app source captures", () => {
		// These digests were captured before additions; the test reads source, never personal config or Keychain.
		for (const [path, digest] of [
			["../../src/services/env.ts", "27eaae131b290455a9d41627d8b72c94839e56b780f32cfab150903c3213e535"],
			["../../src/commands/ask.ts", "07583c6546e25d3cb31e35128cc5bc7cd66d6cc02eaa7659308cac6c800e6e37"],
		]) {
			expect(
				createHash("sha256")
					.update(readFileSync(new URL(path, import.meta.url)))
					.digest("hex"),
			).toBe(digest);
		}
	});

	it("should retain direct native Grok raw-ID pass-through without claiming alias-specific effort mapping", () => {
		expect(resolveForProvider("x-ai/grok-4.6", "openrouter")).toBe("x-ai/grok-4.6");
		expect(getReasoningEfforts("x-ai/grok-4.6")).toBeUndefined();
		expect(mapReasoningEffortForModel("x-ai/grok-4.6", "ultra")).toBe("ultra");
	});
});
