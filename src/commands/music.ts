/** Command handler for music generation via Poyo. */

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Command } from "commander";
import { exitCode } from "../errors.ts";
import { resolvePrompt } from "../infra/prompt.ts";
import { Spinner } from "../infra/spinner.ts";
import { resolveOutputPath } from "../services/artifacts.ts";
import { getEnv } from "../services/env.ts";
import { resolveForProvider } from "../services/models.ts";
import { downloadFile, generateMedia } from "../services/poyo-media.ts";

/**
 * Create the `music` command group.
 * @returns The configured Commander command.
 */
export const createMusicCommand = (): Command => {
	const music = new Command("music").description("Generate music via Poyo");

	music
		.command("generate")
		.description("Generate music from a prompt")
		.argument("[prompt]", "Description of the music to generate (or pipe via stdin)")
		.option("-m, --model <model>", "Model override (replaces MUSIC_MODEL)")
		.requiredOption("-o, --output <path>", "Output file path or name")
		.action(async (promptArg: string | undefined, opts: { model?: string; output: string }) => {
			try {
				const { prompt } = await resolvePrompt(promptArg);
				const rawModel = opts.model || getEnv("MUSIC_MODEL") || "poyo/generate-music";
				const model = resolveForProvider(rawModel, "poyo");

				const spinner = new Spinner(`Generating music with ${model}...`, { elapsed: true }).start();

				const task = await generateMedia(
					{
						model,
						input: {
							prompt,
						},
					},
					(progress) => spinner.update(`Generating music... ${progress}%`),
				);

				const audioFile = task.files?.find((f) => f.file_type === "audio");
				if (!audioFile) {
					spinner.fail("No audio file in task result");
					throw new Error("No audio file in task result — the model may not support audio output");
				}

				spinner.update("Downloading...");

				const destPath = resolveOutputPath(audioFile.file_url, opts.output, "mp3");
				mkdirSync(dirname(destPath), { recursive: true });
				await downloadFile(audioFile.file_url, destPath);

				spinner.succeed("Music saved");
				console.log(destPath);
			} catch (err) {
				console.error(
					`Music generation failed: ${(err as Error).message}. Check the model name and Poyo API credentials.`,
				);
				process.exit(exitCode(err, 4));
			}
		});

	return music;
};
