/** Command handler for image generation via Poyo. */

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Command } from "commander";
import { exitCode } from "../errors.ts";
import { collect } from "../infra/option-collectors.ts";
import { resolvePrompt } from "../infra/prompt.ts";
import { Spinner } from "../infra/spinner.ts";
import { resolveOutputPath } from "../services/artifacts.ts";
import { getEnv } from "../services/env.ts";
import { resolveImageInput } from "../services/image-input.ts";
import { resolveForProvider } from "../services/models.ts";
import { downloadFile, generateMedia } from "../services/poyo-media.ts";

interface ImagineOptions {
	model?: string;
	size: string;
	resolution: string;
	image: string[];
	output: string;
}

const resolveReferenceImages = async (paths: ReadonlyArray<string>): Promise<string[] | undefined> => {
	if (paths.length === 0) {
		return undefined;
	}

	const count = paths.length;
	const label = count === 1 ? "Resolving reference image..." : `Resolving ${count} reference images...`;
	const resolveSpinner = new Spinner(label).start();

	// Resolve independent inputs in parallel while preserving the CLI flag order in the
	// outbound `image_urls` payload because Promise.all keeps results aligned to inputs.
	const resolvedGroups = await Promise.all(paths.map((path) => resolveImageInput(path)));
	const imageUrls = resolvedGroups.flat();

	resolveSpinner.succeed(count === 1 ? "Reference image resolved" : `${count} reference images resolved`);
	return imageUrls;
};

/**
 * Create the `imagine` command.
 * @returns The configured Commander command.
 */
export const createImagineCommand = (): Command => {
	const imagine = new Command("imagine")
		.description("Generate an image from a prompt")
		.argument("[prompt]", "Description of the image to generate (or pipe via stdin)")
		.option("--model <model>", "Model override (replaces IMAGINE_MODEL)")
		.option("--size <ratio>", "Ratio (1:1, 16:9, 9:16, 3:2, 2:3, 4:3, 3:4, 4:5, 5:4, 21:9)", "1:1")
		.option("--resolution <res>", "Resolution (1K, 2K, 4K)", "1K")
		.option("-i, --image <path>", "Reference image (local path or URL, repeatable)", collect, [])
		.requiredOption("-o, --output <path>", "Output file path or name")
		.action(async (promptArg: string | undefined, opts: ImagineOptions) => {
			try {
				const { prompt } = await resolvePrompt(promptArg);
				const rawModel = opts.model || getEnv("IMAGINE_MODEL") || "google/gemini-3.1-flash-image";
				const model = resolveForProvider(rawModel, "poyo");
				const imageUrls = await resolveReferenceImages(opts.image);

				const spinner = new Spinner(`Generating image with ${model}...`, { elapsed: true }).start();

				const task = await generateMedia(
					{
						model,
						input: {
							prompt,
							size: opts.size,
							resolution: opts.resolution,
							...(imageUrls && { image_urls: imageUrls }),
						},
					},
					(progress) => spinner.update(`Generating image... ${progress}%`),
				);

				const imageFile = task.files?.find((f) => f.file_type === "image");
				if (!imageFile) {
					spinner.fail("No image in task result");
					throw new Error("No image in task result — the model may not support image output");
				}

				spinner.update("Downloading...");

				const destPath = resolveOutputPath(imageFile.file_url, opts.output, "png");
				mkdirSync(dirname(destPath), { recursive: true });
				await downloadFile(imageFile.file_url, destPath);

				spinner.succeed("Image saved");
				console.log(destPath);
			} catch (err) {
				console.error(
					`Image generation failed: ${(err as Error).message}. Check the model name and Poyo API credentials.`,
				);
				process.exit(exitCode(err, 4));
			}
		});

	return imagine;
};
