/** Command handler for video generation via Poyo. */

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

interface VideoOptions {
	model?: string;
	duration: string;
	aspectRatio: string;
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
	const imageUrls: string[] = [];

	// Resolve references one by one so the first failing path aborts immediately and
	// the outbound `image_urls` array stays in the same order as the repeated `-i` flags.
	for (const path of paths) {
		imageUrls.push(...(await resolveImageInput(path)));
	}

	resolveSpinner.succeed(count === 1 ? "Reference image resolved" : `${count} reference images resolved`);
	return imageUrls;
};

/**
 * Create the `video` command.
 * @returns The configured Commander command.
 */
export const createVideoCommand = (): Command => {
	const video = new Command("video")
		.description("Generate a video from a prompt")
		.argument("[prompt]", "Description of the video to generate (or pipe via stdin)")
		.option("-m, --model <model>", "Model override (replaces VIDEO_MODEL)")
		.option("-d, --duration <seconds>", "Duration in seconds (3-15)", "5")
		.option("-a, --aspect-ratio <ratio>", "Ratio (16:9, 1:1, 9:16)", "16:9")
		.option("-i, --image <path>", "Starting image for animation (local path or URL, repeatable)", collect, [])
		.requiredOption("-o, --output <path>", "Output file path or name")
		.action(async (promptArg: string | undefined, opts: VideoOptions) => {
			try {
				const { prompt } = await resolvePrompt(promptArg);
				const rawModel = opts.model || getEnv("VIDEO_MODEL") || "kuaishou/kling-3.0-pro";
				const model = resolveForProvider(rawModel, "poyo");
				const imageUrls = await resolveReferenceImages(opts.image);

				const spinner = new Spinner(`Generating video with ${model}...`, { elapsed: true }).start();

				const task = await generateMedia(
					{
						model,
						input: {
							prompt,
							duration: parseInt(opts.duration, 10),
							aspect_ratio: opts.aspectRatio,
							sound: true,
							...(imageUrls && { image_urls: imageUrls }),
						},
					},
					(progress) => spinner.update(`Generating video... ${progress}%`),
				);

				const videoFile = task.files?.find((f) => f.file_type === "video");
				if (!videoFile) {
					spinner.fail("No video in task result");
					throw new Error("No video in task result — the model may not support video output");
				}

				spinner.update("Downloading...");

				const destPath = resolveOutputPath(videoFile.file_url, opts.output, "mp4");
				mkdirSync(dirname(destPath), { recursive: true });
				await downloadFile(videoFile.file_url, destPath);

				spinner.succeed("Video saved");
				console.log(destPath);
			} catch (err) {
				console.error(
					`Video generation failed: ${(err as Error).message}. Check the model name and Poyo API credentials.`,
				);
				process.exit(exitCode(err, 4));
			}
		});

	return video;
};
