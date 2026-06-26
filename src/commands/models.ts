/** CLI command for browsing the model registry. */
import { Command } from "commander";
import { type ModelType, type ProviderName, VALID_TYPES } from "../data/models.ts";
import { getMaxReasoningEffort, listModels } from "../services/models.ts";

const VALID_PROVIDERS: ProviderName[] = ["openrouter", "copilot", "poyo", "codex"];

/**
 * Create the `models` command group with the `list` subcommand.
 * @returns The configured Commander command.
 */
export const createModelsCommand = (): Command => {
	const models = new Command("models").description("Manage the model registry");

	models
		.command("list")
		.description("List available models")
		.option("-p, --provider <name>", `Filter by provider (${VALID_PROVIDERS.join(", ")})`)
		.option("-t, --type <type>", `Filter by type (${VALID_TYPES.join(", ")})`)
		.action((opts: { provider?: string; type?: string }) => {
			if (opts.type && !VALID_TYPES.includes(opts.type as ModelType)) {
				console.error(`Invalid type: "${opts.type}". Valid values: ${VALID_TYPES.join(", ")}`);
				process.exit(2);
			}
			if (opts.provider && !VALID_PROVIDERS.includes(opts.provider as ProviderName)) {
				console.error(`Invalid provider: "${opts.provider}". Valid values: ${VALID_PROVIDERS.join(", ")}`);
				process.exit(2);
			}

			const results = listModels({
				type: opts.type as ModelType | undefined,
				provider: opts.provider as ProviderName | undefined,
			});

			if (results.length === 0) {
				console.log("No models found.");
				return;
			}

			for (const m of results) {
				const providers = Object.keys(m.providers).join(", ");
				const maxEffort = getMaxReasoningEffort(m.id);
				const effortLabel = maxEffort ? ` max-effort:${maxEffort}` : "";
				console.log(`${m.id.padEnd(35)} ${m.type.padEnd(7)} [${providers}]${effortLabel}`);
			}
		});

	return models;
};
