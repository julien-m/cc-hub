/** Agent command — thin wrapper over claude-link for managing Claude Code agents. */
import { createClaudeLinkCommand, agentConfig } from './claude-link.ts';
import type { Command } from 'commander';

/**
 * Create the `agent` command group for managing Claude Code agents globally.
 * @returns The configured Commander command.
 */
export const createAgentCommand = (): Command =>
  createClaudeLinkCommand(agentConfig);
