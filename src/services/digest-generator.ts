import { type Row } from '@libsql/client';
import { getDb } from '../db/index.ts';
import { statusIcon } from '../utils/format.ts';

export async function getEventsForDigest(since?: string): Promise<Row[]> {
  const db = await getDb();
  const sinceDate =
    since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const result = await db.execute({
    sql: 'SELECT * FROM events WHERE created_at >= ? ORDER BY created_at ASC',
    args: [sinceDate],
  });

  return result.rows;
}

export function formatDigestPreview(events: Row[]): string {
  if (events.length === 0) return 'Aucun événement pour cette période.';

  const today = new Date().toLocaleDateString('fr-FR');
  const lines = [`Digest du ${today}`, '─────────────────────'];

  for (const event of events) {
    lines.push(
      `${statusIcon(String(event.status))} ${event.title} (${new Date(String(event.created_at)).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})${event.artifact_path ? ' [artifact]' : ''}`,
    );
  }

  const failed = events.filter((e) => e.status === 'failed');
  if (failed.length > 0) {
    lines.push('');
    lines.push(
      `${failed.length} point${failed.length > 1 ? 's' : ''} d'attention : ${failed.map((e) => String(e.title)).join(', ')}`,
    );
  }

  return lines.join('\n');
}
