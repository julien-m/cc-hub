import { writeFileSync } from 'node:fs';
import { getEnv } from './env.ts';

interface SubmitRequest {
	model: string;
	input: Record<string, unknown>;
}

interface TaskStatus {
	task_id: string;
	status: 'not_started' | 'running' | 'finished' | 'failed';
	files?: Array<{ file_url: string; file_type: 'image' | 'video' }>;
	progress?: number;
	error_message?: string;
}

interface SubmitResponse {
	code: number;
	data: {
		task_id: string;
		status: string;
		error?: { message?: string };
	};
}

interface StatusResponse {
	code: number;
	data: TaskStatus;
}

function getApiKey(): string {
	const apiKey = getEnv('POYO_API_KEY');
	if (!apiKey) {
		console.error('POYO_API_KEY non configuré dans .env');
		process.exit(3);
	}
	return apiKey;
}

/** Submits a generation task and polls until completion. Returns file URLs. */
export async function generateMedia(request: SubmitRequest): Promise<TaskStatus> {
	const apiKey = getApiKey();
	const headers = {
		'Authorization': `Bearer ${apiKey}`,
		'Content-Type': 'application/json',
	};

	const res = await fetch('https://api.poyo.ai/api/generate/submit', {
		method: 'POST',
		headers,
		body: JSON.stringify(request),
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Poyo submit error (${res.status}): ${err}`);
	}

	const json = await res.json() as SubmitResponse;

	if (json.code !== 200 || json.data?.error) {
		const msg = json.data?.error?.message || `Unexpected status code: ${json.code}`;
		throw new Error(`Poyo submit error: ${msg}`);
	}

	const taskId = json.data.task_id;
	console.error(`   Task: ${taskId}`);

	return pollTask(taskId, headers);
}

async function pollTask(
	taskId: string,
	headers: Record<string, string>,
): Promise<TaskStatus> {
	const maxAttempts = 180;
	const intervalMs = 3000;

	for (let i = 0; i < maxAttempts; i++) {
		await new Promise((resolve) => setTimeout(resolve, intervalMs));

		const res = await fetch(
			`https://api.poyo.ai/api/generate/status/${taskId}`,
			{ headers: { 'Authorization': headers['Authorization'] } },
		);

		if (!res.ok) {
			throw new Error(`Poyo polling error (${res.status})`);
		}

		const json = await res.json() as StatusResponse;
		const task = json.data;

		if (task.progress !== undefined && task.progress > 0) {
			console.error(`   Progress: ${task.progress}%`);
		}

		if (task.status === 'finished') {
			return task;
		}

		if (task.status === 'failed') {
			throw new Error(`Poyo task failed: ${task.error_message || 'unknown error'}`);
		}
	}

	throw new Error('Poyo task timed out');
}

/** Downloads a file from a URL to a local path. */
export async function downloadFile(url: string, destPath: string): Promise<string> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Download failed (${res.status}): ${url}`);
	}
	const buffer = Buffer.from(await res.arrayBuffer());
	writeFileSync(destPath, buffer);
	return destPath;
}
