import { describe, expect, it } from "bun:test";
import { unlinkSync, writeFileSync } from "node:fs";
import { resolveImageInput, validateImageExtension } from "../../src/services/image-input.ts";

describe("validateImageExtension", () => {
	it("should accept .png", () => {
		expect(validateImageExtension("photo.png")).toBe("image/png");
	});

	it("should accept .jpg", () => {
		expect(validateImageExtension("photo.jpg")).toBe("image/jpeg");
	});

	it("should accept .jpeg", () => {
		expect(validateImageExtension("photo.jpeg")).toBe("image/jpeg");
	});

	it("should accept .webp", () => {
		expect(validateImageExtension("photo.webp")).toBe("image/webp");
	});

	it("should be case-insensitive", () => {
		expect(validateImageExtension("photo.PNG")).toBe("image/png");
	});

	it("should throw for unsupported extension", () => {
		expect(() => validateImageExtension("doc.pdf")).toThrow("Unsupported image format");
	});

	it("should throw for file with no extension", () => {
		expect(() => validateImageExtension("noext")).toThrow("Unsupported image format");
	});
});

describe("resolveImageInput", () => {
	it("should pass HTTP URLs through directly", async () => {
		const result = await resolveImageInput("http://example.com/photo.png");
		expect(result).toEqual(["http://example.com/photo.png"]);
	});

	it("should pass HTTPS URLs through directly", async () => {
		const result = await resolveImageInput("https://cdn.example.com/img.jpg");
		expect(result).toEqual(["https://cdn.example.com/img.jpg"]);
	});

	it("should pass URLs through without validating extension", async () => {
		const result = await resolveImageInput("https://example.com/api/image?id=42");
		expect(result).toEqual(["https://example.com/api/image?id=42"]);
	});

	it("should throw for non-existent local file", async () => {
		await expect(resolveImageInput("/tmp/nonexistent-image-abc123.png")).rejects.toThrow("Image not found");
	});

	it("should read a local file and return a data URI or uploaded URL", async () => {
		const tempPath = "/tmp/cc-hub-test-image.png";
		const png = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
			"base64",
		);
		writeFileSync(tempPath, png);

		try {
			const result = await resolveImageInput(tempPath);
			expect(result).toHaveLength(1);
			expect(result[0].startsWith("https://") || result[0].startsWith("data:image/png;base64,")).toBe(true);
		} finally {
			unlinkSync(tempPath);
		}
	});
});
