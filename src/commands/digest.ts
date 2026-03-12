import { existsSync } from 'node:fs';
import { Command } from 'commander';
import {
  getEventsForDigest,
  formatDigestPreview,
} from '../services/digest-generator.ts';

export function createDigestCommand(): Command {
  const digest = new Command('digest').description(
    'Digest quotidien',
  );

  digest
    .command('preview')
    .description('Afficher les événements bruts')
    .option('--since <date>', 'Date de début (ISO)')
    .action(async (opts: { since?: string }) => {
      const events = await getEventsForDigest(opts.since);
      console.log(formatDigestPreview(events));
    });

  digest
    .command('files')
    .description('Lister les fichiers artifacts')
    .option('--since <date>', 'Date de début (ISO)')
    .option('--important', 'Uniquement les artifacts importants')
    .action(async (opts: { since?: string; important?: boolean }) => {
      const events = await getEventsForDigest(opts.since);
      const withArtifacts = events.filter(
        (e) =>
          e.artifact_path &&
          existsSync(String(e.artifact_path)) &&
          (!opts.important || e.important),
      );

      if (withArtifacts.length === 0) {
        console.error('Aucun artifact pour cette période.');
        return;
      }

      for (const event of withArtifacts) {
        console.log(event.artifact_path);
      }
    });

  return digest;
}
