import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { getEnv } from "./env.ts";

/** Maps supported image extensions to MIME types. */
const IMAGE_MIME_TYPES = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
} as const satisfies Record<string, string>;

/** Maps supported video extensions to MIME types. */
const VIDEO_MIME_TYPES = {
	".mp4": "video/mp4",
	".webm": "video/webm",
	".mov": "video/quicktime",
} as const satisfies Record<string, string>;

/**
 * Validates that a file path has a supported image extension.
 * @param filePath - The file path to validate
 * @returns The MIME type for the extension
 * @throws If the extension is not supported
 */
export const validateImageExtension = (filePath: string): string => {
	const ext = extname(filePath).toLowerCase();
	const mime = (IMAGE_MIME_TYPES as Record<string, string>)[ext];
	if (!mime) {
		const supported = Object.keys(IMAGE_MIME_TYPES)
			.map((e) => e.slice(1))
			.join(", ");
		throw new Error(`Unsupported image format: ${ext ? ext.slice(1) : "(none)"}. Supported: ${supported}`);
	}
	return mime;
};

/**
 * Validates that a file path has a supported video extension.
 * @param filePath - The file path to validate
 * @returns The MIME type for the extension
 * @throws If the extension is not supported
 */
export const validateVideoExtension = (filePath: string): string => {
	const ext = extname(filePath).toLowerCase();
	const mime = (VIDEO_MIME_TYPES as Record<string, string>)[ext];
	if (!mime) {
		const supported = Object.keys(VIDEO_MIME_TYPES)
			.map((e) => e.slice(1))
			.join(", ");
		throw new Error(`Unsupported video format: ${ext ? ext.slice(1) : "(none)"}. Supported: ${supported}`);
	}
	return mime;
};

/**
 * Resolves a local file path or URL into an image_urls array for the Poyo API.
 *
 * - URLs (http/https) are returned as-is.
 * - Local files are read, base64-encoded, and uploaded to Poyo temporary storage.
 *   Falls back to a data URI if upload fails.
 *
 * @param pathOrUrl - A local file path or HTTP(S) URL
 * @returns An array of image URLs for the Poyo API
 * @throws If the local file does not exist or has an unsupported extension
 */
export const resolveImageInput = async (pathOrUrl: string): Promise<string[]> => {
	if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
		return [pathOrUrl];
	}

	const absPath = resolve(pathOrUrl);
	if (!existsSync(absPath)) {
		throw new Error(`Image not found: ${absPath}`);
	}

	const mime = validateImageExtension(absPath);
	const buffer = readFileSync(absPath);
	const base64 = buffer.toString("base64");
	const dataUri = `data:${mime};base64,${base64}`;

	const uploaded = await tryUploadToPoyo(dataUri);
	return [uploaded ?? dataUri];
};

/**
 * Resolves a local file path or URL into a video URL for the Poyo API.
 *
 * - URLs (http/https) are returned as-is.
 * - Local files are read, base64-encoded, and uploaded to Poyo temporary storage.
 *   Falls back to a data URI if upload fails.
 *
 * @param pathOrUrl - A local file path or HTTP(S) URL
 * @returns A video URL for the Poyo API
 * @throws If the local file does not exist or has an unsupported extension
 */
export const resolveVideoInput = async (pathOrUrl: string): Promise<string> => {
	if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
		return pathOrUrl;
	}

	const absPath = resolve(pathOrUrl);
	if (!existsSync(absPath)) {
		throw new Error(`Video not found: ${absPath}`);
	}

	const mime = validateVideoExtension(absPath);
	const buffer = readFileSync(absPath);
	const base64 = buffer.toString("base64");
	const dataUri = `data:${mime};base64,${base64}`;

	const uploaded = await tryUploadToPoyo(dataUri);
	if (!uploaded) {
		throw new Error("Failed to upload video to Poyo storage — try using a URL instead");
	}
	return uploaded;
};

/**
 * Attempts to upload a media file to Poyo temporary storage.
 * @param dataUri - The base64 data URI to upload
 * @returns The hosted URL on success, null on failure
 */
const tryUploadToPoyo = async (dataUri: string): Promise<string | null> => {
	const apiKey = getEnv("POYO_API_KEY");
	if (!apiKey) return null;

	try {
		const res = await fetch("https://api.poyo.ai/api/common/upload/url", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ file_url: dataUri }),
			signal: AbortSignal.timeout(30_000),
		});

		if (!res.ok) return null;

		const json = (await res.json()) as {
			code: number;
			data?: { file_url?: string };
		};

		return json.code === 200 ? (json.data?.file_url ?? null) : null;
	} catch {
		return null;
	}
};
