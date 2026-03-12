import { createClient, type Client, type Config } from '@libsql/client';
import { DB_PATH, ensureDirs } from '../utils/paths.ts';
import { tryGetCred } from '../services/creds.ts';

let client: Client | undefined;
let tursoEnabled = false;

export async function getDb(): Promise<Client> {
  if (client) return client;

  ensureDirs();

  const tursoUrl = tryGetCred('TURSO_DATABASE_URL');
  const tursoToken = tryGetCred('TURSO_AUTH_TOKEN');

  const config: Config = { url: `file:${DB_PATH}` };

  if (tursoUrl && tursoToken) {
    config.syncUrl = tursoUrl;
    config.authToken = tursoToken;
    tursoEnabled = true;
  }

  client = createClient(config);

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS events (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      source        TEXT DEFAULT 'claude-code',
      type          TEXT NOT NULL,
      status        TEXT NOT NULL,
      title         TEXT NOT NULL,
      details       TEXT,
      artifact_path TEXT,
      important     BOOLEAN DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS digests (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      period_start DATETIME,
      period_end   DATETIME,
      content      TEXT,
      sent_to      TEXT
    );
  `);

  if (tursoEnabled) {
    await client.sync();
  }

  return client;
}

export async function syncDb(): Promise<boolean> {
  const db = await getDb();
  if (!tursoEnabled) {
    return false;
  }
  await db.sync();
  return true;
}

export function isTursoEnabled(): boolean {
  return tursoEnabled;
}
