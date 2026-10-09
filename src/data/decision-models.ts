/** Explicit Decisions identities and documented model-specific limits. */
import type { Model } from "./model-types.ts";

/** Optional bounds are applied only when documented for the selected identity. */
export interface DecisionCapabilities {
	readonly model: string;
	readonly aliases?: readonly string[];
	readonly maxQuestions?: number;
	readonly maxChoices?: number;
	readonly maxScoreLevels?: number;
}

// @spec FR-001: Register Luna without changing Jev — .specs/features/009-decision-models/spec.md#fr-001
/** Additive catalog entry; text/chat parameters do not describe Decisions support. */
export const DECISION_MODELS: ReadonlyArray<Model> = [
	{
		id: "openai/gpt-6-luna-decisions",
		type: "decision",
		providers: { openrouter: "openai/gpt-6-luna-decisions" },
		aliases: ["luna-decisions"],
	},
];

// @spec FR-004: Keep bounds model specific — .specs/features/009-decision-models/spec.md#fr-004
// Jev bounds preserve feature008 compatibility; current OpenAPI has no shared choice/score maximum.
// Luna question maximum: openrouter.ai/openai/gpt-6-luna-decisions, checked2026-10-07;
// snapshot .specs/features/009-decision-models/contracts/openrouter-decisions-source.json.
const CAPABILITIES: readonly DecisionCapabilities[] = [
	{ model: "typesafe/jev-1.13", maxChoices: 255, maxScoreLevels: 10 },
	{ model: "~typesafe/jev-latest", maxChoices: 255, maxScoreLevels: 10 },
	{ model: "openai/gpt-6-luna-decisions", aliases: ["luna-decisions"], maxQuestions: 200 },
];

/** Return only known identity-specific limits; unknown models receive common shape validation.
 * @param model The canonical model ID or registered alias.
 * @returns Documented bounds, or undefined for an unknown identity.
 */
export const getDecisionCapabilities = (model: string): DecisionCapabilities | undefined =>
	CAPABILITIES.find((capability) => capability.model === model || capability.aliases?.includes(model));
