/** Command handler for motion control video generation — transfers movement from a reference video onto a character image. */

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Command } from "commander";
import { exitCode } from "../errors.ts";
import { resolvePrompt } from "../infra/prompt.ts";
import { Spinner } from "../infra/spinner.ts";
import { resolveOutputPath } from "../services/artifacts.ts";
import { resolveImageInput, resolveVideoInput } from "../services/image-input.ts";
import { downloadFile, generateMedia } from "../services/poyo-media.ts";

/**
 * Create the `motion` command.
 * @returns The configured Commander command.
 */
export const createMotionCommand = (): Command => {
	const motion = new Command("motion")
		.description("Generate a video via motion transfer (image + reference video)")
		.argument("[prompt]", "Description or context for generation (or pipe via stdin)")
		.requiredOption("-i, --image <path>", "Character image (local path or URL)")
		.requiredOption("-v, --video <path>", "Reference video for motion (local path or URL)")
		.option("-c, --character-orientation <value>", "Character orientation (character or video)", "character")
		.requiredOption("-o, --output <path>", "Output file path or name")
		.action(
			async (
				promptArg: string | undefined,
				opts: { image: string; video: string; characterOrientation: string; output: string },
			) => {
				try {
					const { prompt } = await resolvePrompt(promptArg);

					const resolveSpinner = new Spinner("Resolving reference image...").start();
					const imageUrls = await resolveImageInput(opts.image);
					resolveSpinner.succeed("Reference image resolved");

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
			},
		);

	return motion;
};
