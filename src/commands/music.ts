/** Command handler for music generation via Poyo. */
import { exitCode } from '../errors.ts';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { Command } from 'commander';
import { generateMedia, downloadFile } from '../services/poyo-media.ts';
import { getEnv } from '../services/env.ts';
import { resolveForProvider } from '../services/models.ts';
import { resolveOutputPath } from '../services/artifacts.ts';

/**
 * Create the `music` command group.
 * @returns The configured Commander command.
 */
export const createMusicCommand = (): Command => {
  const music = new Command('music').description('Generate music via Poyo');

  music
    .command('generate')
    .description('Generate music from a prompt')
    .argument('<prompt>', 'Description of the music to generate')
    .option('--model <model>', 'Model override (replaces MUSIC_MODEL)')
    .requiredOption('-o, --output <path>', 'Output file path or name')
    .action(async (prompt: string, opts: { model?: string; output: string }) => {
      try {
        const rawModel = opts.model || getEnv('MUSIC_MODEL') || 'poyo/generate-music';
        const model = resolveForProvider(rawModel, 'poyo');

        console.error(`Generating music with ${model}...`);

        const task = await generateMedia({
          model,
          input: {
            prompt,
          },
        });

        const audioFile = task.files?.find((f) => f.file_type === 'audio');
        if (!audioFile) {
          throw new Error('No audio file in task result — the model may not support audio output');
        }

        const destPath = resolveOutputPath(audioFile.file_url, opts.output, 'mp3');
        mkdirSync(dirname(destPath), { recursive: true });

        console.error('Downloading...');
        await downloadFile(audioFile.file_url, destPath);

        console.error('Music saved');
        console.log(destPath);
      } catch (err) {
        console.error(
          `Music generation failed: ${(err as Error).message}. ` +
          'Check the model name and Poyo API credentials.',
        );
        process.exit(exitCode(err, 4));
      }
    });

  return music;
};
