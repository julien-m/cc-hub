import { readFileSync, existsSync } from 'node:fs';
import { ENV_PATH } from '../utils/paths.ts';
import { tryGetCred } from './creds.ts';

let cache: Record<string, string> | undefined;

function loadEnv(): Record<string, string> {
  if (cache) return cache;
  cache = {};

  if (!existsSync(ENV_PATH)) return cache;

  const content = readFileSync(ENV_PATH, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    cache[key] = value;
  }

  return cache;
}

export function getEnv(key: string): string | undefined {
  const value = loadEnv()[key];
  if (value && value.startsWith('creds:')) {
    return tryGetCred(value.slice(6)) ?? undefined;
  }
  return value;
}
