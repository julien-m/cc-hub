import { join, dirname, isAbsolute } from 'node:path';
import { mkdirSync } from 'node:fs';
import { Command } from 'commander';
import { generateMedia, downloadFile } from '../services/poyo-media.ts';
import { getEnv } from '../services/env.ts';
import { resolveForProvider } from '../services/models.ts';
import { ARTIFACTS_DIR, ensureDirs } from '../utils/paths.ts';

export function createImagineCommand(): Command {
	const imagine = new Command('imagine')
		.description("Générer une image à partir d'un prompt")
		.argument('<prompt>', "Description de l'image à générer")
		.option('--model <model>', 'Modèle à utiliser (surcharge IMAGINE_MODEL)')
		.option('--size <ratio>', 'Ratio (1:1, 16:9, 9:16, 3:2, 2:3, 4:3, 3:4, 4:5, 5:4, 21:9)', '1:1')
		.option('--resolution <res>', 'Résolution (1K, 2K, 4K)', '1K')
		.requiredOption('-o, --output <path>', 'Chemin ou nom du fichier de sortie')
		.action(async (prompt: string, opts: { model?: string; size: string; resolution: string; output: string }) => {
			try {
				const rawModel = opts.model || getEnv('IMAGINE_MODEL') || 'poyo/nano-banana-2-new';
			const model = resolveForProvider(rawModel, 'poyo');

				console.error(`🎨 Génération d'image avec ${model}...`);

				const task = await generateMedia({
					model,
					input: {
						prompt,
						size: opts.size,
						resolution: opts.resolution,
					},
				});

				const imageFile = task.files?.find((f) => f.file_type === 'image');
				if (!imageFile) {
					throw new Error('No image in task result');
				}

				const ext = imageFile.file_url.match(/\.(png|jpg|jpeg|webp)/i)?.[1] || 'png';
				const hasPath = isAbsolute(opts.output) || opts.output.includes('/');
				const name = opts.output.includes('.') ? opts.output : `${opts.output}.${ext}`;
				const destPath = hasPath ? name : (ensureDirs(), join(ARTIFACTS_DIR, name));
				mkdirSync(dirname(destPath), { recursive: true });

				console.error('📥 Téléchargement...');
				await downloadFile(imageFile.file_url, destPath);

				console.error('✅ Image sauvegardée');
				console.log(destPath);
			} catch (err) {
				console.error(`❌ ${(err as Error).message}`);
				process.exit(4);
			}
		});

	return imagine;
}
