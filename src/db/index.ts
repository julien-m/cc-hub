import { createClient, type Client, type Config } from '@libsql/client';
import { DB_PATH, ensureDirs } from '../infra/paths.ts';
import { tryGetCred } from '../services/creds.ts';

let client: Client | undefined;
let _tursoConfigured = false;

/**
 * Returns a singleton libSQL client, creating it on first call.
 * Initializes the database schema and syncs with Turso if configured.
 * @returns The libSQL client instance.
 * @throws If the database client creation or schema initialization fails.
 */
export const getDb = async (): Promise<Client> => {
  if (client) return client;

  ensureDirs();

  const tursoUrl = tryGetCred('TURSO_DATABASE_URL');
  const tursoToken = tryGetCred('TURSO_AUTH_TOKEN');

  const config: Config = { url: `file:${DB_PATH}` };

  if (tursoUrl && tursoToken) {
    config.syncUrl = tursoUrl;
    config.authToken = tursoToken;
    _tursoConfigured = true;
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

  if (_tursoConfigured) {
    await client.sync();
  }

  return client;
};

/**
 * Syncs the local database with Turso remote.
 * No-op if Turso is not configured.
 * @returns True if sync was performed, false if Turso is not enabled.
 * @throws If the database sync operation fails.
 */
export const syncDb = async (): Promise<boolean> => {
  const db = await getDb();
  if (!_tursoConfigured) {
    return false;
  }
  await db.sync();
  return true;
};

/**
 * Checks whether Turso remote sync is configured.
 * @returns True if Turso credentials were found during initialization.
 */
export const isTursoEnabled = (): boolean => {
  return _tursoConfigured;
};
