import { execFileSync } from 'node:child_process';
import { Command } from 'commander';

const CRON_COMMENT = '# cc-hub-digest';

function getCurrentCrontab(): string {
  try {
    return execFileSync('crontab', ['-l'], { encoding: 'utf-8' });
  } catch {
    return '';
  }
}

function setCrontab(content: string): void {
  try {
    execFileSync('crontab', ['-'], {
      input: content,
      encoding: 'utf-8',
    });
  } catch (err) {
    console.error(`❌ Erreur crontab: ${(err as Error).message}`);
    process.exit(4);
  }
}

export function createScheduleCommand(): Command {
  const schedule = new Command('schedule').description(
    'Planifier le digest quotidien',
  );

  schedule
    .command('set <time>')
    .description('Planifier le digest (format HH:MM)')
    .action((time: string) => {
      const match = time.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) {
        console.error('Format invalide. Utilise HH:MM (ex: 08:00)');
        process.exit(1);
      }

      const [, hour, minute] = match;
      if (parseInt(hour) > 23 || parseInt(minute) > 59) {
        console.error('Heure invalide. Utilise HH:MM (00:00 - 23:59)');
        process.exit(1);
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
      console.error(`✅ Digest planifié tous les jours à ${time}`);
    });

  schedule
    .command('remove')
    .description('Supprimer la planification')
    .action(() => {
      const crontab = getCurrentCrontab();
      const lines = crontab
        .split('\n')
        .filter((line) => !line.includes(CRON_COMMENT));
      setCrontab(lines.join('\n'));
      console.error('✅ Planification supprimée');
    });

  schedule
    .command('status')
    .description('Afficher la planification actuelle')
    .action(() => {
      const crontab = getCurrentCrontab();
      const line = crontab
        .split('\n')
        .find((l) => l.includes(CRON_COMMENT));

      if (!line) {
        console.log('Aucun digest planifié.');
        return;
      }

      const parts = line.trim().split(/\s+/);
      const minute = parts[0];
      const hour = parts[1];
      console.log(
        `📅 Digest planifié tous les jours à ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
      );
    });

  return schedule;
}
