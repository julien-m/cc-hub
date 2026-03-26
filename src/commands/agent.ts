/**
 * Agent command — thin wrapper over claude-link for managing Claude Code agents.
 */

import { createClaudeLinkCommand, agentConfig } from './claude-link.ts';
import type { Command } from 'commander';

/** Creates the `agent` subcommand for managing Claude Code agents globally. */
export const createAgentCommand = (): Command => {
	return createClaudeLinkCommand(agentConfig);
};
