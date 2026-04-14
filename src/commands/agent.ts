/** Agent command — thin wrapper over claude-link for managing Claude Code agents. */

import type { Command } from "commander";
import { agentConfig, createClaudeLinkCommand } from "./claude-link.ts";

/**
 * Create the `agent` command group for managing Claude Code agents globally.
 * @returns The configured Commander command.
 */
export const createAgentCommand = (): Command => createClaudeLinkCommand(agentConfig);
