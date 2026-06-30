/** Hook command for portable Claude and Codex SessionStart hooks via agent-sync. */

import { Command } from "commander";
import type { SyncOptions } from "../services/agent-sync.ts";
import {
	formatHookEntries,
	type HookSyncEntry,
	linkHook,
	listHooks,
	repairHooks,
	statusHooks,
	unlinkHook,
} from "../services/agent-sync-hooks.ts";

const addHookOptions = (command: Command, defaults: { scope: string; targets: string }): Command =>
	command
		.option("--scope <scope>", "Sync scope: project, global, or all", defaults.scope)
		.option("--targets <targets>", "Provider targets: claude, codex, or all", defaults.targets)
		.option("--agent-sync-root <dir>", "Custom canonical agent-sync root")
		.option("-n, --name <name>", "Custom canonical hook name")
		.option("--force", "Replace existing canonical hook symlink")
		.option("--json", "Print JSON output");

const optionsOf = (command: Command): SyncOptions => command.opts<SyncOptions>();

const printResult = (result: readonly HookSyncEntry[] | readonly string[], options: SyncOptions): void => {
	if (options.json) {
		console.log(JSON.stringify(result, null, 2));
		return;
	}
	if (result.length === 0) {
		console.log("No hooks found.");
		return;
	}
	const first = result[0];
	console.log(
		typeof first === "string"
			? (result as readonly string[]).join("\n")
			: formatHookEntries(result as readonly HookSyncEntry[]),
	);
};

/**
 * Create the `hook` command group.
 * @returns The configured Commander command.
 */
export const createHookCommand = (): Command => {
	const hook = new Command("hook").description("Manage portable Claude/Codex SessionStart hooks via agent-sync");

	const link = addHookOptions(
		hook
			.command("link")
			.description("Link a SessionStart hook source and merge provider configs")
			.argument("<path>", "Hook source directory or script path"),
		{ scope: "global", targets: "all" },
	);
	link.action((path: string) => {
		const options = optionsOf(link);
		printResult(linkHook(path, options), options);
	});

	const list = addHookOptions(hook.command("list").description("List canonical hooks"), {
		scope: "global",
		targets: "all",
	});
	list.action(() => {
		const options = optionsOf(list);
		printResult(listHooks(options), options);
	});

	const status = addHookOptions(hook.command("status").description("Show provider hook config status"), {
		scope: "all",
		targets: "all",
	});
	status.action(() => {
		const options = optionsOf(status);
		printResult(statusHooks(options), options);
	});

	const repair = addHookOptions(hook.command("repair").description("Repair missing provider hook config entries"), {
		scope: "all",
		targets: "all",
	});
	repair.option("--dry-run", "Show repair status without writing");
	repair.action(() => {
		const options = optionsOf(repair);
		printResult(repairHooks(options), options);
	});

	const unlink = addHookOptions(
		hook
			.command("unlink")
			.description("Remove one managed hook command from provider configs")
			.argument("<name>", "Hook name"),
		{ scope: "global", targets: "all" },
	);
	unlink.action((name: string) => {
		const options = optionsOf(unlink);
		printResult(unlinkHook(name, options), options);
	});

	return hook;
};
