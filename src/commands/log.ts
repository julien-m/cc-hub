/** Command handler for activity log management. */
import { existsSync, readFileSync } from 'node:fs';
import { Command } from 'commander';
import { type Row } from '@libsql/client';
import { getDb } from '../db/index.ts';
import { storeArtifact } from '../services/artifacts.ts';
import { formatEvent, formatEventDetail, type EventRow } from '../services/format.ts';

const VALID_TYPES = [
  'tech_watch',
  'pull_request',
  'code_refactor',
  'bug_fix',
  'code_review',
  'test_run',
  'deploy',
  'documentation',
  'summary_sent',
  'data_analysis',
  'image_gen',
  'video_gen',
  'transcription',
  'prompt_used',
  'backup',
  'notification_sent',
  'task_scheduled',
  'error',
  'other',
] as const;

const VALID_STATUSES = ['success', 'failed', 'partial'] as const;

/**
 * Map a raw database row to a typed EventRow.
 * @param row - The raw libsql Row object.
 * @returns A properly typed EventRow.
 */
const toEventRow = (row: Row): EventRow => ({
  id: row.id as number,
  created_at: row.created_at as string,
  source: row.source as string,
  type: row.type as string,
  status: row.status as string,
  title: row.title as string,
  details: (row.details as string) ?? null,
  artifact_path: (row.artifact_path as string) ?? null,
  important: row.important as number,
});

/**
 * Create the `log` command group.
 * @returns The configured Commander command.
 */
export const createLogCommand = (): Command => {
  const log = new Command('log').description(
    'Manage activity logs',
  );

  log
    .command('add')
    .description('Add an activity log')
    .requiredOption('-t, --type <type>', `Event type (${VALID_TYPES.join(', ')})`)
    .requiredOption('-n, --title <title>', 'Event title')
    .requiredOption('-s, --status <status>', `Status (${VALID_STATUSES.join(', ')})`)
    .option('-d, --details <details>', 'Additional details')
    .option('-f, --file <path>', 'Artifact file to attach')
    .option('--source <source>', 'Source', 'claude-code')
    .option('-i, --important', 'Mark as important', false)
    .action(async (opts: { type: string; title: string; status: string; details?: string; file?: string; source: string; important: boolean }) => {
      if (!(VALID_TYPES as readonly string[]).includes(opts.type)) {
        console.error(`Invalid type: "${opts.type}". Valid types: ${VALID_TYPES.join(', ')}`);
        process.exit(2);
      }
      if (!(VALID_STATUSES as readonly string[]).includes(opts.status)) {
        console.error(`Invalid status: "${opts.status}". Valid statuses: ${VALID_STATUSES.join(', ')}`);
        process.exit(2);
      }

      let artifactPath: string | null = null;
      if (opts.file) {
        if (!existsSync(opts.file)) {
          console.error(`Artifact file not found: ${opts.file}`);
          process.exit(2);
        }
        artifactPath = storeArtifact(opts.file, null);
      }

      const db = await getDb();
      const result = await db.execute({
        sql: `INSERT INTO events (source, type, status, title, details, artifact_path, important)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          opts.source,
          opts.type,
          opts.status,
          opts.title,
          opts.details || null,
          artifactPath,
          opts.important ? 1 : 0,
        ],
      });

      console.error(`Log #${result.lastInsertRowid} added: ${opts.title}`);
    });

  log
    .command('list')
    .description('List logs')
    .option('--today', 'Today only')
    .option('-F, --failed', 'Failed events only')
    .option('-t, --type <type>', 'Filter by type')
    .option('-l, --limit <n>', 'Max results', '50')
    .action(async (opts: { today?: boolean; failed?: boolean; type?: string; limit: string }) => {
      const db = await getDb();
      const conditions: string[] = [];
      const params: string[] = [];

      if (opts.today) {
        conditions.push("date(created_at) = date('now')");
      }
      if (opts.failed) {
        conditions.push("status = 'failed'");
      }
      if (opts.type) {
        conditions.push('type = ?');
        params.push(opts.type);
      }

      const where =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const result = await db.execute({
        sql: `SELECT * FROM events ${where} ORDER BY created_at DESC LIMIT ?`,
        args: [...params, parseInt(opts.limit) || 50],
      });

      if (result.rows.length === 0) {
        console.log('No events found.');
        return;
      }

      for (const row of result.rows) {
        const event = toEventRow(row);
        console.log(`#${event.id} ${formatEvent(event)}`);
      }
    });

  log
    .command('get <id>')
    .description('Show log details')
    .action(async (id: string) => {
      const numId = parseInt(id);
      if (isNaN(numId)) {
        console.error(`Invalid ID: "${id}". Must be a number.`);
        process.exit(2);
      }
      const db = await getDb();
      const result = await db.execute({
        sql: 'SELECT * FROM events WHERE id = ?',
        args: [numId],
      });

      const row = result.rows[0] as Row | undefined;
      if (!row) {
        console.error(`Event #${id} not found.`);
        process.exit(2);
      }

      const event = toEventRow(row);
      console.log(formatEventDetail(event));

      if (event.artifact_path && existsSync(event.artifact_path)) {
        console.log('\n--- Artifact content ---\n');
        console.log(readFileSync(event.artifact_path, 'utf-8'));
      }
    });

  return log;
};
