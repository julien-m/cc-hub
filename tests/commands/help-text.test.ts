import { describe, expect, it } from "bun:test";
import { createImagineCommand } from "../../src/commands/imagine.ts";
import { createMotionCommand } from "../../src/commands/motion.ts";
import { createVideoCommand } from "../../src/commands/video.ts";

/**
 * Extract the description block for the `-i, --image` option from Commander
 * help output. Commander wraps long descriptions onto multiple lines, so we
 * capture from the line that contains the flag up to (but not including) the
 * next option line (line starting with at least 2 spaces and a `-`).
 */
const imageOptionBlock = (help: string): string => {
	const lines = help.split("\n");
	const startIdx = lines.findIndex((l) => l.includes("-i, --image"));
	if (startIdx === -1) throw new Error(`-i, --image option not found in help:\n${help}`);
	const block: string[] = [lines[startIdx]];
	for (let i = startIdx + 1; i < lines.length; i++) {
		if (/^\s{2,}-\w/.test(lines[i])) break;
		block.push(lines[i]);
	}
	return block.join("\n");
};

describe("help text — repeatable -i", () => {
	it("imagine --help mentions repeatable on -i", () => {
		const help = createImagineCommand().helpInformation();
		expect(imageOptionBlock(help)).toContain("repeatable");
	});

	it("video --help mentions repeatable on -i", () => {
		const help = createVideoCommand().helpInformation();
		expect(imageOptionBlock(help)).toContain("repeatable");
	});

	it("motion --help mentions repeatable on -i", () => {
		const help = createMotionCommand().helpInformation();
		expect(imageOptionBlock(help)).toContain("repeatable");
	});
});
