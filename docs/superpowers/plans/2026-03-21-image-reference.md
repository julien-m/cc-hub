# Image Reference Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `-i, --image <path_or_url>` option to `imagine` and `video` commands for image reference support via Poyo API's `image_urls` parameter.

**Architecture:** New `src/services/image-input.ts` module handles resolution of local files or URLs into `image_urls` arrays. Local files are read, base64-encoded, and uploaded to Poyo temporary storage. Commands pass the resolved URLs into the existing `generateMedia()` input object.

**Tech Stack:** TypeScript, Bun runtime, Poyo API (`/api/common/upload/url`), Commander CLI

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/services/image-input.ts` | Create | Resolve local path or URL → `string[]` for `image_urls` |
| `tests/services/image-input.test.ts` | Create | Unit tests for image-input module |
| `src/commands/imagine.ts` | Modify | Add `-i, --image` option, wire to `resolveImageInput` |
| `src/commands/video.ts` | Modify | Add `-i, --image` option, wire to `resolveImageInput` |

---

## Task 1: Image Input Service — Core Logic

**Files:**
- Create: `src/services/image-input.ts`
- Create: `tests/services/image-input.test.ts`

This task builds the `resolveImageInput()` function that converts a user-provided path or URL into a `string[]` suitable for the Poyo `image_urls` parameter.

- [ ] **Step 1: Write failing tests for URL passthrough and extension validation**

```typescript
// tests/services/image-input.test.ts
import { describe, expect, test } from 'bun:test';
import { resolveImageInput, validateImageExtension } from '../../src/services/image-input.ts';

describe('validateImageExtension', () => {
	test('should accept .png', () => {
		expect(validateImageExtension('photo.png')).toBe('image/png');
	});

	test('should accept .jpg', () => {
		expect(validateImageExtension('photo.jpg')).toBe('image/jpeg');
	});

	test('should accept .jpeg', () => {
		expect(validateImageExtension('photo.jpeg')).toBe('image/jpeg');
	});

	test('should accept .webp', () => {
		expect(validateImageExtension('photo.webp')).toBe('image/webp');
	});

	test('should be case-insensitive', () => {
		expect(validateImageExtension('photo.PNG')).toBe('image/png');
	});

	test('should throw for unsupported extension', () => {
		expect(() => validateImageExtension('doc.pdf')).toThrow('Unsupported image format');
	});

	test('should throw for file with no extension', () => {
		expect(() => validateImageExtension('noext')).toThrow('Unsupported image format');
	});
});

