import { existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { Command } from 'commander';
import { getEnv } from '../services/env.ts';

const BASE_URL = 'https://api.soniox.com/v1';

function getApiKey(): string {
	const apiKey = getEnv('SONIOX_API_KEY');
	if (!apiKey) {
		console.error('SONIOX_API_KEY non configuré dans .env');
		process.exit(3);
	}
	return apiKey;
}

interface FileUploadResponse {
	id: string;
	filename: string;
}

interface TranscriptionResponse {
	id: string;
	status: 'queued' | 'processing' | 'completed' | 'error';
	error_message?: string;
}

interface TranscriptResponse {
	text: string;
}

async function uploadFile(filePath: string, apiKey: string): Promise<FileUploadResponse> {
	const file = Bun.file(filePath);
	const formData = new FormData();
	formData.append('file', file, basename(filePath));

	const res = await fetch(`${BASE_URL}/files`, {
		method: 'POST',
		headers: { 'Authorization': `Bearer ${apiKey}` },
		body: formData,
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Soniox upload error (${res.status}): ${err}`);
	}

	return await res.json() as FileUploadResponse;
}

async function createTranscription(fileId: string, model: string, apiKey: string): Promise<TranscriptionResponse> {
	const res = await fetch(`${BASE_URL}/transcriptions`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ model, file_id: fileId }),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Soniox transcription error (${res.status}): ${err}`);
	}

	return await res.json() as TranscriptionResponse;
}

async function pollTranscription(transcriptionId: string, apiKey: string): Promise<void> {
	const maxAttempts = 120;
	const intervalMs = 3000;

	for (let i = 0; i < maxAttempts; i++) {
		await new Promise((r) => setTimeout(r, intervalMs));

		const res = await fetch(`${BASE_URL}/transcriptions/${transcriptionId}`, {
			headers: { 'Authorization': `Bearer ${apiKey}` },
		});

		if (!res.ok) {
			throw new Error(`Soniox polling error (${res.status})`);
		}

		const data = await res.json() as TranscriptionResponse;

		if (data.status === 'completed') {
			return;
		}

		if (data.status === 'error') {
			throw new Error(`Soniox transcription failed: ${data.error_message || 'unknown error'}`);
		}

		if (data.status === 'processing') {
			console.error('   Processing...');
		}
	}

	throw new Error('Soniox transcription timed out');
}

async function getTranscript(transcriptionId: string, apiKey: string): Promise<string> {
	const res = await fetch(`${BASE_URL}/transcriptions/${transcriptionId}/transcript`, {
		headers: { 'Authorization': `Bearer ${apiKey}` },
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Soniox transcript error (${res.status}): ${err}`);
	}

	const data = await res.json() as TranscriptResponse;
	return data.text;
}

export function createTranscribeCommand(): Command {
	const transcribe = new Command('transcribe')
		.description('Transcrire un fichier audio en texte')
		.argument('<file>', 'Fichier audio à transcrire')
		.option('--model <model>', 'Modèle à utiliser (surcharge TRANSCRIBE_MODEL)')
		.action(async (file: string, opts: { model?: string }) => {
			try {
				const filePath = resolve(file);
				if (!existsSync(filePath)) {
					console.error(`❌ Fichier introuvable: ${filePath}`);
					process.exit(1);
				}

				const model = opts.model || getEnv('TRANSCRIBE_MODEL') || 'stt-async-preview';
				const apiKey = getApiKey();

				console.error(`🎙️ Transcription avec ${model}...`);

				console.error('   Upload...');
				const uploaded = await uploadFile(filePath, apiKey);

				console.error('   Transcription en cours...');
				const transcription = await createTranscription(uploaded.id, model, apiKey);

				await pollTranscription(transcription.id, apiKey);

				const text = await getTranscript(transcription.id, apiKey);

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
