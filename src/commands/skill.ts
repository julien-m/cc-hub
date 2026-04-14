/** Skill command — thin wrapper over claude-link for managing Claude Code skills. */

import type { Command } from "commander";
import { createClaudeLinkCommand, skillConfig } from "./claude-link.ts";

/**
 * Create the `skill` command group.
 * @returns The configured Commander command.
 */
export const createSkillCommand = (): Command => createClaudeLinkCommand(skillConfig);