describe('resolveImageInput', () => {
	test('should pass HTTP URLs through directly', async () => {
		const result = await resolveImageInput('https://example.com/photo.png');
		expect(result).toEqual(['https://example.com/photo.png']);
	});

	test('should pass HTTPS URLs through directly', async () => {
		const result = await resolveImageInput('https://cdn.example.com/img.jpg');
		expect(result).toEqual(['https://cdn.example.com/img.jpg']);
	});

	test('should pass URLs through without validating extension', async () => {
		const result = await resolveImageInput('https://example.com/api/image?id=42');
		expect(result).toEqual(['https://example.com/api/image?id=42']);
	});

	test('should throw for non-existent local file', async () => {
		await expect(resolveImageInput('/tmp/nonexistent-image-abc123.png')).rejects.toThrow(
			'Image not found',
		);
	});

	test('should read a local file and return a data URI or uploaded URL', async () => {
		// Create a tiny 1x1 red PNG for testing
		const tempPath = '/tmp/cc-hub-test-image.png';
		const { writeFileSync } = await import('node:fs');
		// Minimal valid PNG (1x1 red pixel)
		const png = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
			'base64',
		);
		writeFileSync(tempPath, png);

		const result = await resolveImageInput(tempPath);
		expect(result).toHaveLength(1);
		// Either a Poyo URL or a data URI fallback
		expect(
			result[0].startsWith('https://') || result[0].startsWith('data:image/png;base64,'),
		).toBe(true);

		// Cleanup
		const { unlinkSync } = await import('node:fs');
		unlinkSync(tempPath);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test tests/services/image-input.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement image-input service**

```typescript
// src/services/image-input.ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test tests/services/image-input.test.ts`
Expected: All 12 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/image-input.ts tests/services/image-input.test.ts
git commit -m "feat(image-input): add service to resolve image paths/URLs for Poyo API"
```

---

## Task 2: Wire `-i, --image` into `imagine` command

**Files:**
- Modify: `src/commands/imagine.ts`

- [ ] **Step 1: Add the `-i` option and wire `resolveImageInput`**

In `src/commands/imagine.ts`, add:
1. Import `resolveImageInput` from `../services/image-input.ts`
2. Add `.option('-i, --image <path>', 'Image de référence (chemin local ou URL)')` after the `--resolution` option
3. Add `image?: string` to the opts type
4. Before the `generateMedia` call, resolve image input and merge into input:

```typescript
// After model resolution, before generateMedia call:
let imageUrls: string[] | undefined;
if (opts.image) {
	console.error('🖼️  Résolution de l\'image de référence...');
	imageUrls = await resolveImageInput(opts.image);
}

// In the generateMedia call, spread image_urls:
const task = await generateMedia({
	model,
	input: {
		prompt,
		size: opts.size,
		resolution: opts.resolution,
		...(imageUrls && { image_urls: imageUrls }),
	},
});
```

- [ ] **Step 2: Manually verify the command help shows `-i`**

Run: `bun bin/cc-hub.ts imagine --help`
Expected: output includes `-i, --image <path>  Image de référence (chemin local ou URL)`

- [ ] **Step 3: Commit**

```bash
git add src/commands/imagine.ts
git commit -m "feat(imagine): add -i/--image option for reference image input"
```

---

## Task 3: Wire `-i, --image` into `video` command

**Files:**
- Modify: `src/commands/video.ts`

- [ ] **Step 1: Add the `-i` option and wire `resolveImageInput`**

In `src/commands/video.ts`, add:
1. Import `resolveImageInput` from `../services/image-input.ts`
2. Add `.option('-i, --image <path>', 'Image de départ pour animation (chemin local ou URL)')` after the `--aspect-ratio` option
3. Add `image?: string` to the opts type
4. Before the `generateMedia` call, resolve image input and merge into input:

```typescript
// After model resolution, before generateMedia call:
let imageUrls: string[] | undefined;
if (opts.image) {
	console.error('🖼️  Résolution de l\'image de référence...');
	imageUrls = await resolveImageInput(opts.image);
}

// In the generateMedia call, spread image_urls:
const task = await generateMedia({
	model,
	input: {
		prompt,
		duration: parseInt(opts.duration, 10),
		aspect_ratio: opts.aspectRatio,
		sound: true,
		...(imageUrls && { image_urls: imageUrls }),
	},
});
```

- [ ] **Step 2: Manually verify the command help shows `-i`**

Run: `bun bin/cc-hub.ts video --help`
Expected: output includes `-i, --image <path>  Image de départ pour animation (chemin local ou URL)`

- [ ] **Step 3: Commit**

```bash
git add src/commands/video.ts
git commit -m "feat(video): add -i/--image option for start frame image input"
```

---

## Task 4: Update CLI documentation

**Files:**
- Modify: `.claude/rules/cc-hub.md`

- [ ] **Step 1: Update `imagine` section in cc-hub.md**

Add `-i, --image` option to the `imagine` CLI signature and add usage examples:

```bash
cc-hub imagine "Description" -o output.png                              # text-to-image
cc-hub imagine "Transform into watercolor" -i ./photo.png -o result.png # with local reference
cc-hub imagine "Stylize this" -i https://example.com/img.jpg -o out.png # with URL reference
```

- [ ] **Step 2: Update `video` section in cc-hub.md**

Add `-i, --image` option to the `video` CLI signature and add usage examples:

```bash
cc-hub video "Description" -o clip.mp4                                    # text-to-video
cc-hub video "The person starts walking" -i ./portrait.jpg -o animated.mp4 # image-to-video
cc-hub video "Zoom out slowly" -i https://example.com/scene.png -o out.mp4 # with URL reference
```

- [ ] **Step 3: Commit**

```bash
git add .claude/rules/cc-hub.md
git commit -m "docs(cc-hub): add -i/--image option to imagine and video documentation"
```

---

## Task 5: End-to-end validation

- [ ] **Step 1: Run all tests**

Run: `bun test`
Expected: All tests pass (models + image-input)

- [ ] **Step 2: Create a test image and smoke test imagine**

```bash
# Create a tiny test PNG (1x1 pixel)
echo -n 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' | base64 -d > /tmp/cc-hub-smoke-test.png
```

Run: `bun bin/cc-hub.ts imagine "a cat wearing sunglasses, photorealistic" -i /tmp/cc-hub-smoke-test.png -o /tmp/test-imagine.png`
Expected: Image generated with reference influence, saved to `/tmp/test-imagine.png`

- [ ] **Step 3: Smoke test video with image**

Run: `bun bin/cc-hub.ts video "the cat turns its head slowly" -i /tmp/cc-hub-smoke-test.png -o /tmp/test-video.mp4`
Expected: Video generated from start frame, saved to `/tmp/test-video.mp4`

- [ ] **Step 4: Verify commands still work without `-i` (regression)**

Run: `bun bin/cc-hub.ts imagine "a sunset over mountains" -o /tmp/test-no-ref.png`
Expected: Works exactly as before, no regression
