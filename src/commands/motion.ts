/** Command handler for motion control video generation — transfers movement from a reference video onto a character image. */
import { exitCode } from '../errors.ts';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { Command } from 'commander';
import { generateMedia, downloadFile } from '../services/poyo-media.ts';
import { resolveImageInput, resolveVideoInput } from '../services/image-input.ts';
import { resolveOutputPath } from '../services/artifacts.ts';

/**
 * Create the `motion` command.
 * @returns The configured Commander command.
 */
export const createMotionCommand = (): Command => {
  const motion = new Command('motion')
    .description('Generate a video via motion transfer (image + reference video)')
    .argument('<prompt>', 'Description or context for generation')
    .requiredOption('-i, --image <path>', 'Character image (local path or URL)')
    .requiredOption('-v, --video <path>', 'Reference video for motion (local path or URL)')
    .option('--character-orientation <value>', 'Character orientation (character or video)', 'character')
    .requiredOption('-o, --output <path>', 'Output file path or name')
    .action(async (prompt: string, opts: { image: string; video: string; characterOrientation: string; output: string }) => {
      try {
        console.error('Resolving reference image...');
        const imageUrls = await resolveImageInput(opts.image);

        console.error('Resolving reference video...');
        const videoUrl = await resolveVideoInput(opts.video);

        console.error('Generating motion control with kling-3.0-motion-control...');

        const task = await generateMedia({
          model: 'kling-3.0-motion-control',
          input: {
            prompt,
            image_urls: imageUrls,
            video_url: videoUrl,
            character_orientation: opts.characterOrientation,
          },
        });

        const videoFile = task.files?.find((f) => f.file_type === 'video');
        if (!videoFile) {
          throw new Error('No video in task result — motion control generation may have failed');
        }

        const destPath = resolveOutputPath(videoFile.file_url, opts.output, 'mp4');
        mkdirSync(dirname(destPath), { recursive: true });

        console.error('Downloading...');
        await downloadFile(videoFile.file_url, destPath);

        console.error('Video saved');
        console.log(destPath);
      } catch (err) {
        console.error(
          `Motion control generation failed: ${(err as Error).message}. ` +
          'Check image/video inputs and Poyo API credentials.',
        );
        process.exit(exitCode(err, 4));
      }
    });

  return motion;
};
