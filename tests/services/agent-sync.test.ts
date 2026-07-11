import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	buildAgent,
	createAgentSource,
	linkAgent,
	linkSkill,
	repairAll,
	resolveProviders,
	runSync,
	statusAll,
	statusSkills,
} from "../../src/services/agent-sync.ts";

const tempDirs: string[] = [];

const tempWorkspace = (): { projectDir: string; homeDir: string } => {
	const root = mkdtempSync(join(tmpdir(), "cc-hub-agent-sync-"));
	tempDirs.push(root);
	return { projectDir: join(root, "project"), homeDir: join(root, "home") };
};

const writeSkill = (dir: string, name = "example-skill"): string => {
	const skillDir = join(dir, name);
	mkdirp(skillDir);
	writeFileSync(join(skillDir, "SKILL.md"), `---\nname: ${name}\ndescription: Example skill\n---\n\n# Example\n`);
	return skillDir;
};

const writeAgent = (projectDir: string, name = "reviewer"): string => {
	const agentDir = join(projectDir, ".agent-sync", "agents", name);
	mkdirp(agentDir);
	writeFileSync(
		join(agentDir, "agent.yaml"),
		`name: ${name}\ndescription: Reviews code changes\nmodel: inherit\neffort: high\nskills:\n  - cc-hub\ntargets:\n  - claude\n  - codex\n`,
	);
	writeFileSync(join(agentDir, "prompt.md"), "You are a strict code reviewer.\n");
	return agentDir;
};

const mkdirp = (path: string): void => {
	mkdirSync(path, { recursive: true });
};

