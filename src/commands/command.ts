/** Command command — thin wrapper over claude-link for managing Claude Code commands. */
import { createClaudeLinkCommand, commandConfig } from './claude-link.ts';
import type { Command } from 'commander';

/**
 * Create the `command` command group.
 * @returns The configured Commander command.
 */
export const createCommandCommand = (): Command =>
  createClaudeLinkCommand(commandConfig);
