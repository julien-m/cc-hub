/** Command handler for the daily digest preview and artifact listing. */
import { existsSync } from 'node:fs';
import { Command } from 'commander';
import {
  getEventsForDigest,
  formatDigestPreview,
} from '../services/digest-generator.ts';

/**
 * Create the `digest` command group.
 * @returns The configured Commander command.
 */
export const createDigestCommand = (): Command => {
  const digest = new Command('digest').description(
    'Daily digest',
  );

  digest
    .command('preview')
    .description('Show raw events')
    .option('-s, --since <date>', 'Start date (ISO)')
    .action(async (opts: { since?: string }) => {
      const events = await getEventsForDigest(opts.since);
      console.log(formatDigestPreview(events));
    });

  digest
    .command('files')
    .description('List artifact files')
    .option('-s, --since <date>', 'Start date (ISO)')
    .option('-i, --important', 'Only important artifacts')
    .action(async (opts: { since?: string; important?: boolean }) => {
      const events = await getEventsForDigest(opts.since);
      const withArtifacts = events.filter(
        (e) =>
          e.artifact_path &&
          existsSync(String(e.artifact_path)) &&
          (!opts.important || e.important),
      );

      if (withArtifacts.length === 0) {
        console.error('No artifacts for this period.');
        return;
      }

      for (const event of withArtifacts) {
        console.log(event.artifact_path);
      }
    });

  return digest;
};