afterEach(() => {
	for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("agent-sync service", () => {
	it("links a project skill to Claude and Codex through canonical .agent-sync", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		const source = writeSkill(projectDir);

		const entries = linkSkill(source, { projectDir, homeDir, scope: "project", targets: "all" });

		expect(entries.map((entry) => `${entry.provider}:${entry.status}`).sort()).toEqual(["claude:OK", "codex:OK"]);
		expect(readlinkSync(join(projectDir, ".agent-sync", "skills", "example-skill"))).toBe(source);
		expect(readlinkSync(join(projectDir, ".claude", "skills", "example-skill"))).toBe(
			join(projectDir, ".agent-sync", "skills", "example-skill"),
		);
		expect(readlinkSync(join(projectDir, ".agents", "skills", "example-skill"))).toBe(
			join(projectDir, ".agent-sync", "skills", "example-skill"),
		);
	});

	it("links a global skill using an injected home directory", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		const source = writeSkill(projectDir, "global-skill");

		linkSkill(source, { projectDir, homeDir, scope: "global", targets: "all" });

		expect(readlinkSync(join(homeDir, ".claude", "skills", "global-skill"))).toBe(
			join(homeDir, ".agent-sync", "skills", "global-skill"),
		);
		expect(readlinkSync(join(homeDir, ".agents", "skills", "global-skill"))).toBe(
			join(homeDir, ".agent-sync", "skills", "global-skill"),
		);
	});

	it("creates, builds, and links a project agent for Claude and Codex", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		writeAgent(projectDir);

		const outputs = buildAgent("reviewer", { projectDir, homeDir, scope: "project", targets: "all" });
		const entries = linkAgent("reviewer", { projectDir, homeDir, scope: "project", targets: "all" });

		expect(outputs.sort()).toEqual([
			join(projectDir, ".agent-sync", "agents", "reviewer", "dist", "claude.md"),
			join(projectDir, ".agent-sync", "agents", "reviewer", "dist", "codex.toml"),
		]);
		expect(readFileSync(outputs[0], "utf-8")).toContain("You are a strict code reviewer.");
		expect(readFileSync(outputs[1], "utf-8")).toContain("developer_instructions");
		expect(entries.map((entry) => `${entry.provider}:${entry.status}`).sort()).toEqual(["claude:OK", "codex:OK"]);
		expect(readlinkSync(join(projectDir, ".claude", "agents", "reviewer.md"))).toBe(
			join(projectDir, ".agent-sync", "agents", "reviewer", "dist", "claude.md"),
		);
		expect(readlinkSync(join(projectDir, ".codex", "agents", "reviewer.toml"))).toBe(
			join(projectDir, ".agent-sync", "agents", "reviewer", "dist", "codex.toml"),
		);
	});

	it("replaces broken provider symlinks when linking project agents", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		writeAgent(projectDir);
		mkdirp(join(projectDir, ".claude", "agents"));
		symlinkSync(join(projectDir, "missing-agent.md"), join(projectDir, ".claude", "agents", "reviewer.md"));

		linkAgent("reviewer", { projectDir, homeDir, scope: "project", targets: "claude" });

		expect(readlinkSync(join(projectDir, ".claude", "agents", "reviewer.md"))).toBe(
			join(projectDir, ".agent-sync", "agents", "reviewer", "dist", "claude.md"),
		);
	});

	it("generates a Codex agent without copying Claude-only model aliases", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		const agentDir = writeAgent(projectDir, "cloud-reviewer");
		writeFileSync(
			join(agentDir, "agent.yaml"),
			`name: cloud-reviewer\ndescription: Reviews cloud changes\nmodel: sonnet\neffort: high\ntargets:\n  - claude\n  - codex\n`,
		);

		buildAgent("cloud-reviewer", { projectDir, homeDir, scope: "project", targets: "all" });

		const claudeAgent = readFileSync(join(agentDir, "dist", "claude.md"), "utf-8");
		const codexAgent = readFileSync(join(agentDir, "dist", "codex.toml"), "utf-8");
		expect(claudeAgent).toContain("model: sonnet");
		expect(codexAgent).toContain('name = "cloud-reviewer"');
		expect(codexAgent).toContain("developer_instructions");
		expect(codexAgent).not.toContain("model =");
		expect(codexAgent).not.toContain("sonnet");
	});

	it("translates canonical OpenAI models to Codex-native model names", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		const agentDir = writeAgent(projectDir, "codex-reviewer");
		writeFileSync(
			join(agentDir, "agent.yaml"),
			`name: codex-reviewer\ndescription: Reviews Codex changes\nmodel: openai/gpt-5.4\ntargets:\n  - codex\n`,
		);

		buildAgent("codex-reviewer", { projectDir, homeDir, scope: "project", targets: "codex" });

		expect(readFileSync(join(agentDir, "dist", "codex.toml"), "utf-8")).toContain('model = "gpt-5.4"');
	});

	it("creates a minimal portable agent source", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);

		const source = createAgentSource("writer", { projectDir, homeDir, scope: "project" });

		expect(readFileSync(join(source, "agent.yaml"), "utf-8")).toContain("name: writer");
		expect(readFileSync(join(source, "prompt.md"), "utf-8")).toContain("You are writer.");
	});

	it("detects broken and missing links then repairs them", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		const source = writeSkill(projectDir, "repair-skill");
		linkSkill(source, { projectDir, homeDir, scope: "project", targets: "all" });
		rmSync(join(projectDir, ".agents", "skills", "repair-skill"), { force: true });
		rmSync(source, { recursive: true, force: true });

		const broken = statusSkills({ projectDir, homeDir, scope: "project", targets: "all" });
		expect(broken.map((entry) => `${entry.provider}:${entry.status}`).sort()).toEqual([
			"claude:BROKEN",
			"codex:MISSING",
		]);

		writeSkill(projectDir, "repair-skill");
		repairAll({ projectDir, homeDir, scope: "project", targets: "all", force: true });

		const repaired = statusSkills({ projectDir, homeDir, scope: "project", targets: "all" });
		expect(repaired.map((entry) => `${entry.provider}:${entry.status}`).sort()).toEqual(["claude:OK", "codex:OK"]);
	});

	it("reports local provider files without replacing them unless forced", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		const source = writeSkill(projectDir, "local-skill");
		linkSkill(source, { projectDir, homeDir, scope: "project", targets: "codex" });
		rmSync(join(projectDir, ".agents", "skills", "local-skill"), { recursive: true, force: true });
		mkdirp(join(projectDir, ".agents", "skills", "local-skill"));

		const entries = statusSkills({ projectDir, homeDir, scope: "project", targets: "codex" });

		expect(entries[0].status).toBe("LOCAL");
	});

	it("runs sync for all canonical project skills and agents", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		const source = writeSkill(projectDir, "sync-skill");
		linkSkill(source, { projectDir, homeDir, scope: "project", targets: "claude" });
		writeAgent(projectDir, "sync-agent");

		const entries = runSync({ projectDir, homeDir, scope: "project", targets: "all", force: true });
		const status = statusAll({ projectDir, homeDir, scope: "project", targets: "all" });

		expect(entries.length).toBeGreaterThanOrEqual(4);
		expect(status.every((entry) => entry.status === "OK")).toBe(true);
	});

	it("rejects unsupported targets with supported target names", () => {
		expect(() => resolveProviders("unknown-ai")).toThrow("Supported targets: claude, codex, all");
	});
});
