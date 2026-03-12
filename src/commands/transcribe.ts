import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { runPrediction } from '../services/replicate.ts';
import { getEnv } from '../services/env.ts';

const MIME_TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  webm: 'audio/webm',
};

export function createTranscribeCommand(): Command {
  const transcribe = new Command('transcribe')
    .description('Transcrire un fichier audio via Replicate')
    .argument('<file>', 'Fichier audio à transcrire')
    .option('--model <model>', 'Modèle à utiliser (surcharge TRANSCRIBE_MODEL)')
    .action(async (file: string, opts: { model?: string }) => {
      try {
        const filePath = resolve(file);
        if (!existsSync(filePath)) {
          console.error(`❌ Fichier introuvable: ${filePath}`);
          process.exit(1);
        }

        const model = opts.model || getEnv('TRANSCRIBE_MODEL') || 'openai/whisper';

        console.error(`🎙️ Transcription avec ${model}...`);

        const buffer = readFileSync(filePath);
        const base64 = buffer.toString('base64');
        const ext = filePath.split('.').pop()?.toLowerCase() || 'mp3';
        const mime = MIME_TYPES[ext] || 'audio/mpeg';
        const dataUrl = `data:${mime};base64,${base64}`;

        const output = await runPrediction(model, { audio: dataUrl });

        let text: string;
        if (typeof output === 'string') {
          text = output;
        } else if (output && typeof output === 'object' && 'transcription' in output) {
          text = (output as { transcription: string }).transcription;
        } else if (output && typeof output === 'object' && 'text' in output) {
          text = (output as { text: string }).text;
        } else {
          text = JSON.stringify(output);
        }

        process.stdout.write(text);
        if (!text.endsWith('\n')) process.stdout.write('\n');

        console.error('✅ Transcription terminée');
      } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        process.exit(4);
      }
    });

  return transcribe;
}
