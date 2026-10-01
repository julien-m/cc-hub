#!/usr/bin/env bun

import { program } from "../src/cli.ts";

// Await async actions so decision output files and errors finish before command completion.
await program.parseAsync();
