import {
	MODELS,
	type Model,
	type ModelType,
	type ProviderName,
	type ReasoningEffort,
	VALID_REASONING_EFFORTS,
} from "../data/models.ts";

const byId: ReadonlyMap<string, Model> = new Map<string, Model>(MODELS.map((m) => [m.id, m]));
const effortRank = new Map<ReasoningEffort, number>(VALID_REASONING_EFFORTS.map((effort, index) => [effort, index]));

/**
 * Finds a model by its canonical ID.
 * @param id - The canonical model ID (e.g. "openai/gpt-5.4")
 * @returns The model definition, or undefined if not found
 */
export const findModel = (id: string): Model | undefined => {
	return byId.get(id);
};

/**
 * Finds a model by its provider-specific name.
 * @param provider - The provider name (e.g. "openrouter", "poyo")
 * @param name - The provider-specific model name
 * @returns The model definition, or undefined if not found
 */
export const findByProviderName = (provider: ProviderName, name: string): Model | undefined => {
	return MODELS.find((m) => m.providers[provider] === name);
};

/**
 * Converts a canonical model ID to its provider-specific name.
 * @param id - The canonical model ID
 * @param provider - The target provider
 * @returns The provider-specific model name
 * @throws Error if the model is unknown or not available on the provider
 */
export const toProviderName = (id: string, provider: ProviderName): string => {
	const model = byId.get(id);
	if (!model) throw new Error(`Unknown model: ${id}`);
	const native = model.providers[provider];
	if (!native) throw new Error(`${id} is not available on ${provider}`);
	return native;
};

/**
 * Resolves user input to a provider-specific model name.
 * Falls through to raw input for OpenRouter if the model is not in the catalog.
 * @param userInput - The user-provided model ID or name
 * @param provider - The target provider
 * @returns The provider-specific model name
 * @throws Error if the model is not available on the provider
 */
export const resolveForProvider = (userInput: string, provider: ProviderName): string => {
	const model = byId.get(userInput);
	if (model) {
		const native = model.providers[provider];
		if (native) return native;
		throw new Error(
			`${userInput} is not available on ${provider}. ` +
				`Use 'cc-hub models list --provider ${provider}' to see available models.`,
		);
	}
	if (provider === "openrouter") {
		return userInput;
	}
	throw new Error(
		`Unknown model: ${userInput}. ` + `Use 'cc-hub models list --provider ${provider}' to see available models.`,
	);
};

/**
 * Converts a canonical model ID to a filesystem-safe slug.
 * @param id - The canonical model ID
 * @returns A lowercase slug with slashes replaced by dashes
 */
export const modelToSlug = (id: string): string => {
	return id
		.replace(/\//g, "-")
		.replace(/[^a-z0-9-]/gi, "")
		.toLowerCase();
};

/**
 * Lists models filtered by type and/or provider.
 * @param opts - Optional filters for model type and provider
 * @returns Array of matching model definitions
 */
export const listModels = (opts?: { type?: ModelType; provider?: ProviderName }): Model[] => {
	return MODELS.filter((m) => {
		if (opts?.type && m.type !== opts.type) return false;
		if (opts?.provider && !m.providers[opts.provider]) return false;
		return true;
	});
};

/**
 * Returns the documented reasoning efforts for a model.
 * @param id - The canonical model ID.
 * @returns Supported efforts, or undefined when OpenRouter does not expose a finite list.
 */
export const getReasoningEfforts = (id: string): readonly ReasoningEffort[] | undefined => {
	return byId.get(id)?.reasoningEfforts;
};

/**
 * Returns the highest documented reasoning effort for a model.
 * @param id - The canonical model ID.
 * @returns The highest effort, or undefined when unknown.
 */
export const getMaxReasoningEffort = (id: string): ReasoningEffort | undefined => {
	return byId.get(id)?.reasoningEfforts?.at(-1);
};

/**
 * Checks model-specific effort support when the registry knows it.
 * Unknown model effort lists are allowed so OpenRouter can apply its own mapping.
 * @param id - The canonical model ID.
 * @param effort - Requested reasoning effort.
 * @returns Whether cc-hub should allow the request.
 */
export const isReasoningEffortSupported = (id: string, effort: ReasoningEffort): boolean => {
	const efforts = getReasoningEfforts(id);
	return efforts === undefined || efforts.includes(effort);
};

/**
 * Maps a cc-hub effort to the closest effort accepted by a registered model.
 * @param id - The canonical model ID.
 * @param effort - Requested cc-hub reasoning effort.
 * @returns The effort to send to OpenRouter.
 */
export const mapReasoningEffortForModel = (id: string, effort: ReasoningEffort): ReasoningEffort => {
	const efforts = getReasoningEfforts(id);
	if (efforts === undefined || efforts.includes(effort)) return effort;

	const requestedRank = effortRank.get(effort) ?? 0;
	const lowerOrEqual = efforts.filter((supported) => (effortRank.get(supported) ?? 0) <= requestedRank).at(-1);
	return lowerOrEqual ?? efforts[0];
};

export {
	type Model,
	type ModelType,
	type ProviderName,
	type ReasoningEffort,
	VALID_REASONING_EFFORTS,
	VALID_TYPES,
} from "../data/models.ts";
