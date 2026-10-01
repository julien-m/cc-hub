/** Extensible JSON contract for the OpenRouter alpha Decisions API. */

/** JSON data; undefined object properties represent optional TypeScript fields only. */
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
/** Extensible object containing JSON fields and optional TypeScript properties. */
export interface JsonObject {
	[key: string]: JsonValue | undefined;
}

/** Plain or structured instructions accepted by decision primitives. */
export type Guidance = string | JsonObject | JsonValue[];

/** Select one named criterion using plain or structured instructions. */
export interface ChoiceQuestion extends JsonObject {
	type: "choice";
	instructions: Guidance;
	criteria: Record<string, Guidance | null>;
}

/** Evaluate ordered guidance levels; the provider accepts one to ten levels. */
export interface ScoreQuestion extends JsonObject {
	type: "score";
	instructions: Guidance;
	criteria: Guidance[];
}

/** Evaluate a boolean proposition as a probability, with optional true/false guidance. */
export interface NoulQuestion extends JsonObject {
	type: "noul";
	instructions: Guidance;
	criteria?: { true: Guidance; false: Guidance; [key: string]: JsonValue };
}

/** Supported typed question primitives in the request question map. */
export type DecisionQuestion = ChoiceQuestion | ScoreQuestion | NoulQuestion;

/** Percentile-specific provider routing preferences. */
export interface PercentileCutoffs extends JsonObject {
	p50?: number | null;
	p75?: number | null;
	p90?: number | null;
	p99?: number | null;
}

/** Complete documented routing preferences, preserving future JSON fields. */
export interface ProviderPreferences extends JsonObject {
	allow_fallbacks?: boolean | null;
	require_parameters?: boolean | null;
	data_collection?: string | null;
	zdr?: boolean | null;
	enforce_distillable_text?: boolean | null;
	order?: string[] | null;
	only?: string[] | null;
	ignore?: string[] | null;
	quantizations?: string[] | null;
	max_price?: {
		prompt?: string;
		completion?: string;
		image?: string;
		audio?: string;
		request?: string;
		[key: string]: JsonValue | undefined;
	};
	preferred_min_throughput?: number | PercentileCutoffs | null;
	preferred_max_latency?: number | PercentileCutoffs | null;
	sort?: string | { by?: string | null; partition?: string | null; [key: string]: JsonValue | undefined } | null;
	options?: Record<string, JsonObject>;
}

/** Optional observability identifiers with preserved JSON extensions. */
export interface DecisionTrace extends JsonObject {
	trace_id?: string;
	trace_name?: string;
	span_name?: string;
	generation_name?: string;
	parent_span_id?: string;
}

// @spec FR-002: Complete typed decision input — .specs/features/008-jev-openrouter/spec.md#fr-002
/** Request envelope, including provider and observability metadata. */
export interface DecisionRequest extends JsonObject {
	model: string;
	state: Guidance;
	questions: Record<string, DecisionQuestion>;
	provider?: ProviderPreferences | null;
	session_id?: string;
	trace?: DecisionTrace;
	user?: string;
}

/** Selected criterion with optional confidence and per-choice probabilities. */
export interface ChoiceAnswer extends JsonObject {
	type: "choice";
	choice: string;
	confidence?: number;
	probabilities?: Record<string, number>;
}

/** Continuous score with optional level legend, probabilities and confidence. */
export interface ScoreAnswer extends JsonObject {
	type: "score";
	score: number;
	confidence?: number;
	probabilities?: Record<string, number>;
	legend?: Record<string, Guidance>;
}

/** Probability in [0,1] that the proposition is true. */
export interface NoulAnswer extends JsonObject {
	type: "noul";
	noul: number;
}

/** Typed provider answer corresponding to one requested primitive. */
export type DecisionAnswer = ChoiceAnswer | ScoreAnswer | NoulAnswer;

/** Raw successful response; optional provider metadata and extensions remain intact. */
export interface DecisionResponse extends JsonObject {
	model: string;
	answers: Record<string, DecisionAnswer>;
	usage: {
		input_tokens: number;
		output_tokens: number;
		cost?: number;
		[key: string]: JsonValue | undefined;
	};
	id?: string;
	provider?: string;
}
