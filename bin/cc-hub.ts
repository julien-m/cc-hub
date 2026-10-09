#!/usr/bin/env bun

import { CommanderError } from "commander";
import { program } from "../src/cli.ts";

// Await async actions so decision output files and errors finish before command completion.
try {
	await program.parseAsync();
} catch (error) {
	// Commander already printed help/errors; preserve its code while Bun finishes queued output.
	if (!(error instanceof CommanderError)) throw error;
	process.exitCode = error.exitCode;
}
