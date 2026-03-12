import { Command } from 'commander';
import { createLogCommand } from './commands/log.ts';
import { createDigestCommand } from './commands/digest.ts';
import { createScheduleCommand } from './commands/schedule.ts';
import { createConfigCommand } from './commands/config.ts';
import { createAskCommand } from './commands/ask.ts';
import { createImagineCommand } from './commands/imagine.ts';
import { createVideoCommand } from './commands/video.ts';
import { createTranscribeCommand } from './commands/transcribe.ts';
import { createPromptCommand } from './commands/prompt.ts';
import { createSyncCommand } from './commands/sync.ts';
import { createTelegramCommand } from './commands/telegram.ts';

const program = new Command();

program
  .name('cc-hub')
  .description('CLI couteau suisse IA — logs, digest, multi-modèles')
  .version('0.1.0');

program.addCommand(createLogCommand());
program.addCommand(createDigestCommand());
program.addCommand(createScheduleCommand());
program.addCommand(createConfigCommand());
program.addCommand(createAskCommand());
program.addCommand(createImagineCommand());
program.addCommand(createVideoCommand());
program.addCommand(createTranscribeCommand());
program.addCommand(createPromptCommand());
program.addCommand(createSyncCommand());
program.addCommand(createTelegramCommand());

export { program };
