import { existsSync, readFileSync } from 'node:fs';
import { Command } from 'commander';
import { type Row } from '@libsql/client';
import { getDb } from '../db/index.ts';
import { storeArtifact } from '../services/artifacts.ts';
import { formatEvent, formatEventDetail, type EventRow } from '../utils/format.ts';

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

export function createLogCommand(): Command {
  const log = new Command('log').description(
    "Gérer les logs d'activité",
  );

  log
    .command('add')
    .description("Ajouter un log d'activité")
    .requiredOption('--type <type>', `Type d'événement (${VALID_TYPES.join(', ')})`)
    .requiredOption('--title <title>', "Titre de l'événement")
    .requiredOption('--status <status>', `Statut (${VALID_STATUSES.join(', ')})`)
    .option('--details <details>', 'Détails supplémentaires')
    .option('--file <path>', 'Fichier artifact à joindre')
    .option('--source <source>', 'Source', 'claude-code')
    .option('--important', 'Marquer comme important', false)
    .action(async (opts: { type: string; title: string; status: string; details?: string; file?: string; source: string; important: boolean }) => {
      if (!(VALID_TYPES as readonly string[]).includes(opts.type)) {
        console.error(`Type invalide: ${opts.type}`);
        console.error(`Types valides: ${VALID_TYPES.join(', ')}`);
        process.exit(1);
      }
      if (!(VALID_STATUSES as readonly string[]).includes(opts.status)) {
        console.error(`Statut invalide: ${opts.status}`);
        console.error(`Statuts valides: ${VALID_STATUSES.join(', ')}`);
        process.exit(1);
      }

      let artifactPath: string | null = null;
      if (opts.file) {
        if (!existsSync(opts.file)) {
          console.error(`Fichier introuvable: ${opts.file}`);
          process.exit(1);
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

      console.error(`✅ Log #${result.lastInsertRowid} ajouté: ${opts.title}`);
    });

  log
    .command('list')
    .description('Lister les logs')
    .option('--today', "Événements d'aujourd'hui uniquement")
    .option('--failed', 'Événements en échec uniquement')
    .option('--type <type>', 'Filtrer par type')
    .option('--limit <n>', 'Nombre max de résultats', '50')
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
        console.log('Aucun événement trouvé.');
        return;
      }

      for (const event of result.rows) {
        console.log(`#${event.id} ${formatEvent(event as unknown as EventRow)}`);
      }
    });

  log
    .command('get <id>')
    .description("Détail d'un log")
    .action(async (id: string) => {
      const numId = parseInt(id);
      if (isNaN(numId)) {
        console.error(`ID invalide: ${id}`);
        process.exit(1);
      }
      const db = await getDb();
      const result = await db.execute({
        sql: 'SELECT * FROM events WHERE id = ?',
        args: [numId],
      });

      const event = result.rows[0] as Row | undefined;
      if (!event) {
        console.error(`Événement #${id} introuvable.`);
        process.exit(2);
      }

      console.log(formatEventDetail(event as unknown as EventRow));

      if (event.artifact_path && existsSync(String(event.artifact_path))) {
        console.log('\n--- Contenu artifact ---\n');
        console.log(readFileSync(String(event.artifact_path), 'utf-8'));
      }
    });

  return log;
}
