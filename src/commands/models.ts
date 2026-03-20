/** CLI command for browsing the model registry. */
import { Command } from "commander";
import { listModels } from "../services/models.ts";
import {
	VALID_TYPES,
	type ModelType,
	type ProviderName,
} from "../data/models.ts";

const VALID_PROVIDERS: ProviderName[] = ["openrouter", "copilot", "poyo"];

/** Create the `models` command group with the `list` subcommand. */
export const createModelsCommand = (): Command => {
	const models = new Command("models").description(
		"Gérer le registre des modèles",
	);

	models
		.command("list")
		.description("Lister les modèles disponibles")
		.option(
			"--provider <name>",
			`Filtrer par provider (${VALID_PROVIDERS.join(", ")})`,
		)
		.option(
			"--type <type>",
			`Filtrer par type (${VALID_TYPES.join(", ")})`,
		)
		.action((opts: { provider?: string; type?: string }) => {
			if (opts.type && !VALID_TYPES.includes(opts.type as ModelType)) {
				console.error(
					`Type invalide: "${opts.type}". Valeurs acceptées: ${VALID_TYPES.join(", ")}`,
				);
				process.exit(1);
			}
			if (
				opts.provider &&
				!VALID_PROVIDERS.includes(opts.provider as ProviderName)
			) {
				console.error(
					`Provider invalide: "${opts.provider}". Valeurs acceptées: ${VALID_PROVIDERS.join(", ")}`,
				);
				process.exit(1);
			}

			const results = listModels({
				type: opts.type as ModelType | undefined,
				provider: opts.provider as ProviderName | undefined,
			});

			if (results.length === 0) {
				console.log("Aucun modèle trouvé.");
				return;
			}

			for (const m of results) {
				const providers = Object.keys(m.providers).join(", ");
				console.log(
					`${m.id.padEnd(35)} ${m.type.padEnd(7)} [${providers}]`,
				);
			}
		});

	return models;
};
