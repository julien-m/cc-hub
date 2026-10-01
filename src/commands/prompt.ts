/** Command handler for managing per-model prompt engineering guides. */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import { type ModelType, VALID_TYPES } from "../data/models.ts";
import { ensureDirs, PROMPTS_DIR } from "../infra/paths.ts";
import { modelToSlug } from "../services/models.ts";
import { getConfig } from "./config.ts";

/**
 * Build the file path for a given model slug.
 * @param slug - The model slug.
 * @returns Absolute path to the prompt guide file.
 */
const slugToPath = (slug: string): string => join(PROMPTS_DIR, `${slug}.md`);

const FALLBACK_MODEL_BY_TYPE: Record<ModelType, string> = {
	text: "anthropic/claude-opus-4.6",
	image: "google/gemini-3.1-flash-image",
	video: "kuaishou/kling-3.0-pro",
	audio: "soniox/soniox",
	music: "poyo/generate-music",
	// Pin the decision guide to the same reproducible version as decide.
	decision: "typesafe/jev-1.13",
};

/**
 * Get the default model for a given type from config or fallback.
 * @param type - The model type.
 * @returns The model identifier string.
 */
const getDefaultModel = (type: ModelType): string => {
	const cfg = getConfig();
	const configKey = `prompt.default.${type}`;
	const fromConfig = cfg[configKey];
	if (typeof fromConfig === "string" && fromConfig.length > 0) return fromConfig;
	return FALLBACK_MODEL_BY_TYPE[type];
};

/**
 * Validate that a string is a known model type.
 * @param type - The type string to validate.
 * @throws {Error} When the type is not recognized.
 */
function validateModelType(type: string): asserts type is ModelType {
	if (!VALID_TYPES.includes(type as ModelType)) {
		throw new Error(`Invalid type: "${type}". Valid values: ${VALID_TYPES.join(", ")}`);
	}
}

/**
 * Extract the type field from a prompt guide file.
 * @param filePath - Path to the guide file.
 * @returns The type string, or null if not found.
 */
const extractTypeFromGuide = (filePath: string): string | null => {
	try {
		const content = readFileSync(filePath, "utf-8");
		const match = content.match(/^type:\s*(.+)$/m);
		return match ? match[1].trim() : null;
	} catch {
		return null;
	}
};

/**
 * Create the `prompt` command group.
 * @returns The configured Commander command.
 */
export const createPromptCommand = (): Command => {
	const prompt = new Command("prompt").description("Manage per-model prompt engineering guides");

	prompt
		.command("get")
		.description("Show the prompt guide for a model or type")
		.option("-m, --model <model>", "Model (e.g. anthropic/claude-opus-4.6)")
		.option("-t, --type <type>", `Type (${VALID_TYPES.join(", ")}) — uses the default model for that type`)
		.action((opts: { model?: string; type?: string }) => {
			if (!opts.model && !opts.type) {
				console.error("Specify --model or --type");
				console.error("   Examples:");
				console.error('     cc-hub prompt get --model "anthropic/claude-opus-4.6"');
				console.error("     cc-hub prompt get --type text");
				process.exit(2);
			}

			let model: string;
			if (opts.model) {
				model = opts.model;
			} else {
				const type = opts.type as ModelType;
				validateModelType(type);
				model = getDefaultModel(type);
				console.error(`Type "${type}" -> default model: ${model}`);
				console.error(`   (configurable: cc-hub config set prompt.default.${type} "other/model")`);
			}

			const slug = modelToSlug(model);
			const filePath = slugToPath(slug);

			if (!existsSync(filePath)) {
				console.error(`No guide found for ${model}`);
				console.error("   Use the /prompt-guide skill to generate one");
				process.exit(2);
			}

			console.log(readFileSync(filePath, "utf-8"));
		});

	prompt
		.command("list")
		.description("List available guides")
		.option("-t, --type <type>", `Filter by type (${VALID_TYPES.join(", ")})`)
		.action((opts: { type?: string }) => {
			ensureDirs();
			if (opts.type) validateModelType(opts.type);

			const files = readdirSync(PROMPTS_DIR).filter((f) => f.endsWith(".md"));

			if (files.length === 0) {
				console.log("No guides available.");
				console.log("   Use the /prompt-guide skill to generate one");
				return;
			}

			let count = 0;
			for (const file of files) {
				const name = file.replace(".md", "");
				const fullPath = join(PROMPTS_DIR, file);
				const type = extractTypeFromGuide(fullPath) || "?";

				if (opts.type && type !== opts.type) continue;

				const stat = statSync(fullPath);
				const updated = stat.mtime.toLocaleDateString("en-US");
				const isDefault = VALID_TYPES.some((t) => type === t && modelToSlug(getDefaultModel(t as ModelType)) === name);
				const marker = isDefault ? " *" : "";
				console.log(`${name.padEnd(35)} [${type.padEnd(5)}] (updated ${updated})${marker}`);
				count++;
			}

			if (opts.type && count === 0) {
				console.log(`No guides of type "${opts.type}".`);
			}
		});

	return prompt;
};
