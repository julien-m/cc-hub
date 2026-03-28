import { readFileSync, existsSync } from 'node:fs';
import { ENV_PATH } from '../infra/paths.ts';
import { tryGetCred } from './creds.ts';

let cache: Readonly<Record<string, string>> | undefined;

/**
 * Loads and parses the .env file, caching the result.
 * @returns The parsed environment variables
 */
const loadEnv = (): Readonly<Record<string, string>> => {
  if (cache) return cache;
  const result: Record<string, string> = {};

  if (!existsSync(ENV_PATH)) {
    cache = result;
    return cache;
  }

  const content = readFileSync(ENV_PATH, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    result[key] = value;
  }

  cache = result;
  return cache;
};

/**
 * Retrieves an environment variable from the .env file.
 * Resolves `creds:` prefixed values through the keychain.
 * @param key - The environment variable name
 * @returns The resolved value, or undefined if not found
 */
export const getEnv = (key: string): string | undefined => {
  const value = loadEnv()[key];
  if (value && value.startsWith('creds:')) {
    return tryGetCred(value.slice(6)) ?? undefined;
  }
  return value;
};
