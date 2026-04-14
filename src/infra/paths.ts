import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const HUB_DIR = join(homedir(), ".claude-hub");
export const DB_PATH = join(HUB_DIR, "activity.db");
export const CONFIG_PATH = join(HUB_DIR, "config.json");
export const ENV_PATH = join(HUB_DIR, ".env");
export const ARTIFACTS_DIR = join(HUB_DIR, "artifacts");
export const PROMPTS_DIR = join(HUB_DIR, "prompts");

/**
 * Creates the required hub directories if they do not exist.
 * Ensures HUB_DIR, ARTIFACTS_DIR, and PROMPTS_DIR are present.
 */
export const ensureDirs = (): void => {
	mkdirSync(HUB_DIR, { recursive: true });
	mkdirSync(ARTIFACTS_DIR, { recursive: true });
	mkdirSync(PROMPTS_DIR, { recursive: true });
};
