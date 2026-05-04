/** Command handler for motion control video generation — transfers movement from a reference video onto a character image. */

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Command } from "commander";
import { AppError, exitCode } from "../errors.ts";
import { collect } from "../infra/option-collectors.ts";
import { resolvePrompt } from "../infra/prompt.ts";
import { Spinner } from "../infra/spinner.ts";
import { resolveOutputPath } from "../services/artifacts.ts";
import { resolveImageInput, resolveVideoInput } from "../services/image-input.ts";
import { downloadFile, generateMedia } from "../services/poyo-media.ts";

interface MotionOptions {
	image: string[];
	video: string;
	characterOrientation: string;
	output: string;
}

const resolveReferenceImages = async (paths: ReadonlyArray<string>): Promise<string[]> => {
	if (paths.length === 0) {
		throw new AppError("option '-i, --image <path>' is required at least once", 2);
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
 * Create the `motion` command.
 * @returns The configured Commander command.
 */
export const createMotionCommand = (): Command => {
	const motion = new Command("motion")
		.description("Generate a video via motion transfer (image + reference video)")
		.argument("[prompt]", "Description or context for generation (or pipe via stdin)")
		.option("-i, --image <path>", "Character image (local path or URL, repeatable, at least one required)", collect, [])
		.requiredOption("-v, --video <path>", "Reference video for motion (local path or URL)")
		.option("-c, --character-orientation <value>", "Character orientation (character or video)", "character")
		.requiredOption("-o, --output <path>", "Output file path or name")
		.action(async (promptArg: string | undefined, opts: MotionOptions) => {
			try {
				const { prompt } = await resolvePrompt(promptArg);
				const imageUrls = await resolveReferenceImages(opts.image);

				const videoSpinner = new Spinner("Resolving reference video...").start();
				const videoUrl = await resolveVideoInput(opts.video);
				videoSpinner.succeed("Reference video resolved");

				const spinner = new Spinner("Generating motion control...", { elapsed: true }).start();

				const task = await generateMedia(
					{
						model: "kling-3.0-motion-control",
						input: {
							prompt,
							image_urls: imageUrls,
							video_url: videoUrl,
							character_orientation: opts.characterOrientation,
						},
					},
					(progress) => spinner.update(`Generating motion control... ${progress}%`),
				);

				const videoFile = task.files?.find((f) => f.file_type === "video");
				if (!videoFile) {
					spinner.fail("No video in task result");
					throw new Error("No video in task result — motion control generation may have failed");
				}

				spinner.update("Downloading...");

				const destPath = resolveOutputPath(videoFile.file_url, opts.output, "mp4");
				mkdirSync(dirname(destPath), { recursive: true });
				await downloadFile(videoFile.file_url, destPath);

				spinner.succeed("Video saved");
				console.log(destPath);
			} catch (err) {
				console.error(
					`Motion control generation failed: ${(err as Error).message}. ` +
						"Check image/video inputs and Poyo API credentials.",
				);
				process.exit(exitCode(err, 4));
			}
		});

	return motion;
};
