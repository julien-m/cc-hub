import { afterEach, describe, expect, it } from "bun:test";
import { AppError } from "../errors.ts";

describe("resolvePrompt", () => {
	const originalIsTTY = process.stdin.isTTY;

	afterEach(() => {
		Object.defineProperty(process.stdin, "isTTY", { value: originalIsTTY, writable: true, configurable: true });
	});

	const setTTY = (value: boolean | undefined) => {
		Object.defineProperty(process.stdin, "isTTY", { value, writable: true, configurable: true });
	};

	it("should return prompt from arg when no stdin", async () => {
		setTTY(true);
		const { resolvePrompt } = await import("./prompt.ts");
		const result = await resolvePrompt("hello");
		expect(result).toEqual({ prompt: "hello" });
	});

	it("should throw when no prompt arg and no stdin (TTY)", async () => {
		setTTY(true);
		const { resolvePrompt } = await import("./prompt.ts");
		try {
			await resolvePrompt(undefined);
			throw new Error("should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(AppError);
			expect((err as AppError).code).toBe(2);
		}
	});

	it("should throw when no prompt arg and no stdin (explicit undefined)", async () => {
		setTTY(true);
		const { resolvePrompt } = await import("./prompt.ts");
		try {
			await resolvePrompt();
			throw new Error("should have thrown");
		} catch (err) {
			expect(err).toBeInstanceOf(AppError);
			expect((err as AppError).message).toContain("No prompt provided");
		}
	});
});
