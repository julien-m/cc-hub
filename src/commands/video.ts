/** Command handler for video generation via Poyo. */
import { exitCode } from '../errors.ts';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { Command } from 'commander';
import { generateMedia, downloadFile } from '../services/poyo-media.ts';
import { getEnv } from '../services/env.ts';
import { resolveForProvider } from '../services/models.ts';
import { resolveImageInput } from '../services/image-input.ts';
import { resolveOutputPath } from '../services/artifacts.ts';
import { resolvePrompt } from '../infra/prompt.ts';

/**
 * Create the `video` command.
 * @returns The configured Commander command.
 */
export const createVideoCommand = (): Command => {
  const video = new Command('video')
    .description('Generate a video from a prompt')
    .argument('[prompt]', 'Description of the video to generate (or pipe via stdin)')
    .option('--model <model>', 'Model override (replaces VIDEO_MODEL)')
    .option('--duration <seconds>', 'Duration in seconds (3-15)', '5')
    .option('--aspect-ratio <ratio>', 'Ratio (16:9, 1:1, 9:16)', '16:9')
    .option('-i, --image <path>', 'Starting image for animation (local path or URL)')
    .requiredOption('-o, --output <path>', 'Output file path or name')
    .action(async (promptArg: string | undefined, opts: { model?: string; duration: string; aspectRatio: string; image?: string; output: string }) => {
      try {
        const { prompt } = await resolvePrompt(promptArg);
        const rawModel = opts.model || getEnv('VIDEO_MODEL') || 'kuaishou/kling-3.0-pro';
        const model = resolveForProvider(rawModel, 'poyo');

        let imageUrls: string[] | undefined;
        if (opts.image) {
          console.error('Resolving reference image...');
          imageUrls = await resolveImageInput(opts.image);
        }

        console.error(`Generating video with ${model}...`);

        const task = await generateMedia({
          model,
          input: {
            prompt,
            duration: parseInt(opts.duration, 10),
            aspect_ratio: opts.aspectRatio,
            sound: true,
            ...(imageUrls && { image_urls: imageUrls }),
          },
        });

        const videoFile = task.files?.find((f) => f.file_type === 'video');
        if (!videoFile) {
          throw new Error('No video in task result — the model may not support video output');
        }

        const destPath = resolveOutputPath(videoFile.file_url, opts.output, 'mp4');
        mkdirSync(dirname(destPath), { recursive: true });

        console.error('Downloading...');
        await downloadFile(videoFile.file_url, destPath);

        console.error('Video saved');
        console.log(destPath);
      } catch (err) {
        console.error(
          `Video generation failed: ${(err as Error).message}. ` +
          'Check the model name and Poyo API credentials.',
        );
        process.exit(exitCode(err, 4));
      }
    });

  return video;
};
