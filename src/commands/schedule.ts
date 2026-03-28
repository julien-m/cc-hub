/** Command handler for scheduling the daily digest via cron. */
import { exitCode } from '../errors.ts';
import { execFileSync } from 'node:child_process';
import { Command } from 'commander';

const CRON_COMMENT = '# cc-hub-digest';

/**
 * Read the current user crontab.
 * @returns The raw crontab string, or empty string if none exists.
 */
const getCurrentCrontab = (): string => {
  try {
    return execFileSync('crontab', ['-l'], { encoding: 'utf-8' });
  } catch {
    return '';
  }
};

/**
 * Replace the user crontab with the given content.
 * @param content - Full crontab content to write.
 */
const setCrontab = (content: string): void => {
  try {
    execFileSync('crontab', ['-'], {
      input: content,
      encoding: 'utf-8',
    });
  } catch (err) {
    console.error(
      `Failed to update crontab: ${(err as Error).message}. ` +
      'Verify crontab permissions and that crond is running.',
    );
    process.exit(exitCode(err, 4));
  }
};

/**
 * Create the `schedule` command group.
 * @returns The configured Commander command.
 */
export const createScheduleCommand = (): Command => {
  const schedule = new Command('schedule').description(
    'Schedule the daily digest',
  );

  schedule
    .command('set <time>')
    .description('Schedule the digest (format HH:MM)')
    .action((time: string) => {
      const match = time.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) {
        console.error('Invalid format. Use HH:MM (e.g. 08:00)');
        process.exit(2);
      }

      const [, hour, minute] = match;
      if (parseInt(hour) > 23 || parseInt(minute) > 59) {
        console.error('Invalid time. Use HH:MM (00:00 - 23:59)');
        process.exit(2);
      }
      const ccHubPath = process.argv[1];

      let crontab = getCurrentCrontab()
        .split('\n')
        .filter((line) => !line.includes(CRON_COMMENT))
        .join('\n')
        .trim();

      const cronLine = `${minute} ${hour} * * * "${ccHubPath}" digest send ${CRON_COMMENT}`;
      crontab = crontab ? `${crontab}\n${cronLine}\n` : `${cronLine}\n`;

      setCrontab(crontab);
      console.error(`Digest scheduled daily at ${time}`);
    });

  schedule
    .command('remove')
    .description('Remove the schedule')
    .action(() => {
      const crontab = getCurrentCrontab();
      const lines = crontab
        .split('\n')
        .filter((line) => !line.includes(CRON_COMMENT));
      setCrontab(lines.join('\n'));
      console.error('Schedule removed');
    });

  schedule
    .command('status')
    .description('Show the current schedule')
    .action(() => {
      const crontab = getCurrentCrontab();
      const line = crontab
        .split('\n')
        .find((l) => l.includes(CRON_COMMENT));

      if (!line) {
        console.log('No digest scheduled.');
        return;
      }

      const parts = line.trim().split(/\s+/);
      const minute = parts[0];
      const hour = parts[1];
      console.log(
        `Digest scheduled daily at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
      );
    });

  return schedule;
};
