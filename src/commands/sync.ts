/** Command handler for database synchronization with Turso cloud. */
import { exitCode } from '../errors.ts';
import { Command } from 'commander';
import { getDb, syncDb, isTursoEnabled } from '../db/index.ts';

/**
 * Create the `sync` command group.
 * @returns The configured Commander command.
 */
export const createSyncCommand = (): Command => {
  const sync = new Command('sync').description(
    'Synchronize the database with the cloud',
  );

  sync
    .command('run')
    .description('Run a manual synchronization')
    .action(async () => {
      try {
        const synced = await syncDb();
        if (synced) {
          console.error('Turso sync complete');
        } else {
          console.error('Turso not configured — local-only mode');
          console.error('   Set credentials with:');
          console.error('     creds set TURSO_DATABASE_URL');
          console.error('     creds set TURSO_AUTH_TOKEN');
        }
      } catch (err) {
        console.error(
          `Sync failed: ${(err as Error).message}. ` +
          'Verify TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.',
        );
        process.exit(exitCode(err, 4));
      }
    });

  sync
    .command('status')
    .description('Show synchronization status')
    .action(async () => {
      await getDb();
      if (isTursoEnabled()) {
        console.log('Turso Cloud enabled — sync available');
      } else {
        console.log('Local-only mode (Turso not configured)');
      }
    });

  return sync;
};
