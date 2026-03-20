import { join, basename } from 'node:path';
import { Command } from 'commander';
import { generateMedia, downloadFile } from '../services/poyo-media.ts';
import { getEnv } from '../services/env.ts';
import { ARTIFACTS_DIR, ensureDirs } from '../utils/paths.ts';

export function createVideoCommand(): Command {
	const video = new Command('video')
		.description("Générer une vidéo à partir d'un prompt")
		.argument('<prompt>', 'Description de la vidéo à générer')
		.option('--model <model>', 'Modèle à utiliser (surcharge VIDEO_MODEL)')
		.option('--duration <seconds>', 'Durée en secondes (3-15)', '5')
		.option('--aspect-ratio <ratio>', 'Ratio (16:9, 1:1, 9:16)', '16:9')
		.option('-o, --output <filename>', 'Nom du fichier de sortie (dans ~/.claude-hub/artifacts/)')
		.action(async (prompt: string, opts: { model?: string; duration: string; aspectRatio: string; output?: string }) => {
			try {
				const model = opts.model || getEnv('VIDEO_MODEL') || 'kling-3.0/standard';

				console.error(`🎬 Génération de vidéo avec ${model}...`);

				const task = await generateMedia({
					model,
					input: {
						prompt,
						duration: parseInt(opts.duration, 10),
						aspect_ratio: opts.aspectRatio,
						sound: true,
					},
				});

				const videoFile = task.files?.find((f) => f.file_type === 'video');
				if (!videoFile) {
					throw new Error('No video in task result');
				}

				ensureDirs();
				const ext = videoFile.file_url.match(/\.(mp4|webm|mov)/i)?.[1] || 'mp4';
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
				await downloadFile(videoFile.file_url, destPath);

				console.error('✅ Vidéo sauvegardée');
				console.log(destPath);
			} catch (err) {
				console.error(`❌ ${(err as Error).message}`);
				process.exit(4);
			}
		});

	return video;
}
