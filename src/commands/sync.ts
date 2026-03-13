import { Command } from 'commander';
import { getDb, syncDb, isTursoEnabled } from '../db/index.ts';

export function createSyncCommand(): Command {
  const sync = new Command('sync').description(
    'Synchroniser la base de données dans le cloud',
  );

  sync
    .command('run')
    .description('Lancer une synchronisation manuelle')
    .action(async () => {
      try {
        const synced = await syncDb();
        if (synced) {
          console.error('✅ Synchronisation Turso terminée');
        } else {
          console.error('⚠️  Turso non configuré — mode local uniquement');
          console.error('   → Configure les credentials :');
          console.error('     creds set TURSO_DATABASE_URL');
          console.error('     creds set TURSO_AUTH_TOKEN');
        }
      } catch (err) {
        console.error(`❌ Erreur de synchronisation: ${(err as Error).message}`);
        process.exit(4);
      }
    });

  sync
    .command('status')
    .description('Afficher le statut de la synchronisation')
    .action(async () => {
      await getDb();
      if (isTursoEnabled()) {
        console.log('🔄 Turso Cloud activé — synchronisation disponible');
      } else {
        console.log('💾 Mode local uniquement (pas de Turso configuré)');
      }
    });

  return sync;
}
