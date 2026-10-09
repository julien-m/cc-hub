/** Static catalog of model capabilities and provider-specific identifiers. */
import type { Model, ModelType, ReasoningEffort } from "./model-types.ts";

export type { Model, ModelType, ProviderName, ReasoningEffort } from "./model-types.ts";

import { DECISION_MODELS } from "./decision-models.ts";
import { GENERATION_MODELS } from "./generation-models.ts";
// @spec FR-001: Jev decision models — .specs/features/008-jev-openrouter/spec.md#fr-001
export const VALID_TYPES: readonly ModelType[] = ["text", "image", "video", "audio", "music", "decision"];

// @spec FR-003: Ultra effort vocabulary — .specs/features/007-add-gpt-56-sol-terra-luna-to-codex-provider/spec.md#fr-003
export const VALID_REASONING_EFFORTS: readonly ReasoningEffort[] = [
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
	"max",
	"ultra",
];

export const MODELS: Model[] = [
	// Jev uses OpenRouter's Decisions API rather than chat completions.
	{
		id: "typesafe/jev-1.13",
		type: "decision",
		providers: { openrouter: "typesafe/jev-1.13" },
	},
	{
		id: "~typesafe/jev-latest",
		type: "decision",
		providers: { openrouter: "~typesafe/jev-latest" },
	},
	// @spec FR-001: Register Luna alongside Jev — .specs/features/009-decision-models/spec.md#fr-001
	...DECISION_MODELS,
	// --- Anthropic ---
	// @spec FR-001: Register exact text model — .specs/features/010-model-catalog-update/spec.md#fr-001
	// @spec FR-003: Source-proven ordered efforts — .specs/features/010-model-catalog-update/spec.md#fr-003
	{
		id: "anthropic/claude-sonnet-5.5",
		type: "text",
		providers: { openrouter: "anthropic/claude-sonnet-5.5" },
		reasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
	},
	// @spec FR-001: Register exact text model — .specs/features/010-model-catalog-update/spec.md#fr-001
	// @spec FR-003: Source-proven ordered efforts — .specs/features/010-model-catalog-update/spec.md#fr-003
	{
		id: "anthropic/claude-opus-5.5",
		type: "text",
		providers: { openrouter: "anthropic/claude-opus-5.5" },
		reasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
	},
	{
		id: "anthropic/claude-opus-4.6",
		type: "text",
		providers: {
			openrouter: "anthropic/claude-opus-4.6",
			copilot: "claude-opus-4.6",
		},
		reasoningEfforts: ["low", "medium", "high", "max"],
	},
	{
		id: "anthropic/claude-opus-4.5",
		type: "text",
		providers: {
			openrouter: "anthropic/claude-opus-4.5",
			copilot: "claude-opus-4.5",
		},
	},
	{
		id: "anthropic/claude-sonnet-4.6",
		type: "text",
		providers: {
			openrouter: "anthropic/claude-sonnet-4.6",
			copilot: "claude-sonnet-4.6",
		},
		reasoningEfforts: ["low", "medium", "high", "max"],
	},
	{
		id: "anthropic/claude-sonnet-4.5",
		type: "text",
		providers: {
			openrouter: "anthropic/claude-sonnet-4.5",
			copilot: "claude-sonnet-4.5",
		},
	},
	{
		id: "anthropic/claude-sonnet-4",
		type: "text",
		providers: {
			openrouter: "anthropic/claude-sonnet-4",
			copilot: "claude-sonnet-4",
		},
	},
	{
		id: "anthropic/claude-haiku-4.5",
		type: "text",
		providers: {
			openrouter: "anthropic/claude-haiku-4.5",
			copilot: "claude-haiku-4.5",
		},
	},

	// --- OpenAI ---
	// @spec FR-001: Register exact text model — .specs/features/010-model-catalog-update/spec.md#fr-001
	// @spec FR-003: Source-proven ordered efforts — .specs/features/010-model-catalog-update/spec.md#fr-003
	{
		id: "openai/gpt-6.1-sol",
		type: "text",
		providers: { openrouter: "openai/gpt-6.1-sol" },
		reasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
	},
	// Codex models: OpenRouter strips dots in their slug (gpt-53-codex, not gpt-5.3-codex)
	// @spec FR-001: Codex 5.6 variants — .specs/features/007-add-gpt-56-sol-terra-luna-to-codex-provider/spec.md#fr-001
	{
		id: "openai/gpt-5.6-sol",
		type: "text",
		providers: {
			codex: "gpt-5.6-sol",
		},
		reasoningEfforts: ["low", "medium", "high", "xhigh", "max", "ultra"],
	},
	{
		id: "openai/gpt-5.6-terra",
		type: "text",
		providers: {
			codex: "gpt-5.6-terra",
		},
		reasoningEfforts: ["low", "medium", "high", "xhigh", "max", "ultra"],
	},
	{
		id: "openai/gpt-5.6-luna",
		type: "text",
		providers: {
			codex: "gpt-5.6-luna",
		},
		reasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
	},
	{
		id: "openai/gpt-5.5",
		type: "text",
		providers: {
			openrouter: "openai/gpt-5.5",
			copilot: "gpt-5.5",
			codex: "gpt-5.5",
		},
		reasoningEfforts: ["low", "medium", "high", "xhigh"],
	},
	{
		id: "openai/gpt-5.4",
		type: "text",
		providers: {
			openrouter: "openai/gpt-5.4",
			copilot: "gpt-5.4",
			codex: "gpt-5.4",
		},
		reasoningEfforts: ["low", "medium", "high", "xhigh"],
	},
	{
		id: "openai/gpt-5.4-mini",
		type: "text",
		providers: {
			codex: "gpt-5.4-mini",
		},
	},
	{
		id: "openai/gpt-53-codex",
		type: "text",
		providers: {
			openrouter: "openai/gpt-53-codex",
			copilot: "gpt-5.3-codex",
			codex: "gpt-5.3-codex",
		},
	},
	{
		id: "openai/gpt-53-codex-spark",
		type: "text",
		providers: {
			codex: "gpt-5.3-codex-spark",
		},
	},
	{
		id: "openai/gpt-52-codex",
		type: "text",
		providers: {
			openrouter: "openai/gpt-52-codex",
			copilot: "gpt-5.2-codex",
		},
	},
	{
		id: "openai/gpt-5.2",
		type: "text",
		providers: {
			openrouter: "openai/gpt-5.2",
			copilot: "gpt-5.2",
		},
		reasoningEfforts: ["low", "medium", "high", "xhigh"],
	},
	{
		id: "openai/gpt-51-codex-max",
		type: "text",
		providers: {
			openrouter: "openai/gpt-51-codex-max",
			copilot: "gpt-5.1-codex-max",
		},
	},
	{
		id: "openai/gpt-51-codex",
		type: "text",
		providers: {
			openrouter: "openai/gpt-51-codex",
			copilot: "gpt-5.1-codex",
		},
	},
	{
		id: "openai/gpt-5.1",
		type: "text",
		providers: {
			openrouter: "openai/gpt-5.1",
			copilot: "gpt-5.1",
		},
		reasoningEfforts: ["low", "medium", "high"],
	},
	{
		id: "openai/gpt-5-mini",
		type: "text",
		providers: {
			openrouter: "openai/gpt-5-mini",
			copilot: "gpt-5-mini",
		},
		reasoningEfforts: ["minimal", "low", "medium", "high"],
	},
	{
		id: "openai/gpt-4.1",
		type: "text",
		providers: {
			openrouter: "openai/gpt-4.1",
			copilot: "gpt-4.1",
		},
	},
	{
		id: "openai/gpt-oss-120b",
		type: "text",
		providers: {
			openrouter: "openai/gpt-oss-120b",
		},
		reasoningEfforts: ["low", "medium", "high"],
	},

	// --- Qwen ---
	{
		id: "qwen/qwen3.5-flash",
		type: "text",
		providers: {
			openrouter: "qwen/qwen3.5-flash-02-23",
		},
	},

	// --- Z.AI ---
	{
		id: "z-ai/glm-5.1",
		type: "text",
		providers: {
			openrouter: "z-ai/glm-5.1",
		},
	},
	{
		id: "z-ai/glm-5.2",
		type: "text",
		providers: {
			openrouter: "z-ai/glm-5.2",
		},
		reasoningEfforts: ["high", "xhigh"],
	},

	// --- xAI ---
	// @spec FR-001: Register exact text model — .specs/features/010-model-catalog-update/spec.md#fr-001
	// @spec FR-003: Source-proven ordered efforts — .specs/features/010-model-catalog-update/spec.md#fr-003
	{
		id: "xai/grok-4.6",
		type: "text",
		providers: { openrouter: "x-ai/grok-4.6" },
		reasoningEfforts: ["low", "medium", "high", "xhigh"],
	},
	{
		id: "xai/grok-4.1-fast",
		type: "text",
		providers: {
			openrouter: "x-ai/grok-4.1-fast",
		},
	},
	{
		id: "xai/grok-4.20",
		type: "text",
		providers: {
			openrouter: "x-ai/grok-4.20",
		},
	},

	// --- Google ---
	{
		id: "google/gemini-3-flash",
		type: "text",
		providers: {
			openrouter: "google/gemini-3-flash-preview",
		},
		reasoningEfforts: ["minimal", "low", "medium", "high"],
	},
	{
		id: "google/gemini-3.1-pro-preview",
		type: "text",
		providers: {
			openrouter: "google/gemini-3.1-pro-preview",
		},
		reasoningEfforts: ["low", "medium", "high"],
	},
	{
		id: "google/gemini-3.1-flash-lite-preview",
		type: "text",
		providers: {
			openrouter: "google/gemini-3.1-flash-lite-preview",
		},
		reasoningEfforts: ["minimal", "low", "medium", "high"],
	},
	{
		id: "google/gemini-2.5-flash",
		type: "text",
		providers: {
			openrouter: "google/gemini-2.5-flash",
		},
	},
	{
		id: "google/gemini-2.5-flash-lite",
		type: "text",
		providers: {
			openrouter: "google/gemini-2.5-flash-lite",
		},
	},

	...GENERATION_MODELS,

	// --- Poyo music models ---
	{
		id: "poyo/generate-music",
		type: "music",
		providers: {
			poyo: "generate-music",
		},
	},
	{
		id: "poyo/extend-music",
		type: "music",
		providers: {
			poyo: "extend-music",
		},
	},
	{
		id: "poyo/upload-and-cover-audio",
		type: "music",
		providers: {
			poyo: "upload-and-cover-audio",
		},
	},
	{
		id: "poyo/upload-and-extend-audio",
		type: "music",
		providers: {
			poyo: "upload-and-extend-audio",
		},
	},
	{
		id: "poyo/add-instrumental",
		type: "music",
		providers: {
			poyo: "add-instrumental",
		},
	},
	{
		id: "poyo/add-vocals",
		type: "music",
		providers: {
			poyo: "add-vocals",
		},
	},
	{
		id: "poyo/get-timestamped-lyrics",
		type: "music",
		providers: {
			poyo: "get-timestamped-lyrics",
		},
	},
	{
		id: "poyo/boost-music-style",
		type: "music",
		providers: {
			poyo: "boost-music-style",
		},
	},
	{
		id: "poyo/generate-music-cover",
		type: "music",
		providers: {
			poyo: "generate-music-cover",
		},
	},
	{
		id: "poyo/replace-section",
		type: "music",
		providers: {
			poyo: "replace-section",
		},
	},
	{
		id: "poyo/generate-persona",
		type: "music",
		providers: {
			poyo: "generate-persona",
		},
	},
	{
		id: "poyo/generate-lyrics",
		type: "music",
		providers: {
			poyo: "generate-lyrics",
		},
	},
	{
		id: "poyo/convert-to-wav",
		type: "music",
		providers: {
			poyo: "convert-to-wav",
		},
	},
	{
		id: "poyo/separate-vocals",
		type: "music",
		providers: {
			poyo: "separate-vocals",
		},
	},
	{
		id: "poyo/stem-split",
		type: "music",
		providers: {
			poyo: "stem-split",
		},
	},
	{
		id: "poyo/upload-and-separate-vocals",
		type: "music",
		providers: {
			poyo: "upload-and-separate-vocals",
		},
	},
	{
		id: "poyo/create-music-video",
		type: "music",
		providers: {
			poyo: "create-music-video",
		},
	},
];
