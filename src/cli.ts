import { Command } from 'commander';
import { createLogCommand } from './commands/log.ts';
import { createDigestCommand } from './commands/digest.ts';
import { createScheduleCommand } from './commands/schedule.ts';
import { createConfigCommand } from './commands/config.ts';
import { createAskCommand } from './commands/ask.ts';
import { createImagineCommand } from './commands/imagine.ts';
import { createVideoCommand } from './commands/video.ts';
import { createMotionCommand } from './commands/motion.ts';
import { createTranscribeCommand } from './commands/transcribe.ts';
import { createPromptCommand } from './commands/prompt.ts';
import { createSyncCommand } from './commands/sync.ts';
import { createTelegramCommand } from './commands/telegram.ts';
import { createSkillCommand } from './commands/skill.ts';
import { createCommandCommand } from './commands/command.ts';
import { createRuleCommand } from './commands/rule.ts';
import { createAgentCommand } from './commands/agent.ts';
import { createCopilotCommand } from './commands/copilot.ts';
import { createModelsCommand } from './commands/models.ts';
import { createMusicCommand } from './commands/music.ts';

const program = new Command();

program
  .name('cc-hub')
  .description('All-in-one AI CLI — logs, digest, multi-model')
  .version('0.1.0');

program.addCommand(createLogCommand());
program.addCommand(createDigestCommand());
program.addCommand(createScheduleCommand());
program.addCommand(createConfigCommand());
program.addCommand(createAskCommand());
program.addCommand(createImagineCommand());
program.addCommand(createVideoCommand());
program.addCommand(createMotionCommand());
program.addCommand(createTranscribeCommand());
program.addCommand(createPromptCommand());
program.addCommand(createSyncCommand());
program.addCommand(createTelegramCommand());
program.addCommand(createSkillCommand());
program.addCommand(createCommandCommand());
program.addCommand(createRuleCommand());
program.addCommand(createAgentCommand());
program.addCommand(createCopilotCommand());
program.addCommand(createModelsCommand());
program.addCommand(createMusicCommand());

export { program };
