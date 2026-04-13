/** Command handler for audio-to-text transcription via Soniox. */
import { exitCode } from '../errors.ts';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { getEnv } from '../services/env.ts';
import {
  getApiKey,
  uploadFile,
  createTranscription,
  pollTranscription,
  getTranscript,
} from '../services/soniox.ts';

/**
 * Create the `transcribe` command.
 * @returns The configured Commander command.
 */
export const createTranscribeCommand = (): Command => {
  const transcribe = new Command('transcribe')
    .description('Transcribe an audio file to text')
    .argument('<file>', 'Audio file to transcribe')
    .option('-m, --model <model>', 'Model override (replaces TRANSCRIBE_MODEL)')
    .action(async (file: string, opts: { model?: string }) => {
      try {
        const filePath = resolve(file);
        if (!existsSync(filePath)) {
          console.error(`Failed to transcribe: file not found at ${filePath}`);
          process.exit(2);
        }

        const model = opts.model || getEnv('TRANSCRIBE_MODEL') || 'stt-async-preview';
        const apiKey = getApiKey();

        console.error(`Transcribing with ${model}...`);

        console.error('   Uploading...');
        const uploaded = await uploadFile(filePath, apiKey);

        console.error('   Transcription in progress...');
        const transcription = await createTranscription(uploaded.id, model, apiKey);

        await pollTranscription(transcription.id, apiKey);

        const text = await getTranscript(transcription.id, apiKey);

        process.stdout.write(text);
        if (!text.endsWith('\n')) process.stdout.write('\n');

        console.error('Transcription complete');
      } catch (err) {
        console.error(
          `Transcription failed for "${file}": ${(err as Error).message}. ` +
          'Check that the file format is supported and SONIOX_API_KEY is valid.',
        );
        process.exit(exitCode(err, 4));
      }
    });

  return transcribe;
};
