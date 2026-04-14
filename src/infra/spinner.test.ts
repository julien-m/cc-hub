import { afterEach, describe, expect, it } from "bun:test";
import { Spinner } from "./spinner.ts";

describe("Spinner", () => {
	const originalIsTTY = process.stderr.isTTY;

	afterEach(() => {
		Object.defineProperty(process.stderr, "isTTY", { value: originalIsTTY, writable: true });
		delete process.env.CI;
		delete process.env.NO_COLOR;
	});

	const setNonInteractive = () => {
		Object.defineProperty(process.stderr, "isTTY", { value: false, writable: true });
	};

	it("should create a spinner with a label", () => {
		const spinner = new Spinner("Loading...");
		expect(spinner).toBeDefined();
		expect(spinner.elapsed).toBe(false);
	});

	it("should accept elapsed option", () => {
		const spinner = new Spinner("Loading...", { elapsed: true });
		expect(spinner.elapsed).toBe(true);
	});

	it("should start and stop without errors", () => {
		setNonInteractive();
		const spinner = new Spinner("Test").start();
		spinner.stop();
	});

	it("should succeed without errors", () => {
		setNonInteractive();
		const spinner = new Spinner("Test").start();
		spinner.succeed("Done");
	});

	it("should fail without errors", () => {
		setNonInteractive();
		const spinner = new Spinner("Test").start();
		spinner.fail("Error");
	});

	it("should handle update on a running spinner", () => {
		setNonInteractive();
		const spinner = new Spinner("Step 1").start();
		spinner.update("Step 2");
		spinner.succeed("Finished");
	});

	it("should be idempotent on double start", () => {
		setNonInteractive();
		const spinner = new Spinner("Test").start();
		spinner.start(); // should not throw
		spinner.stop();
	});

	it("should be idempotent on double stop", () => {
		setNonInteractive();
		const spinner = new Spinner("Test").start();
		spinner.stop();
		spinner.stop(); // should not throw
	});

	it("should handle succeed on a stopped spinner", () => {
		setNonInteractive();
		const spinner = new Spinner("Test").start();
		spinner.stop();
		spinner.succeed("Done"); // should not throw
	});

	it("should detect CI as non-interactive", () => {
		process.env.CI = "true";
		const spinner = new Spinner("CI test").start();
		spinner.succeed("OK");
	});

	it("should detect NO_COLOR as non-interactive", () => {
		process.env.NO_COLOR = "1";
		const spinner = new Spinner("NO_COLOR test").start();
		spinner.succeed("OK");
	});

	it("should support multiple concurrent spinners", () => {
		setNonInteractive();
		const s1 = new Spinner("Task 1").start();
		const s2 = new Spinner("Task 2").start();
		const s3 = new Spinner("Task 3").start();
		s2.succeed("Task 2 done");
		s1.succeed("Task 1 done");
		s3.succeed("Task 3 done");
	});
});
