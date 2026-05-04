import { describe, expect, it } from "bun:test";
import { collect } from "../../src/infra/option-collectors.ts";

describe("collect", () => {
	it("returns a single-element array when starting from []", () => {
		expect(collect("a", [])).toEqual(["a"]);
	});

	it("appends to an existing accumulator preserving order", () => {
		expect(collect("b", ["a"])).toEqual(["a", "b"]);
		expect(collect("c", ["a", "b"])).toEqual(["a", "b", "c"]);
	});

	it("does not mutate the previous array", () => {
		const previous = ["a"];
		const next = collect("b", previous);
		expect(previous).toEqual(["a"]);
		expect(next).not.toBe(previous);
	});

	it("accumulates duplicates without dedup", () => {
		expect(collect("a", ["a"])).toEqual(["a", "a"]);
	});
});
