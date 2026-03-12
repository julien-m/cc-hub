import { writeFileSync } from 'node:fs';
import { getEnv } from './env.ts';

interface PredictionResponse {
  id: string;
  status: string;
  output: unknown;
  error?: string;
}

function getHeaders(): Record<string, string> {
  const apiKey = getEnv('REPLICATE_API_KEY');
  if (!apiKey) {
    console.error('REPLICATE_API_KEY non configuré dans .env');
    process.exit(3);
  }
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export async function runPrediction(model: string, input: Record<string, unknown>): Promise<unknown> {
  const headers = getHeaders();

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'wait=60' },
    body: JSON.stringify({ version: model, input }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Replicate API error (${res.status}): ${err}`);
  }

  let prediction = await res.json() as PredictionResponse;

  if (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
    prediction = await pollPrediction(prediction.id, headers);
  }

  if (prediction.status === 'failed') {
    throw new Error(`Replicate prediction failed: ${prediction.error}`);
  }

  return prediction.output;
}

async function pollPrediction(id: string, headers: Record<string, string>): Promise<PredictionResponse> {
  const maxAttempts = 180;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const res = await fetch(
      `https://api.replicate.com/v1/predictions/${id}`,
      { headers: { 'Authorization': headers['Authorization'] } },
    );

    if (!res.ok) {
      throw new Error(`Replicate polling error (${res.status})`);
    }

    const prediction = await res.json() as PredictionResponse;
    console.error(`   Status: ${prediction.status}...`);

    if (prediction.status === 'succeeded' || prediction.status === 'failed') {
      return prediction;
    }

    if (prediction.status === 'canceled') {
      throw new Error('Prediction was canceled');
    }
  }

  throw new Error('Replicate prediction timed out');
}

export async function downloadFile(url: string, destPath: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed (${res.status}): ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buffer);
  return destPath;
}
