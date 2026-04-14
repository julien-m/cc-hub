import { execFileSync } from "node:child_process";
import { ConfigError } from "../errors.ts";

/**
 * Retrieves a credential from the keychain.
 * @param name - The credential entry name (e.g. "myapp/dev/api_key")
 * @returns The credential value
 * @throws ConfigError if the credential is missing or inaccessible
 */
export const getCred = (name: string): string => {
	try {
		return execFileSync("creds", ["get", name, "--no-newline"], {
			encoding: "utf-8",
		});
	} catch {
		throw new ConfigError(`Missing credential: ${name}\n   Store it with: creds set ${name}`);
	}
};

/**
 * Attempts to retrieve a credential without throwing on failure.
 * @param name - The credential entry name
 * @returns The credential value, or null if not found
 */
export const tryGetCred = (name: string): string | null => {
	try {
		return execFileSync("creds", ["get", name, "--no-newline"], {
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "ignore"],
		});
	} catch {
		return null;
	}
};
