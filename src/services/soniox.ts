/** Soniox speech-to-text API client. */
import { basename } from 'node:path';
import { getEnv } from './env.ts';
import { ConfigError } from '../errors.ts';

const BASE_URL = 'https://api.soniox.com/v1';

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

/**
 * Retrieve the Soniox API key from environment.
 * @returns The API key string.
 * @throws {ConfigError} When SONIOX_API_KEY is not set.
 */
export const getApiKey = (): string => {
  const apiKey = getEnv('SONIOX_API_KEY');
  if (!apiKey) {
    throw new ConfigError(
      'SONIOX_API_KEY is not configured in .env. Set it with: creds set cc-hub/dev/soniox_api_key',
    );
  }
  return apiKey;
};

/**
 * Upload an audio file to Soniox for transcription.
 * @param filePath - Absolute path to the audio file.
 * @param apiKey - Soniox API key.
 * @returns The upload response containing the file ID.
 * @throws {Error} When the upload request fails.
 */
export const uploadFile = async (filePath: string, apiKey: string): Promise<FileUploadResponse> => {
  const file = Bun.file(filePath);
  const formData = new FormData();
  formData.append('file', file, basename(filePath));

  const res = await fetch(`${BASE_URL}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Soniox upload failed (${res.status}): ${err}`);
  }

  return (await res.json()) as FileUploadResponse;
};

/**
 * Create a transcription job on Soniox.
 * @param fileId - The uploaded file ID.
 * @param model - The transcription model to use.
 * @param apiKey - Soniox API key.
 * @returns The transcription response with job ID and status.
 * @throws {Error} When the API request fails.
 */
export const createTranscription = async (
  fileId: string,
  model: string,
  apiKey: string,
): Promise<TranscriptionResponse> => {
  const res = await fetch(`${BASE_URL}/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, file_id: fileId }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Soniox transcription request failed (${res.status}): ${err}`);
  }

  return (await res.json()) as TranscriptionResponse;
};

/**
 * Poll a transcription job until it completes or fails.
 * @param transcriptionId - The transcription job ID.
 * @param apiKey - Soniox API key.
 * @throws {Error} When the transcription fails, times out, or polling encounters an error.
 */
export const pollTranscription = async (transcriptionId: string, apiKey: string): Promise<void> => {
  const maxAttempts = 120;
  const intervalMs = 3000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const res = await fetch(`${BASE_URL}/transcriptions/${transcriptionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      throw new Error(`Soniox polling failed (${res.status})`);
    }

    const data = (await res.json()) as TranscriptionResponse;

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

  throw new Error('Soniox transcription timed out after 6 minutes');
};

/**
 * Retrieve the transcript text for a completed transcription.
 * @param transcriptionId - The transcription job ID.
 * @param apiKey - Soniox API key.
 * @returns The transcribed text.
 * @throws {Error} When the transcript request fails.
 */
export const getTranscript = async (transcriptionId: string, apiKey: string): Promise<string> => {
  const res = await fetch(`${BASE_URL}/transcriptions/${transcriptionId}/transcript`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Soniox transcript retrieval failed (${res.status}): ${err}`);
  }

  const data = (await res.json()) as TranscriptResponse;
  return data.text;
};
