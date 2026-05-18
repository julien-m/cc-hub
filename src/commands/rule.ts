/** Rule command for portable Claude and Codex rule outputs via agent-sync. */

import { Command } from "commander";
import {
	buildRules,
	linkRule,
	listRules,
	type RuleSyncEntry,
	type RuleSyncOptions,
	repairRules,
	statusRules,
	unlinkRule,
} from "../services/agent-sync-rules.ts";

const addRuleOptions = (command: Command, defaults: { scope: string; targets: string }): Command =>
	command
		.option("--scope <scope>", "Sync scope: project, global, or all", defaults.scope)
		.option("--targets <targets>", "Provider targets: claude, codex, or all", defaults.targets)
		.option("-n, --name <name>", "Custom canonical rule name")
		.option("--namespace <namespace>", "Namespace for global rule links")
		.option("--force", "Replace existing canonical/provider paths when required")
		.option("--json", "Print JSON output");

const optionsOf = (command: Command): RuleSyncOptions => command.opts<RuleSyncOptions>();

const formatRuleEntries = (entries: readonly RuleSyncEntry[]): string =>
	entries
		.map((entry) => {
			const detail = entry.detail ? `\t${entry.detail}` : "";
			return `${entry.kind}\t${entry.name}\t${entry.scope}\t${entry.provider}\t${entry.status}\t${entry.providerPath} -> ${entry.targetPath}${detail}`;
		})
		.join("\n");

const printResult = (result: readonly RuleSyncEntry[] | readonly string[], options: RuleSyncOptions): void => {
	if (options.json) {
		console.log(JSON.stringify(result, null, 2));
		return;
	}
	if (result.length === 0) {
		console.log("No rules found.");
		return;
	}
	const first = result[0];
	console.log(
		typeof first === "string"
			? (result as readonly string[]).join("\n")
			: formatRuleEntries(result as readonly RuleSyncEntry[]),
	);
};

/**
 * Create the `rule` command group.
 * @returns The configured Commander command.
 */
export const createRuleCommand = (): Command => {
	const rule = new Command("rule").description("Manage portable Claude/Codex rules via agent-sync");

	const link = addRuleOptions(
		rule
			.command("link")
			.description("Link one rule into canonical agent-sync rules")
			.argument("<path>", "Rule file path"),
		{ scope: "global", targets: "claude" },
	);
	link.action((path: string) => {
		const options = optionsOf(link);
		printResult(linkRule(path, options), options);
	});

	const build = addRuleOptions(rule.command("build").description("Build generated provider rule outputs"), {
		scope: "global",
		targets: "all",
	});
	build.action(() => {
		const options = optionsOf(build);
		printResult(buildRules(options), options);
	});

	const list = addRuleOptions(rule.command("list").description("List canonical rules"), {
		scope: "global",
		targets: "all",
	});
	list.action(() => {
		const options = optionsOf(list);
		printResult(listRules(options), options);
	});

	const status = addRuleOptions(rule.command("status").description("Show generated rule output status"), {
		scope: "all",
		targets: "all",
	});
	status.action(() => {
		const options = optionsOf(status);
		printResult(statusRules(options), options);
	});

	const repair = addRuleOptions(rule.command("repair").description("Repair generated rule outputs"), {
		scope: "all",
		targets: "all",
	});
	repair.option("--dry-run", "Show repair status without writing");
	repair.action(() => {
		const options = optionsOf(repair);
		printResult(repairRules(options), options);
	});

	const unlink = addRuleOptions(
		rule
			.command("unlink")
			.description("Remove one canonical rule and generated outputs")
			.argument("<name>", "Rule name"),
		{ scope: "global", targets: "all" },
	);
	unlink.action((name: string) => {
		const options = optionsOf(unlink);
		printResult(unlinkRule(name, options), options);
	});

	return rule;
};
