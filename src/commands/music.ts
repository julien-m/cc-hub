import { join, dirname, isAbsolute } from 'node:path';
import { mkdirSync } from 'node:fs';
import { Command } from 'commander';
import { generateMedia, downloadFile } from '../services/poyo-media.ts';
import { getEnv } from '../services/env.ts';
import { resolveForProvider } from '../services/models.ts';
import { ARTIFACTS_DIR, ensureDirs } from '../utils/paths.ts';

export function createMusicCommand(): Command {
	const music = new Command('music').description('Générer de la musique via Poyo');

	music
		.command('generate')
		.description("Générer de la musique à partir d'un prompt")
		.argument('<prompt>', 'Description de la musique à générer')
		.option('--model <model>', 'Modèle à utiliser (surcharge MUSIC_MODEL)')
		.requiredOption('-o, --output <path>', 'Chemin ou nom du fichier de sortie')
		.action(async (prompt: string, opts: { model?: string; output: string }) => {
			try {
				const rawModel = opts.model || getEnv('MUSIC_MODEL') || 'poyo/generate-music';
				const model = resolveForProvider(rawModel, 'poyo');

				console.error(`🎵 Génération de musique avec ${model}...`);

				const task = await generateMedia({
					model,
					input: {
						prompt,
					},
				});

				const audioFile = task.files?.find((f) => f.file_type === 'audio');
				if (!audioFile) {
					throw new Error('No audio file in task result');
				}

				const ext = audioFile.file_url.match(/\.(mp3|wav|ogg|flac)/i)?.[1] || 'mp3';
				const hasPath = isAbsolute(opts.output) || opts.output.includes('/');
				const name = opts.output.includes('.') ? opts.output : `${opts.output}.${ext}`;
				const destPath = hasPath ? name : (ensureDirs(), join(ARTIFACTS_DIR, name));
				mkdirSync(dirname(destPath), { recursive: true });

				console.error('📥 Téléchargement...');
				await downloadFile(audioFile.file_url, destPath);

				console.error('✅ Musique sauvegardée');
				console.log(destPath);
			} catch (err) {
				console.error(`❌ ${(err as Error).message}`);
				process.exit(4);
			}
		});

	return music;
}
