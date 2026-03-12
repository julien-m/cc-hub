import { unlinkSync, existsSync } from 'node:fs';
import { getDb } from '../db/index.ts';
import { getConfig } from '../commands/config.ts';

export async function purgeOldEvents(): Promise<void> {
  const config = getConfig();
  const days = (config['purge.days'] as number) || 30;

  const db = await getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString();

  const oldEvents = await db.execute({
    sql: 'SELECT id, artifact_path FROM events WHERE created_at < ?',
    args: [cutoffISO],
  });

  for (const event of oldEvents.rows) {
    if (event.artifact_path && existsSync(String(event.artifact_path))) {
      try {
        unlinkSync(String(event.artifact_path));
      } catch {
        // artifact already gone
      }
    }
  }

  const result = await db.execute({
    sql: 'DELETE FROM events WHERE created_at < ?',
    args: [cutoffISO],
  });

  if (result.rowsAffected > 0) {
    console.error(`🗑️  Purgé ${result.rowsAffected} événements de plus de ${days} jours`);
  }
}
