/** Rule command — thin wrapper over claude-link for managing Claude Code rules. */

import type { Command } from "commander";
import { createClaudeLinkCommand, ruleConfig } from "./claude-link.ts";

/**
 * Create the `rule` command group.
 * @returns The configured Commander command.
 */
export const createRuleCommand = (): Command => createClaudeLinkCommand(ruleConfig);
