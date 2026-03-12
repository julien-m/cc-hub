import { join } from 'node:path';
import { Command } from 'commander';
import { runPrediction, downloadFile } from '../services/replicate.ts';
import { getEnv } from '../services/env.ts';
import { ARTIFACTS_DIR, ensureDirs } from '../utils/paths.ts';

export function createVideoCommand(): Command {
  const video = new Command('video')
    .description('Générer une vidéo via Replicate')
    .argument('<prompt>', 'Description de la vidéo à générer')
    .option('--model <model>', 'Modèle à utiliser (surcharge VIDEO_MODEL)')
    .action(async (prompt: string, opts: { model?: string }) => {
      try {
        const model = opts.model || getEnv('VIDEO_MODEL') || 'minimax/video-01';

        console.error(`🎬 Génération de vidéo avec ${model}...`);

        const output = await runPrediction(model, { prompt });

        let videoUrl: string | undefined;
        if (typeof output === 'string') {
          videoUrl = output;
        } else if (Array.isArray(output)) {
          videoUrl = output[0] as string;
        } else if (output && typeof output === 'object' && 'video' in output) {
          videoUrl = (output as { video: string }).video;
        }

        if (!videoUrl || typeof videoUrl !== 'string') {
          throw new Error('No video URL in prediction output');
        }

        ensureDirs();
        const ext = videoUrl.match(/\.(mp4|webm|mov)/i)?.[1] || 'mp4';
        const slug = prompt.slice(0, 40).replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const today = new Date().toISOString().slice(0, 10);
        const fileName = `${today}_${slug}.${ext}`;
        const destPath = join(ARTIFACTS_DIR, fileName);

        console.error('📥 Téléchargement...');
        await downloadFile(videoUrl, destPath);

        console.error(`✅ Vidéo sauvegardée`);
        console.log(destPath);
      } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        process.exit(4);
      }
    });

  return video;
}
