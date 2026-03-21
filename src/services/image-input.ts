import { existsSync, readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { getEnv } from './env.ts';

/** Maps supported extensions to MIME types. */
const MIME_TYPES: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
};

/**
 * Validates that a file path has a supported image extension.
 * @returns The MIME type for the extension.
 * @throws If the extension is not supported.
 */
export function validateImageExtension(filePath: string): string {
	const ext = extname(filePath).toLowerCase();
	const mime = MIME_TYPES[ext];
	if (!mime) {
		const supported = Object.keys(MIME_TYPES).map((e) => e.slice(1)).join(', ');
		throw new Error(`Unsupported image format: ${ext ? ext.slice(1) : '(none)'}. Supported: ${supported}`);
	}
	return mime;
}

/**
 * Resolves a local file path or URL into an image_urls array for the Poyo API.
 *
 * - URLs (http/https) are returned as-is.
 * - Local files are read, base64-encoded, and uploaded to Poyo temporary storage.
 *   Falls back to a data URI if upload fails.
 *
 * @throws If the local file does not exist or has an unsupported extension.
 */
export async function resolveImageInput(pathOrUrl: string): Promise<string[]> {
	if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
		return [pathOrUrl];
	}

	const absPath = resolve(pathOrUrl);
	if (!existsSync(absPath)) {
		throw new Error(`Image not found: ${absPath}`);
	}

	const mime = validateImageExtension(absPath);
	const buffer = readFileSync(absPath);
	const base64 = buffer.toString('base64');
	const dataUri = `data:${mime};base64,${base64}`;

	const uploaded = await tryUploadToPoyo(dataUri);
	return [uploaded ?? dataUri];
}

/**
 * Attempts to upload an image to Poyo temporary storage.
 * @returns The hosted URL on success, null on failure.
 */
async function tryUploadToPoyo(dataUri: string): Promise<string | null> {
	const apiKey = getEnv('POYO_API_KEY');
	if (!apiKey) return null;

	try {
		const res = await fetch('https://api.poyo.ai/api/common/upload/url', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ file_url: dataUri }),
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
}
