import { copyFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { ARTIFACTS_DIR, ensureDirs } from "../infra/paths.ts";

/**
 * Resolve an output path for a downloaded media file.
 * If the output contains a directory separator it is treated as a full path;
 * otherwise the file is placed inside the artifacts directory.
 * @param url - The remote file URL (used to infer extension).
 * @param output - The user-supplied output path or filename.
 * @param defaultExt - Fallback extension when URL has none.
 * @returns Absolute destination path.
 */
export const resolveOutputPath = (url: string, output: string, defaultExt: string): string => {
	const pathname = new URL(url, "https://placeholder").pathname;
	const ext = pathname.split(".").pop() || defaultExt;
	const hasPath = output.includes("/") || output.includes("\\");
	const name = hasPath ? output : `${output.replace(/\.[^.]+$/, "")}.${ext}`;
	if (hasPath) return name;
	ensureDirs();
	return join(ARTIFACTS_DIR, name);
};

/**
 * Copy a local file into the artifacts directory with a dated, sequential name.
 * @param filePath - Source file to store.
 * @param slug - Optional slug for the artifact name; derived from filename when null.
 * @returns Absolute path to the stored artifact.
 */
export const storeArtifact = (filePath: string, slug: string | null): string => {
	ensureDirs();

	const today = new Date().toISOString().slice(0, 10);
	const existing = readdirSync(ARTIFACTS_DIR).filter((f) => f.startsWith(today));
	const seq = String(existing.length + 1).padStart(3, "0");
	const normalizedSlug =
		slug ||
		basename(filePath)
			.replace(/\.[^.]+$/, "")
			.replace(/[^a-z0-9-]/gi, "-")
			.toLowerCase();

	const artifactName = `${today}_${seq}_${normalizedSlug}.md`;
	const destPath = join(ARTIFACTS_DIR, artifactName);

	copyFileSync(filePath, destPath);
	return destPath;
};
