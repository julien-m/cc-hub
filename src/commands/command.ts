/** Command command — thin wrapper over claude-link for managing Claude Code commands. */

import type { Command } from "commander";
import { commandConfig, createClaudeLinkCommand } from "./claude-link.ts";

/**
 * Create the `command` command group.
 * @returns The configured Commander command.
 */
export const createCommandCommand = (): Command => createClaudeLinkCommand(commandConfig);
