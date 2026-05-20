/** Agent command for portable Claude and Codex agent sources. */

import { Command } from "commander";
import {
	buildAgent,
	createAgentSource,
	formatEntries,
	linkAgent,
	listCanonical,
	repairAgents,
	type SyncOptions,
	statusAgents,
	unlinkArtifact,
} from "../services/agent-sync.ts";

const addSyncOptions = (command: Command, defaults: { scope: string; targets: string }): Command =>
	command
		.option("--scope <scope>", "Sync scope: project, global, or all", defaults.scope)
		.option("--targets <targets>", "Provider targets: claude, codex, or all", defaults.targets)
		.option("--agent-sync-root <dir>", "Custom canonical agent-sync root")
		.option("--force", "Replace existing files when safe")
		.option("--json", "Print JSON output");

const optionsOf = (command: Command): SyncOptions => command.opts<SyncOptions>();

const printResult = (result: unknown, options: SyncOptions): void => {
	if (options.json) {
		console.log(JSON.stringify(result, null, 2));
		return;
	}
	if (Array.isArray(result) && typeof result[0] === "object") {
		console.log(formatEntries(result));
		return;
	}
	if (Array.isArray(result)) {
		console.log(result.length === 0 ? "No agents found." : result.join("\n"));
		return;
	}
	console.log(String(result));
};

/**
 * Create the `agent` command group.
 * @returns The configured Commander command.
 */
export const createAgentCommand = (): Command => {
	const agent = new Command("agent").description("Manage portable Claude/Codex agents via agent-sync");

	const create = addSyncOptions(
		agent
			.command("create")
			.description("Create a portable agent source and publish selected provider files")
			.argument("<name>", "Agent name"),
		{ scope: "project", targets: "all" },
	);
	create.action((name: string) => {
		const options = optionsOf(create);
		const sourcePath = createAgentSource(name, options);
		const entries = linkAgent(name, options);
		if (options.json) {
			console.log(JSON.stringify({ sourcePath, entries }, null, 2));
			return;
		}
		console.log(sourcePath);
		console.log(formatEntries(entries));
	});

	const build = addSyncOptions(
		agent.command("build").description("Render provider-native agent files").argument("<name>", "Agent name"),
		{ scope: "project", targets: "all" },
	);
	build.action((name: string) => {
		const options = optionsOf(build);
		printResult(buildAgent(name, options), options);
	});

	const link = addSyncOptions(
		agent.command("link").description("Link generated agent files to providers").argument("<name>", "Agent name"),
		{ scope: "global", targets: "claude" },
	);
	link.action((name: string) => {
		const options = optionsOf(link);
		printResult(linkAgent(name, options), options);
	});

	const list = addSyncOptions(agent.command("list").description("List canonical agents"), {
		scope: "global",
		targets: "claude",
	});
	list.action(() => {
		const options = optionsOf(list);
		printResult(listCanonical("agent", options), options);
	});

	const status = addSyncOptions(agent.command("status").description("Show agent symlink status"), {
		scope: "all",
		targets: "all",
	});
	status.action(() => {
		const options = optionsOf(status);
		printResult(statusAgents(options), options);
	});

	const repair = addSyncOptions(agent.command("repair").description("Repair missing or broken agent symlinks"), {
		scope: "all",
		targets: "all",
	});
	repair.option("--dry-run", "Show repair actions without writing");
	repair.action(() => {
		const options = optionsOf(repair);
		printResult(repairAgents(options), options);
	});

	const unlink = addSyncOptions(
		agent.command("unlink").description("Remove provider agent symlinks").argument("<name>", "Agent name"),
		{ scope: "global", targets: "claude" },
	);
	unlink.action((name: string) => {
		const options = optionsOf(unlink);
		printResult(unlinkArtifact("agent", name, options), options);
	});

	return agent;
};
