import { createClaudeLinkCommand, ruleConfig } from './claude-link.ts';
import type { Command } from 'commander';

export function createRuleCommand(): Command {
  return createClaudeLinkCommand(ruleConfig);
}
