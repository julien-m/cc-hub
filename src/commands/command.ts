import { createClaudeLinkCommand, commandConfig } from './claude-link.ts';
import type { Command } from 'commander';

export function createCommandCommand(): Command {
  return createClaudeLinkCommand(commandConfig);
}
