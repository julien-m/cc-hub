/** Motion control video generation — transfers movement from a reference video onto a character image. */
import { join, dirname, isAbsolute } from 'node:path';
import { mkdirSync } from 'node:fs';
import { Command } from 'commander';
import { generateMedia, downloadFile } from '../services/poyo-media.ts';
import { resolveImageInput, resolveVideoInput } from '../services/image-input.ts';
import { ARTIFACTS_DIR, ensureDirs } from '../utils/paths.ts';

export function createMotionCommand(): Command {
	const motion = new Command('motion')
		.description('Générer une vidéo par transfert de mouvement (image + vidéo de référence)')
		.argument('<prompt>', 'Description ou contexte pour la génération')
		.requiredOption('-i, --image <path>', 'Image du personnage (chemin local ou URL)')
		.requiredOption('-v, --video <path>', 'Vidéo de référence pour le mouvement (chemin local ou URL)')
		.option('--character-orientation <value>', 'Orientation du personnage (character ou video)', 'character')
		.requiredOption('-o, --output <path>', 'Chemin ou nom du fichier de sortie')
		.action(async (prompt: string, opts: { image: string; video: string; characterOrientation: string; output: string }) => {
			try {
				console.error('🖼️  Résolution de l\'image de référence...');
				const imageUrls = await resolveImageInput(opts.image);

				console.error('🎞️  Résolution de la vidéo de référence...');
				const videoUrl = await resolveVideoInput(opts.video);

				console.error('🎬 Génération motion control avec kling-3.0-motion-control...');

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
					throw new Error('No video in task result');
				}

				const ext = videoFile.file_url.match(/\.(mp4|webm|mov)/i)?.[1] || 'mp4';
				const hasPath = isAbsolute(opts.output) || opts.output.includes('/');
				const name = opts.output.includes('.') ? opts.output : `${opts.output}.${ext}`;
				const destPath = hasPath ? name : (ensureDirs(), join(ARTIFACTS_DIR, name));
				mkdirSync(dirname(destPath), { recursive: true });

				console.error('📥 Téléchargement...');
				await downloadFile(videoFile.file_url, destPath);

				console.error('✅ Vidéo sauvegardée');
				console.log(destPath);
			} catch (err) {
				console.error(`❌ ${(err as Error).message}`);
				process.exit(4);
			}
		});

	return motion;
}
