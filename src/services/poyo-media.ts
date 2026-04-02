import { writeFileSync } from 'node:fs';
import { ConfigError } from '../errors.ts';
import { getEnv } from './env.ts';

interface SubmitRequest {
  model: string;
  input: Record<string, unknown>;
}

interface TaskStatus {
  task_id: string;
  status: 'not_started' | 'running' | 'finished' | 'failed';
  files?: Array<{ file_url: string; file_type: 'image' | 'video' | 'audio' }>;
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

/**
 * Retrieves the Poyo API key from environment.
 * @returns The API key
 * @throws ConfigError if POYO_API_KEY is not configured
 */
const getApiKey = (): string => {
  const apiKey = getEnv('POYO_API_KEY');
  if (!apiKey) {
    throw new ConfigError('POYO_API_KEY not configured in .env');
  }
  return apiKey;
};

/**
 * Submits a generation task and polls until completion. Returns file URLs.
 * @param request - The submission request containing model and input parameters
 * @param onProgress - Optional callback invoked with the progress percentage (0-100).
 * @returns The completed task status with file URLs
 * @throws ConfigError if POYO_API_KEY is not configured
 * @throws Error if the submission fails, the task fails, or polling times out
 */
export const generateMedia = async (
  request: SubmitRequest,
  onProgress?: (progress: number) => void,
): Promise<TaskStatus> => {
  const apiKey = getApiKey();
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const res = await fetch('https://api.poyo.ai/api/generate/submit', {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(30_000),
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

  return pollTask(taskId, headers, onProgress);
};

/**
 * Polls a Poyo task until completion or failure.
 * @param taskId - The task ID to poll
 * @param headers - Request headers including authorization
 * @param onProgress - Optional callback invoked with the progress percentage (0-100).
 * @returns The completed task status
 * @throws Error if polling fails, the task fails, or polling times out
 */
const pollTask = async (
  taskId: string,
  headers: Record<string, string>,
  onProgress?: (progress: number) => void,
): Promise<TaskStatus> => {
  const maxAttempts = 180;
  const intervalMs = 3000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    const res = await fetch(
      `https://api.poyo.ai/api/generate/status/${taskId}`,
      {
        headers: { 'Authorization': headers['Authorization'] },
        signal: AbortSignal.timeout(30_000),
      },
    );

    if (!res.ok) {
      throw new Error(`Poyo polling error (${res.status})`);
    }

    const json = await res.json() as StatusResponse;
    const task = json.data;

    if (task.progress !== undefined && task.progress > 0 && onProgress) {
      onProgress(task.progress);
    }

    if (task.status === 'finished') {
      return task;
    }

    if (task.status === 'failed') {
      throw new Error(`Poyo task failed: ${task.error_message || 'unknown error'}`);
    }
  }

  throw new Error('Poyo task timed out');
};

/**
 * Downloads a file from a URL to a local path.
 * @param url - The URL to download from
 * @param destPath - The local file path to write to
 * @returns The destination path
 * @throws Error if the download fails
 */
export const downloadFile = async (url: string, destPath: string): Promise<string> => {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}): ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buffer);
  return destPath;
};
