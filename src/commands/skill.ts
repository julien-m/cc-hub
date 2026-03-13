import { createClaudeLinkCommand, skillConfig } from './claude-link.ts';
import type { Command } from 'commander';

export function createSkillCommand(): Command {
  return createClaudeLinkCommand(skillConfig);
}
