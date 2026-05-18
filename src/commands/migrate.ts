/** Migrate provider folders and artifacts into agent-sync. */

import { Command } from "commander";
import {
	formatMigrationResults,
	type MigrateOptions,
	type MigrationResult,
	migrateAgent,
	migrateCommand,
	migratePath,
	migrateSkill,
} from "../services/agent-sync-migrate.ts";

const addOptions = (command: Command): Command =>
	command
		.option("--from <provider>", "Source provider: claude or codex")
		.option("--scope <scope>", "Sync scope: project, global, or all", "project")
		.option("--targets <targets>", "Provider targets: claude, codex, or all", "all")
		.option("-n, --name <name>", "Custom canonical name")
		.option("--force", "Replace existing canonical/provider paths when required")
		.option("--dry-run", "Report migration actions without writing")
		.option("--json", "Print JSON output");

const optionsOf = (command: Command): MigrateOptions => ({
	...(command.parent?.opts<MigrateOptions>() ?? {}),
	...command.opts<MigrateOptions>(),
});

const printResults = (results: MigrationResult | readonly MigrationResult[], options: MigrateOptions): void => {
	const list = Array.isArray(results) ? results : [results];
	if (options.json) {
		console.log(JSON.stringify(list, null, 2));
		return;
	}
	console.log(formatMigrationResults(list));
};

const run = (fn: () => MigrationResult | readonly MigrationResult[], options: MigrateOptions): void => {
	try {
		printResults(fn(), options);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Failed to migrate: ${message}`);
		process.exit(1);
	}
};

/**
 * Create the `migrate` command group.
 * @returns The configured Commander command.
 */
export const createMigrateCommand = (): Command => {
	// @spec FR-001: Folder migrate command — .specs/features/003-migrate-provider-folders-to-agent-sync/spec.md#fr-001
	const migrate = addOptions(
		new Command("migrate")
			.description("Migrate Claude/Codex folders or artifacts into agent-sync")
			.argument("[path]", "Provider folder to migrate"),
	);
	migrate.action((path?: string) => {
		const options = optionsOf(migrate);
		if (!path) {
			migrate.help({ error: true });
			return;
		}
		run(() => migratePath(path, options), options);
	});

	const skill = addOptions(
		migrate.command("skill").description("Migrate one provider skill").argument("<path>", "Skill path"),
	);
	skill.action((path: string) => {
		const options = optionsOf(skill);
		run(() => migrateSkill(path, options), options);
	});

	const agent = addOptions(
		migrate.command("agent").description("Migrate one provider agent").argument("<path>", "Agent path"),
	);
	agent.action((path: string) => {
		const options = optionsOf(agent);
		run(() => migrateAgent(path, options), options);
	});

	const command = addOptions(
		migrate
			.command("command")
			.description("Migrate one Claude command as an agent-sync skill")
			.argument("<path>", "Command path"),
	);
	command.action((path: string) => {
		const options = optionsOf(command);
		run(() => migrateCommand(path, options), options);
	});

	return migrate;
};
