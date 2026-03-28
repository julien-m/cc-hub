/** Command handler for image generation via Poyo. */
import { exitCode } from '../errors.ts';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { Command } from 'commander';
import { generateMedia, downloadFile } from '../services/poyo-media.ts';
import { getEnv } from '../services/env.ts';
import { resolveForProvider } from '../services/models.ts';
import { resolveImageInput } from '../services/image-input.ts';
import { resolveOutputPath } from '../services/artifacts.ts';

/**
 * Create the `imagine` command.
 * @returns The configured Commander command.
 */
export const createImagineCommand = (): Command => {
  const imagine = new Command('imagine')
    .description('Generate an image from a prompt')
    .argument('<prompt>', 'Description of the image to generate')
    .option('--model <model>', 'Model override (replaces IMAGINE_MODEL)')
    .option('--size <ratio>', 'Ratio (1:1, 16:9, 9:16, 3:2, 2:3, 4:3, 3:4, 4:5, 5:4, 21:9)', '1:1')
    .option('--resolution <res>', 'Resolution (1K, 2K, 4K)', '1K')
    .option('-i, --image <path>', 'Reference image (local path or URL)')
    .requiredOption('-o, --output <path>', 'Output file path or name')
    .action(async (prompt: string, opts: { model?: string; size: string; resolution: string; image?: string; output: string }) => {
      try {
        const rawModel = opts.model || getEnv('IMAGINE_MODEL') || 'google/gemini-3.1-flash-image';
        const model = resolveForProvider(rawModel, 'poyo');

        let imageUrls: string[] | undefined;
        if (opts.image) {
          console.error('Resolving reference image...');
          imageUrls = await resolveImageInput(opts.image);
        }

        console.error(`Generating image with ${model}...`);

        const task = await generateMedia({
          model,
          input: {
            prompt,
            size: opts.size,
            resolution: opts.resolution,
            ...(imageUrls && { image_urls: imageUrls }),
          },
        });

        const imageFile = task.files?.find((f) => f.file_type === 'image');
        if (!imageFile) {
          throw new Error('No image in task result — the model may not support image output');
        }

        const destPath = resolveOutputPath(imageFile.file_url, opts.output, 'png');
        mkdirSync(dirname(destPath), { recursive: true });

        console.error('Downloading...');
        await downloadFile(imageFile.file_url, destPath);

        console.error('Image saved');
        console.log(destPath);
      } catch (err) {
        console.error(
          `Image generation failed: ${(err as Error).message}. ` +
          'Check the model name and Poyo API credentials.',
        );
        process.exit(exitCode(err, 4));
      }
    });

  return imagine;
};
