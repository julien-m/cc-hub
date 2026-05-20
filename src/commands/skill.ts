/** Skill command for portable Claude and Codex skill symlinks. */

import { Command } from "commander";
import {
	formatEntries,
	linkSkill,
	listCanonical,
	repairSkills,
	type SyncOptions,
	statusSkills,
	unlinkArtifact,
} from "../services/agent-sync.ts";

const addSyncOptions = (command: Command, defaults: { scope: string; targets: string }): Command =>
	command
		.option("--scope <scope>", "Sync scope: project, global, or all", defaults.scope)
		.option("--targets <targets>", "Provider targets: claude, codex, or all", defaults.targets)
		.option("--agent-sync-root <dir>", "Custom canonical agent-sync root")
		.option("-n, --name <name>", "Custom canonical skill name")
		.option("--force", "Replace existing non-symlink provider paths")
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
		console.log(result.length === 0 ? "No skills found." : result.join("\n"));
	}
};

/**
 * Create the `skill` command group.
 * @returns The configured Commander command.
 */
export const createSkillCommand = (): Command => {
	const skill = new Command("skill").description("Manage portable Claude/Codex skills via agent-sync");

	const link = addSyncOptions(
		skill.command("link").description("Install a skill via symlinks").argument("<path>", "Path or name of the skill"),
		{ scope: "global", targets: "claude" },
	);
	link.action((path: string) => {
		const options = optionsOf(link);
		printResult(linkSkill(path, options), options);
	});

	const list = addSyncOptions(skill.command("list").description("List canonical skills"), {
		scope: "global",
		targets: "claude",
	});
	list.action(() => {
		const options = optionsOf(list);
		printResult(listCanonical("skill", options), options);
	});

	const status = addSyncOptions(skill.command("status").description("Show skill symlink status"), {
		scope: "all",
		targets: "all",
	});
	status.action(() => {
		const options = optionsOf(status);
		printResult(statusSkills(options), options);
	});

	const repair = addSyncOptions(skill.command("repair").description("Repair missing or broken skill symlinks"), {
		scope: "all",
		targets: "all",
	});
	repair.option("--dry-run", "Show repair actions without writing");
	repair.action(() => {
		const options = optionsOf(repair);
		printResult(repairSkills(options), options);
	});

	const unlink = addSyncOptions(
		skill.command("unlink").description("Remove provider skill symlinks").argument("<name>", "Skill name"),
		{ scope: "global", targets: "claude" },
	);
	unlink.action((name: string) => {
		const options = optionsOf(unlink);
		printResult(unlinkArtifact("skill", name, options), options);
	});

	return skill;
};
