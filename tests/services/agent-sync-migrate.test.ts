import { afterEach, describe, expect, it } from "bun:test";
import {
	existsSync,
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
import { join } from "node:path";
import type { MigrationResult } from "../../src/services/agent-sync-migrate.ts";
import {
	migrateAgent,
	migrateCommand,
	migratePath,
	migrateRule,
	migrateRules,
} from "../../src/services/agent-sync-migrate.ts";

const roots: string[] = [];

const workspace = (): { projectDir: string; homeDir: string } => {
	const root = mkdtempSync(join(tmpdir(), "cc-hub-migrate-"));
	roots.push(root);
	const projectDir = join(root, "project");
	const homeDir = join(root, "home");
	mkdirSync(projectDir, { recursive: true });
	mkdirSync(homeDir, { recursive: true });
	return { projectDir: realpathSync(projectDir), homeDir: realpathSync(homeDir) };
};

const writeClaudeSkill = (projectDir: string, name: string): void => {
	const dir = join(projectDir, ".claude", "skills", name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: ${name} skill\n---\n\n# ${name}\n`);
};

const writeClaudeAgent = (projectDir: string, name: string): void => {
	const dir = join(projectDir, ".claude", "agents");
	mkdirSync(dir, { recursive: true });
	writeFileSync(
		join(dir, `${name}.md`),
		`---\nname: ${name}\ndescription: Reviews changes\nmodel: inherit\ntools:\n  - Read\nskills:\n  - cc-hub\n---\n\nReview the current change set.\n`,
	);
};

const writeClaudeCommand = (projectDir: string, name: string): void => {
	const dir = join(projectDir, ".claude", "commands");
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, `${name}.md`), "Run a focused code review and report risks.\n");
};

const writeClaudeRule = (projectDir: string, name: string): void => {
	const dir = join(projectDir, ".claude", "rules");
	mkdirSync(dir, { recursive: true });
	writeFileSync(
		join(dir, `${name}.md`),
		`---\npaths:\n  - "src/${name}/**/*.ts"\n---\n\n# ${name} Rules\n\n- Keep ${name} behavior portable.\n`,
	);
};

const writeCodexAgent = (projectDir: string, name: string): void => {
	const dir = join(projectDir, ".codex", "agents");
	mkdirSync(dir, { recursive: true });
	writeFileSync(
		join(dir, `${name}.toml`),
		`name = "${name}"\ndescription = "Reviews code"\nmodel = "gpt-5.4"\nreasoning_effort = "high"\n\ndeveloper_instructions = """Review the patch and list concrete risks."""\n`,
	);
};

const onlyResult = (results: readonly MigrationResult[]): MigrationResult => {
	expect(results).toHaveLength(1);
	return results[0];
};

afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("agent-sync migration service", () => {
	it("migrates a whole Claude folder including skills, agents, and commands", () => {
		const { projectDir, homeDir } = workspace();
		writeClaudeSkill(projectDir, "reviewer");
		writeClaudeAgent(projectDir, "reviewer");
		writeClaudeCommand(projectDir, "review");

		const results = migratePath(join(projectDir, ".claude"), {
			from: "claude",
			projectDir,
			homeDir,
			scope: "project",
			targets: "all",
			force: true,
		});

		expect(results.map((result) => `${result.kind}:${result.name}:${result.status}`).sort()).toEqual([
			"agent:reviewer:MIGRATED",
			"skill:review:MIGRATED",
			"skill:reviewer:MIGRATED",
		]);
		expect(readFileSync(join(projectDir, ".agent-sync", "skills", "reviewer", "SKILL.md"), "utf-8")).toContain(
			"name: reviewer",
		);
		expect(readFileSync(join(projectDir, ".agent-sync", "skills", "review", "SKILL.md"), "utf-8")).toContain(
			"Run a focused code review",
		);
		expect(readFileSync(join(projectDir, ".agent-sync", "agents", "reviewer", "agent.yaml"), "utf-8")).toContain(
			'description: "Reviews changes"',
		);
		expect(readFileSync(join(projectDir, ".agent-sync", "agents", "reviewer", "prompt.md"), "utf-8")).toContain(
			"Review the current change set.",
		);
		expect(readlinkSync(join(projectDir, ".agents", "skills", "review"))).toBe(
			join(projectDir, ".agent-sync", "skills", "review"),
		);
		expect(readlinkSync(join(projectDir, ".codex", "agents", "reviewer.toml"))).toBe(
			join(projectDir, ".agent-sync", "agents", "reviewer", "dist", "codex.toml"),
		);
	});

	it("migrates a Codex folder with TOML agents into portable agents", () => {
		const { projectDir, homeDir } = workspace();
		writeCodexAgent(projectDir, "reviewer");

		const results = migratePath(join(projectDir, ".codex"), {
			from: "codex",
			projectDir,
			homeDir,
			scope: "project",
			targets: "all",
			force: true,
		});

		expect(results).toHaveLength(1);
		expect(results[0].kind).toBe("agent");
		expect(readFileSync(join(projectDir, ".agent-sync", "agents", "reviewer", "agent.yaml"), "utf-8")).toContain(
			'model: "gpt-5.4"',
		);
		expect(readFileSync(join(projectDir, ".agent-sync", "agents", "reviewer", "prompt.md"), "utf-8")).toContain(
			"Review the patch and list concrete risks.",
		);
		expect(readlinkSync(join(projectDir, ".claude", "agents", "reviewer.md"))).toBe(
			join(projectDir, ".agent-sync", "agents", "reviewer", "dist", "claude.md"),
		);
	});

	it("migrates one Claude command as a portable skill", () => {
		const { projectDir, homeDir } = workspace();
		writeClaudeCommand(projectDir, "audit");

		const result = onlyResult(
			migrateCommand(join(projectDir, ".claude", "commands", "audit.md"), {
				from: "claude",
				projectDir,
				homeDir,
				scope: "project",
				targets: "all",
				force: true,
			}),
		);

		expect(result.kind).toBe("skill");
		expect(result.sourceType).toBe("command");
		expect(readFileSync(join(projectDir, ".agent-sync", "skills", "audit", "SKILL.md"), "utf-8")).toContain(
			"name: audit",
		);
		expect(readlinkSync(join(projectDir, ".agents", "skills", "audit"))).toBe(
			join(projectDir, ".agent-sync", "skills", "audit"),
		);
	});

	it("migrates targeted commands for both project and global scopes", () => {
		const { projectDir, homeDir } = workspace();
		writeClaudeCommand(projectDir, "dual");

		const results = migrateCommand(join(projectDir, ".claude", "commands", "dual.md"), {
			from: "claude",
			projectDir,
			homeDir,
			scope: "all",
			targets: "all",
			force: true,
		});

		expect(results.map((result) => result.canonicalPath).sort()).toEqual([
			join(homeDir, ".agent-sync", "skills", "dual"),
			join(projectDir, ".agent-sync", "skills", "dual"),
		]);
		expect(readlinkSync(join(homeDir, ".agents", "skills", "dual"))).toBe(
			join(homeDir, ".agent-sync", "skills", "dual"),
		);
		expect(readlinkSync(join(projectDir, ".agents", "skills", "dual"))).toBe(
			join(projectDir, ".agent-sync", "skills", "dual"),
		);
	});

	it("reports dry-run actions without writing files", () => {
		const { projectDir, homeDir } = workspace();
		writeClaudeSkill(projectDir, "audit");

		const results = migratePath(join(projectDir, ".claude"), {
			from: "claude",
			projectDir,
			homeDir,
			scope: "project",
			targets: "all",
			dryRun: true,
		});

		expect(results).toHaveLength(1);
		expect(results[0].status).toBe("DRY_RUN");
		expect(results[0].actions.some((action) => action.includes(".agent-sync/skills/audit"))).toBe(true);
		expect(existsSync(join(projectDir, ".agent-sync", "skills", "audit"))).toBe(false);
	});

	it("preserves existing provider files without force and reports a conflict", () => {
		const { projectDir, homeDir } = workspace();
		writeClaudeCommand(projectDir, "audit");
		mkdirSync(join(projectDir, ".agents", "skills", "audit"), { recursive: true });

		const result = onlyResult(
			migrateCommand(join(projectDir, ".claude", "commands", "audit.md"), {
				from: "claude",
				projectDir,
				homeDir,
				scope: "project",
				targets: "codex",
			}),
		);

		expect(result.status).toBe("CONFLICT");
		expect(result.detail).toContain("already exists");
		expect(lstatSync(join(projectDir, ".agents", "skills", "audit")).isSymbolicLink()).toBe(false);
	});

	it("migrates one Claude agent through the targeted agent API", () => {
		const { projectDir, homeDir } = workspace();
		writeClaudeAgent(projectDir, "architect");

		const result = onlyResult(
			migrateAgent(join(projectDir, ".claude", "agents", "architect.md"), {
				from: "claude",
				projectDir,
				homeDir,
				scope: "project",
				targets: "all",
				force: true,
			}),
		);

		expect(result.kind).toBe("agent");
		expect(
			readFileSync(join(projectDir, ".agent-sync", "agents", "architect", "dist", "claude.md"), "utf-8"),
		).toContain("Review the current change set.");
		expect(readlinkSync(join(projectDir, ".codex", "agents", "architect.toml"))).toBe(
			join(projectDir, ".agent-sync", "agents", "architect", "dist", "codex.toml"),
		);
	});

	it("migrates a Claude rules folder into canonical project rules and generated outputs", () => {
		const { projectDir, homeDir } = workspace();
		writeClaudeRule(projectDir, "api");

		const results = migrateRules(join(projectDir, ".claude", "rules"), {
			from: "claude",
			projectDir,
			homeDir,
			scope: "project",
			targets: "all",
			force: true,
		});

		expect(results.map((result) => `${result.kind}:${result.name}:${result.status}`)).toEqual(["rule:api:MIGRATED"]);
		expect(readFileSync(join(projectDir, ".agent-sync", "rules", "api.md"), "utf-8")).toContain("Keep api behavior");
		expect(readFileSync(join(projectDir, ".claude", "rules", "api.md"), "utf-8")).toContain("src/api/**/*.ts");
		expect(readFileSync(join(projectDir, "AGENTS.md"), "utf-8")).toContain("When modifying `src/api/**/*.ts`");
	});

	it("migrates one Claude rule with dry-run without writing files", () => {
		const { projectDir, homeDir } = workspace();
		writeClaudeRule(projectDir, "dry");

		const result = onlyResult(
			migrateRule(join(projectDir, ".claude", "rules", "dry.md"), {
				from: "claude",
				projectDir,
				homeDir,
				scope: "project",
				targets: "all",
				dryRun: true,
			}),
		);

		expect(result.kind).toBe("rule");
		expect(result.status).toBe("DRY_RUN");
		expect(result.actions.some((action) => action.includes(".agent-sync/rules/dry.md"))).toBe(true);
		expect(existsSync(join(projectDir, ".agent-sync", "rules", "dry.md"))).toBe(false);
	});
});
