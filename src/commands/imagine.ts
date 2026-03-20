import { join, basename } from 'node:path';
import { Command } from 'commander';
import { generateMedia, downloadFile } from '../services/poyo-media.ts';
import { getEnv } from '../services/env.ts';
import { ARTIFACTS_DIR, ensureDirs } from '../utils/paths.ts';

export function createImagineCommand(): Command {
	const imagine = new Command('imagine')
		.description("Générer une image à partir d'un prompt")
		.argument('<prompt>', "Description de l'image à générer")
		.option('--model <model>', 'Modèle à utiliser (surcharge IMAGINE_MODEL)')
		.option('--size <ratio>', 'Ratio (1:1, 16:9, 9:16, 3:2, 2:3, 4:3, 3:4, 4:5, 5:4, 21:9)', '1:1')
		.option('--resolution <res>', 'Résolution (1K, 2K, 4K)', '1K')
		.option('-o, --output <filename>', 'Nom du fichier de sortie (dans ~/.claude-hub/artifacts/)')
		.action(async (prompt: string, opts: { model?: string; size: string; resolution: string; output?: string }) => {
			try {
				const model = opts.model || getEnv('IMAGINE_MODEL') || 'nano-banana-2-new';

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

				ensureDirs();
				const ext = imageFile.file_url.match(/\.(png|jpg|jpeg|webp)/i)?.[1] || 'png';
				let destPath: string;
				if (opts.output) {
					const name = basename(opts.output);
					destPath = join(ARTIFACTS_DIR, name.includes('.') ? name : `${name}.${ext}`);
				} else {
					const slug = prompt.slice(0, 40).replace(/[^a-z0-9]/gi, '-').toLowerCase();
					const now = new Date();
					const date = now.toISOString().slice(0, 10);
					const time = now.toISOString().slice(11, 19).replace(/:/g, '');
					destPath = join(ARTIFACTS_DIR, `${date}_${time}_${slug}.${ext}`);
				}

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
