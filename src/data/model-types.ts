/** Dependency-free model contracts shared by static catalogs and lookup. */
// @spec FR-001: Separate catalog contracts without cycles — .specs/features/009-decision-models/spec.md#fr-001
/** Catalog categories that select a command family. */
export type ModelType = "text" | "image" | "video" | "audio" | "music" | "decision";
/** Providers supported by the shared model registry. */
export type ProviderName = "openrouter" | "copilot" | "poyo" | "codex";
/** Ordered reasoning effort vocabulary shared by providers. */
export type ReasoningEffort = "minimal" | "low" | "medium" | "high" | "xhigh" | "max" | "ultra";

/** Canonical model identity, selectors and provider capabilities. */
export interface Model {
	id: string;
	/** Global user-facing selectors that resolve to this catalog entry. */
	aliases?: readonly string[];
	type: ModelType;
	providers: Partial<Record<ProviderName, string>>;
	reasoningEfforts?: readonly ReasoningEffort[];
}
