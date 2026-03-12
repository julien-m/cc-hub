import { join } from 'node:path';
import { Command } from 'commander';
import { runPrediction, downloadFile } from '../services/replicate.ts';
import { getEnv } from '../services/env.ts';
import { ARTIFACTS_DIR, ensureDirs } from '../utils/paths.ts';

export function createImagineCommand(): Command {
  const imagine = new Command('imagine')
    .description("Générer une image via Replicate")
    .argument('<prompt>', "Description de l'image à générer")
    .option('--model <model>', 'Modèle à utiliser (surcharge IMAGE_MODEL)')
    .action(async (prompt: string, opts: { model?: string }) => {
      try {
        const model = opts.model || getEnv('IMAGINE_MODEL') || 'black-forest-labs/flux-1.1-pro';

        console.error(`🎨 Génération d'image avec ${model}...`);

        const output = await runPrediction(model, { prompt });

        const imageUrl = Array.isArray(output) ? output[0] : output;

        if (!imageUrl || typeof imageUrl !== 'string') {
          throw new Error('No image URL in prediction output');
        }

        ensureDirs();
        const ext = imageUrl.match(/\.(png|jpg|jpeg|webp)/i)?.[1] || 'png';
        const slug = prompt.slice(0, 40).replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const today = new Date().toISOString().slice(0, 10);
        const fileName = `${today}_${slug}.${ext}`;
        const destPath = join(ARTIFACTS_DIR, fileName);

        console.error('📥 Téléchargement...');
        await downloadFile(imageUrl, destPath);

        console.error(`✅ Image sauvegardée`);
        console.log(destPath);
      } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        process.exit(4);
      }
    });

  return imagine;
}
