import { afterEach, describe, expect, it, spyOn } from "bun:test";
import {
	lstatSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readlinkSync,
	realpathSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createAgentCommand } from "../../src/commands/agent.ts";
import { createHookCommand } from "../../src/commands/hook.ts";
import { createMigrateCommand } from "../../src/commands/migrate.ts";
import { createRuleCommand } from "../../src/commands/rule.ts";
import { createSkillCommand } from "../../src/commands/skill.ts";
import { createSyncCommand } from "../../src/commands/sync.ts";

const roots: string[] = [];

const workspace = (): { root: string; projectDir: string; homeDir: string } => {
	const root = mkdtempSync(join(tmpdir(), "cc-hub-agent-sync-cli-"));
	const projectDir = join(root, "project");
	const homeDir = join(root, "home");
	mkdirSync(projectDir, { recursive: true });
	mkdirSync(homeDir, { recursive: true });
	roots.push(root);
	return { root, projectDir: realpathSync(projectDir), homeDir: realpathSync(homeDir) };
};

const writeSkill = (projectDir: string, name = "my-skill"): string => {
	const dir = join(projectDir, name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: ${name} skill\n---\n`);
	return dir;
};

const writeHook = (projectDir: string, name = "workflow-router"): string => {
	const dir = join(projectDir, "hooks", name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "session-start.sh"), "#!/bin/sh\nprintf '%s\\n' '{}'\n");
	return dir;
};

const writeJson = (path: string, value: unknown): void => {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
};

const readJson = (path: string): Record<string, unknown> =>
	JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;

const sessionStartCommands = (config: Record<string, unknown>): readonly string[] => {
	const hooks = config.hooks as Record<string, unknown>;
	const entries = hooks.SessionStart as Array<{ hooks: Array<{ command?: string }> }>;
	return entries.flatMap((entry) =>
		entry.hooks.map((hook) => hook.command).filter((command): command is string => Boolean(command)),
	);
};

const withWorkspace = async <T>(projectDir: string, homeDir: string, fn: () => Promise<T>): Promise<T> => {
	const originalCwd = process.cwd();
	const originalHome = process.env.HOME;
	process.chdir(projectDir);
	process.env.HOME = homeDir;
	try {
		return await fn();
	} finally {
		process.chdir(originalCwd);
		if (originalHome === undefined) {
			delete process.env.HOME;
		} else {
			process.env.HOME = originalHome;
		}
	}
};

const captureLogs = async (fn: () => Promise<void>): Promise<string> => {
	const lines: string[] = [];
	const log = spyOn(console, "log").mockImplementation((line?: unknown) => {
		lines.push(String(line ?? ""));
	});
	try {
		await fn();
	} finally {
		log.mockRestore();
	}
	return lines.join("\n");
};

afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("agent-sync CLI commands", () => {
	it("skill link exposes scope and target options and creates project symlinks", async () => {
		const { projectDir, homeDir } = workspace();
		const skill = writeSkill(projectDir);

		await withWorkspace(projectDir, homeDir, async () => {
			await createSkillCommand().parseAsync(
				["node", "skill", "link", skill, "--scope", "project", "--targets", "all"],
				{
					from: "node",
				},
			);
		});

		expect(readlinkSync(join(projectDir, ".claude", "skills", "my-skill"))).toBe(
			join(projectDir, ".agent-sync", "skills", "my-skill"),
		);
		expect(readlinkSync(join(projectDir, ".agents", "skills", "my-skill"))).toBe(
			join(projectDir, ".agent-sync", "skills", "my-skill"),
		);
		const linkHelp =
			createSkillCommand()
				.commands.find((command) => command.name() === "link")
				?.helpInformation() ?? "";
		expect(linkHelp).toContain("--scope <scope>");
		expect(linkHelp).toContain("--targets <targets>");
	});

	it("skill, agent, and rule commands accept a custom agent-sync root", async () => {
		const { projectDir, homeDir } = workspace();
		const skill = writeSkill(projectDir);
		const rulesDir = join(projectDir, "rules");
		mkdirSync(rulesDir, { recursive: true });
		writeFileSync(join(rulesDir, "api.md"), "# API Rules\n\n- Validate all inputs.\n");

		await withWorkspace(projectDir, homeDir, async () => {
			await createSkillCommand().parseAsync(
				[
					"node",
					"skill",
					"link",
					skill,
					"--scope",
					"project",
					"--targets",
					"all",
					"--agent-sync-root",
					".agent-sync.local",
				],
				{ from: "node" },
			);
			await createAgentCommand().parseAsync(
				["node", "agent", "create", "reviewer", "--scope", "project", "--agent-sync-root", ".agent-sync.local"],
				{ from: "node" },
			);
			await createRuleCommand().parseAsync(
				[
					"node",
					"rule",
					"link",
					"rules/api.md",
					"--scope",
					"project",
					"--targets",
					"all",
					"--agent-sync-root",
					".agent-sync.local",
					"--force",
				],
				{ from: "node" },
			);
		});

		expect(readlinkSync(join(projectDir, ".agents", "skills", "my-skill"))).toBe(
			join(projectDir, ".agent-sync.local", "skills", "my-skill"),
		);
		expect(readlinkSync(join(projectDir, ".codex", "agents", "reviewer.toml"))).toBe(
			join(projectDir, ".agent-sync.local", "agents", "reviewer", "dist", "codex.toml"),
		);
		expect(readlinkSync(join(projectDir, ".claude", "rules", "api.md"))).toBe(
			join(projectDir, ".agent-sync.local", "rules", "api.md"),
		);
		expect(readFileSync(join(projectDir, "AGENTS.md"), "utf-8")).toContain("Validate all inputs.");
		const skillLinkHelp =
			createSkillCommand()
				.commands.find((command) => command.name() === "link")
				?.helpInformation() ?? "";
		const agentLinkHelp =
			createAgentCommand()
				.commands.find((command) => command.name() === "link")
				?.helpInformation() ?? "";
		const ruleBuildHelp =
			createRuleCommand()
				.commands.find((command) => command.name() === "build")
				?.helpInformation() ?? "";
		expect(skillLinkHelp).toContain("--agent-sync-root <dir>");
		expect(agentLinkHelp).toContain("--agent-sync-root <dir>");
		expect(ruleBuildHelp).toContain("--agent-sync-root <dir>");
	});

	it("skill status filters entries by name", async () => {
		const { projectDir, homeDir } = workspace();
		const firstSkill = writeSkill(projectDir, "my-skill");
		const otherSkill = writeSkill(projectDir, "other-skill");

		let output = "";
		await withWorkspace(projectDir, homeDir, async () => {
			await createSkillCommand().parseAsync(
				["node", "skill", "link", firstSkill, "--scope", "project", "--targets", "all"],
				{ from: "node" },
			);
			await createSkillCommand().parseAsync(
				["node", "skill", "link", otherSkill, "--scope", "project", "--targets", "all"],
				{ from: "node" },
			);
			output = await captureLogs(async () => {
				await createSkillCommand().parseAsync(
					["node", "skill", "status", "--scope", "project", "--targets", "all", "--name", "my-skill"],
					{ from: "node" },
				);
			});
		});

		expect(output).toContain("skill\tmy-skill\tproject\tclaude\tOK");
		expect(output).toContain("skill\tmy-skill\tproject\tcodex\tOK");
		expect(output).not.toContain("skill\tother-skill");
	});

	it("agent create, build, link, and status work from command factories", async () => {
		const { projectDir, homeDir } = workspace();

		await withWorkspace(projectDir, homeDir, async () => {
			await createAgentCommand().parseAsync(["node", "agent", "create", "reviewer", "--scope", "project"], {
				from: "node",
			});
			await createAgentCommand().parseAsync(
				["node", "agent", "build", "reviewer", "--scope", "project", "--targets", "all"],
				{
					from: "node",
				},
			);
			await createAgentCommand().parseAsync(
				["node", "agent", "link", "reviewer", "--scope", "project", "--targets", "all"],
				{
					from: "node",
				},
			);
		});

		expect(readFileSync(join(projectDir, ".agent-sync", "agents", "reviewer", "dist", "claude.md"), "utf-8")).toContain(
			"name: reviewer",
		);
		expect(
			readFileSync(join(projectDir, ".agent-sync", "agents", "reviewer", "dist", "codex.toml"), "utf-8"),
		).toContain('name = "reviewer"');
		expect(readlinkSync(join(projectDir, ".claude", "agents", "reviewer.md"))).toBe(
			join(projectDir, ".agent-sync", "agents", "reviewer", "dist", "claude.md"),
		);
		expect(readlinkSync(join(projectDir, ".codex", "agents", "reviewer.toml"))).toBe(
			join(projectDir, ".agent-sync", "agents", "reviewer", "dist", "codex.toml"),
		);

		const output = await withWorkspace(projectDir, homeDir, async () =>
			captureLogs(async () => {
				await createAgentCommand().parseAsync(["node", "agent", "status", "--scope", "project", "--targets", "all"], {
					from: "node",
				});
			}),
		);
		expect(output).toContain("agent\treviewer\tproject\tclaude\tOK");
		expect(output).toContain("agent\treviewer\tproject\tcodex\tOK");
	});

	it("agent create publishes a project-scoped Codex agent when requested", async () => {
		const { projectDir, homeDir } = workspace();

		await withWorkspace(projectDir, homeDir, async () => {
			await createAgentCommand().parseAsync(
				["node", "agent", "create", "local-reviewer", "--scope", "project", "--targets", "codex"],
				{ from: "node" },
			);
		});

		expect(
			readFileSync(join(projectDir, ".agent-sync", "agents", "local-reviewer", "dist", "codex.toml"), "utf-8"),
		).toContain('name = "local-reviewer"');
		expect(readlinkSync(join(projectDir, ".codex", "agents", "local-reviewer.toml"))).toBe(
			join(projectDir, ".agent-sync", "agents", "local-reviewer", "dist", "codex.toml"),
		);
	});

	it("sync run repairs all canonical skills and agents", async () => {
		const { projectDir, homeDir } = workspace();
		const skill = writeSkill(projectDir);

		await withWorkspace(projectDir, homeDir, async () => {
			await createSkillCommand().parseAsync(
				["node", "skill", "link", skill, "--scope", "project", "--targets", "claude"],
				{
					from: "node",
				},
			);
			await createAgentCommand().parseAsync(["node", "agent", "create", "worker", "--scope", "project"], {
				from: "node",
			});
			await createSyncCommand().parseAsync(["node", "sync", "run", "--scope", "project", "--targets", "all"], {
				from: "node",
			});
		});

		expect(readlinkSync(join(projectDir, ".agents", "skills", "my-skill"))).toBe(
			join(projectDir, ".agent-sync", "skills", "my-skill"),
		);
		expect(readlinkSync(join(projectDir, ".codex", "agents", "worker.toml"))).toBe(
			join(projectDir, ".agent-sync", "agents", "worker", "dist", "codex.toml"),
		);
	});

	it("sync run includes canonical rules", async () => {
		const { projectDir, homeDir } = workspace();
		const rulePath = join(projectDir, ".agent-sync", "rules", "api.md");
		mkdirSync(join(rulePath, ".."), { recursive: true });
		writeFileSync(rulePath, "# API Rules\n\n- Validate payloads.\n");

		await withWorkspace(projectDir, homeDir, async () => {
			await createSyncCommand().parseAsync(["node", "sync", "run", "--scope", "project", "--targets", "all"], {
				from: "node",
			});
		});

		expect(lstatSync(join(projectDir, ".claude", "rules", "api.md")).isSymbolicLink()).toBe(true);
		expect(readlinkSync(join(projectDir, ".claude", "rules", "api.md"))).toBe(rulePath);
		expect(readFileSync(join(projectDir, ".claude", "rules", "api.md"), "utf-8")).toContain("Validate payloads.");
		expect(readFileSync(join(projectDir, "AGENTS.md"), "utf-8")).toContain("Validate payloads.");
	});

	it("hook link and sync run publish SessionStart provider configs", async () => {
		const { projectDir, homeDir } = workspace();
		const hook = writeHook(projectDir);
		writeJson(join(homeDir, ".claude", "settings.json"), {
			hooks: {
				PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "existing-claude-pre" }] }],
				Stop: [{ matcher: "", hooks: [{ type: "command", command: "existing-claude-stop" }] }],
				SessionStart: [{ matcher: "", hooks: [{ type: "command", command: "existing-claude-session" }] }],
			},
		});
		writeJson(join(homeDir, ".codex", "hooks.json"), {
			hooks: {
				PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "existing-codex-pre" }] }],
				Stop: [{ matcher: "", hooks: [{ type: "command", command: "existing-codex-stop" }] }],
				SessionStart: [{ matcher: "", hooks: [{ type: "command", command: "existing-codex-session" }] }],
			},
		});

		await withWorkspace(projectDir, homeDir, async () => {
			const hookCommand = createHookCommand();
			hookCommand.commands.find((command) => command.name() === "link")?.setOptionValue("homeDir", homeDir);
			await hookCommand.parseAsync(["node", "hook", "link", hook, "--scope", "project", "--targets", "claude"], {
				from: "node",
			});
			const syncCommand = createSyncCommand();
			syncCommand.commands.find((command) => command.name() === "run")?.setOptionValue("homeDir", homeDir);
			await syncCommand.parseAsync(["node", "sync", "run", "--scope", "project", "--targets", "all"], {
				from: "node",
			});
			await syncCommand.parseAsync(["node", "sync", "run", "--scope", "project", "--targets", "all"], {
				from: "node",
			});
		});

		expect(readlinkSync(join(projectDir, ".agent-sync", "hooks", "workflow-router"))).toBe(hook);
		const expectedCommand = `bash '${join(projectDir, ".agent-sync", "hooks", "workflow-router", "session-start.sh")}'`;
		const claudeConfig = readJson(join(homeDir, ".claude", "settings.json"));
		const codexConfig = readJson(join(homeDir, ".codex", "hooks.json"));
		expect(JSON.stringify(claudeConfig)).toContain("existing-claude-pre");
		expect(JSON.stringify(claudeConfig)).toContain("existing-claude-stop");
		expect(JSON.stringify(codexConfig)).toContain("existing-codex-pre");
		expect(JSON.stringify(codexConfig)).toContain("existing-codex-stop");
		expect(sessionStartCommands(claudeConfig).filter((command) => command === expectedCommand)).toHaveLength(1);
		expect(sessionStartCommands(codexConfig).filter((command) => command === expectedCommand)).toHaveLength(1);
		expect(sessionStartCommands(claudeConfig)).toContain("existing-claude-session");
		expect(sessionStartCommands(codexConfig)).toContain("existing-codex-session");
		const commandHelp = createHookCommand().helpInformation();
		expect(commandHelp).toContain("link");
		expect(commandHelp).toContain("repair");
	});

	it("migrate imports a Claude command as a project skill", async () => {
		const { projectDir, homeDir } = workspace();
		const commandsDir = join(projectDir, ".claude", "commands");
		mkdirSync(commandsDir, { recursive: true });
		writeFileSync(join(commandsDir, "audit.md"), "Audit this patch for defects.\n");

		const output = await withWorkspace(projectDir, homeDir, async () =>
			captureLogs(async () => {
				await createMigrateCommand().parseAsync(
					[
						"node",
						"migrate",
						"command",
						".claude/commands/audit.md",
						"--scope",
						"project",
						"--targets",
						"all",
						"--force",
					],
					{ from: "node" },
				);
			}),
		);

		expect(output).toContain("skill\taudit\tcommand\tMIGRATED");
		expect(readFileSync(join(projectDir, ".agent-sync", "skills", "audit", "SKILL.md"), "utf-8")).toContain(
			"Audit this patch for defects.",
		);
		expect(readlinkSync(join(projectDir, ".agents", "skills", "audit"))).toBe(
			join(projectDir, ".agent-sync", "skills", "audit"),
		);
		const help = createMigrateCommand().helpInformation();
		expect(help).toContain("--from <provider>");
		expect(help).toContain("--dry-run");
	});

	it("migrate command accepts a custom output root", async () => {
		const { projectDir, homeDir } = workspace();
		const commandsDir = join(projectDir, ".claude", "commands");
		mkdirSync(commandsDir, { recursive: true });
		writeFileSync(join(commandsDir, "collection.md"), "Run collection checks.\n");

		const output = await withWorkspace(projectDir, homeDir, async () =>
			captureLogs(async () => {
				await createMigrateCommand().parseAsync(
					[
						"node",
						"migrate",
						"command",
						".claude/commands/collection.md",
						"--output",
						"Project/.agent-sync",
						"--scope",
						"project",
						"--targets",
						"all",
						"--force",
					],
					{ from: "node" },
				);
			}),
		);

		expect(output).toContain("skill\tcollection\tcommand\tMIGRATED");
		expect(
			readFileSync(join(projectDir, "Project", ".agent-sync", "skills", "collection", "SKILL.md"), "utf-8"),
		).toContain("Run collection checks.");
		expect(readlinkSync(join(projectDir, ".agents", "skills", "collection"))).toBe(
			join(projectDir, "Project", ".agent-sync", "skills", "collection"),
		);
		expect(createMigrateCommand().helpInformation()).toContain("--output <dir>");
	});

	it("migrate can print JSON output", async () => {
		const { projectDir, homeDir } = workspace();
		const commandsDir = join(projectDir, ".claude", "commands");
		mkdirSync(commandsDir, { recursive: true });
		writeFileSync(join(commandsDir, "json-audit.md"), "Audit this patch for defects.\n");

		const output = await withWorkspace(projectDir, homeDir, async () =>
			captureLogs(async () => {
				await createMigrateCommand().parseAsync(
					[
						"node",
						"migrate",
						"command",
						".claude/commands/json-audit.md",
						"--scope",
						"project",
						"--targets",
						"claude",
						"--force",
						"--json",
					],
					{ from: "node" },
				);
			}),
		);

		const parsed = JSON.parse(output) as Array<{ kind: string; name: string; status: string }>;
		expect(parsed[0]).toMatchObject({ kind: "skill", name: "json-audit", status: "MIGRATED" });
	});

	it("rule link supports scoped portable rules and rebuilds provider outputs", async () => {
		const { projectDir, homeDir } = workspace();
		const rulesDir = join(projectDir, "rules");
		mkdirSync(rulesDir, { recursive: true });
		writeFileSync(join(rulesDir, "api.md"), "# API Rules\n\n- Validate all inputs.\n");

		await withWorkspace(projectDir, homeDir, async () => {
			await createRuleCommand().parseAsync(
				["node", "rule", "link", "rules/api.md", "--scope", "project", "--targets", "all", "--force"],
				{ from: "node" },
			);
		});

		expect(readlinkSync(join(projectDir, ".agent-sync", "rules", "api.md"))).toBe(join(projectDir, "rules", "api.md"));
		expect(lstatSync(join(projectDir, ".claude", "rules", "api.md")).isSymbolicLink()).toBe(true);
		expect(readlinkSync(join(projectDir, ".claude", "rules", "api.md"))).toBe(
			join(projectDir, ".agent-sync", "rules", "api.md"),
		);
		expect(readFileSync(join(projectDir, ".claude", "rules", "api.md"), "utf-8")).toContain("Validate all inputs.");
		expect(readFileSync(join(projectDir, "AGENTS.md"), "utf-8")).toContain("Validate all inputs.");
		const commandHelp = createRuleCommand().helpInformation();
		const linkHelp =
			createRuleCommand()
				.commands.find((command) => command.name() === "link")
				?.helpInformation() ?? "";
		expect(commandHelp).toContain("build");
		expect(linkHelp).toContain("--scope <scope>");
	});

	it("migrate rules imports Claude rules through the CLI", async () => {
		const { projectDir, homeDir } = workspace();
		const rulesDir = join(projectDir, ".claude", "rules");
		mkdirSync(rulesDir, { recursive: true });
		writeFileSync(join(rulesDir, "testing.md"), "# Testing Rules\n\n- Run behavior tests.\n");

		const output = await withWorkspace(projectDir, homeDir, async () =>
			captureLogs(async () => {
				await createMigrateCommand().parseAsync(
					["node", "migrate", "rules", ".claude/rules", "--scope", "project", "--targets", "all", "--force"],
					{ from: "node" },
				);
			}),
		);

		expect(output).toContain("rule\ttesting\trule\tMIGRATED");
		expect(readFileSync(join(projectDir, ".agent-sync", "rules", "testing.md"), "utf-8")).toContain(
			"Run behavior tests.",
		);
		expect(readFileSync(join(projectDir, "AGENTS.md"), "utf-8")).toContain("Run behavior tests.");
	});
});
