/** Command handler for agent-sync plus legacy Turso database synchronization. */

import { Command } from "commander";
import { getDb, isTursoEnabled, syncDb } from "../db/index.ts";
import { exitCode } from "../errors.ts";
import {
	cleanAll,
	formatEntries,
	repairAll,
	runSync,
	type SyncEntry,
	type SyncOptions,
	statusAll,
} from "../services/agent-sync.ts";

const addSyncOptions = (command: Command): Command =>
	command
		.option("--scope <scope>", "Sync scope: project, global, or all", "all")
		.option("--targets <targets>", "Provider targets: claude, codex, or all", "all")
		.option("--force", "Replace existing non-symlink provider paths")
		.option("--json", "Print JSON output");

const printEntries = (entries: readonly SyncEntry[], options: SyncOptions): void => {
	if (options.json) {
		console.log(JSON.stringify(entries, null, 2));
		return;
	}
	console.log(formatEntries(entries));
};

const runDatabaseSync = async (): Promise<void> => {
	try {
		const synced = await syncDb();
		if (synced) {
			console.error("Turso sync complete");
		} else {
			console.error("Turso not configured - local-only mode");
			console.error("   Set credentials with:");
			console.error("     creds set TURSO_DATABASE_URL");
			console.error("     creds set TURSO_AUTH_TOKEN");
		}
	} catch (err) {
		console.error(`Sync failed: ${(err as Error).message}. Verify TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.`);
		process.exit(exitCode(err, 4));
	}
};

/**
 * Create the `sync` command group.
 * @returns The configured Commander command.
 */
export const createSyncCommand = (): Command => {
	const sync = new Command("sync").description("Synchronize agent assets and inspect database sync");

	const run = addSyncOptions(sync.command("run").description("Synchronize agent-sync skills and agents"));
	run.action(() => {
		const options = run.opts<SyncOptions>();
		printEntries(runSync(options), options);
	});

	const status = addSyncOptions(sync.command("status").description("Show agent-sync status"));
	status.action(() => {
		const options = status.opts<SyncOptions>();
		printEntries(statusAll(options), options);
	});

	const repair = addSyncOptions(sync.command("repair").description("Repair missing or broken agent-sync symlinks"));
	repair.option("--dry-run", "Show repair actions without writing");
	repair.action(() => {
		const options = repair.opts<SyncOptions>();
		printEntries(repairAll(options), options);
	});

	const clean = addSyncOptions(sync.command("clean").description("Remove broken agent-sync symlinks"));
	clean.option("--dry-run", "Show clean actions without writing");
	clean.action(() => {
		const options = clean.opts<SyncOptions>();
		printEntries(cleanAll(options), options);
	});

	sync.command("db").description("Run legacy Turso database synchronization").action(runDatabaseSync);

	sync
		.command("db-status")
		.description("Show legacy Turso database synchronization status")
		.action(async () => {
			await getDb();
			if (isTursoEnabled()) {
				console.log("Turso Cloud enabled - sync available");
			} else {
				console.log("Local-only mode (Turso not configured)");
			}
		});

	return sync;
};
