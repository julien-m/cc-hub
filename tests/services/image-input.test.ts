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
		const result = await resolveImageInput('http://example.com/photo.png');
		expect(result).toEqual(['http://example.com/photo.png']);
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
		const tempPath = '/tmp/cc-hub-test-image.png';
		const { writeFileSync, unlinkSync } = await import('node:fs');
		const png = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
			'base64',
		);
		writeFileSync(tempPath, png);

		try {
			const result = await resolveImageInput(tempPath);
			expect(result).toHaveLength(1);
			expect(
				result[0].startsWith('https://') || result[0].startsWith('data:image/png;base64,'),
			).toBe(true);
		} finally {
			unlinkSync(tempPath);
		}
	});
});
