import { afterEach, describe, expect, it } from "bun:test";
import {
	existsSync,
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
import { buildRules, linkRule, statusRules, unlinkRule } from "../../src/services/agent-sync-rules.ts";

const roots: string[] = [];

const workspace = (): { projectDir: string; homeDir: string } => {
	const root = mkdtempSync(join(tmpdir(), "cc-hub-rules-"));
	roots.push(root);
	const projectDir = join(root, "project");
	const homeDir = join(root, "home");
	mkdirSync(projectDir, { recursive: true });
	mkdirSync(homeDir, { recursive: true });
	return { projectDir: realpathSync(projectDir), homeDir: realpathSync(homeDir) };
};

const writeCanonicalProjectRule = (projectDir: string, name: string, content: string): string => {
	const rulePath = join(projectDir, ".agent-sync", "rules", `${name}.md`);
	mkdirSync(join(rulePath, ".."), { recursive: true });
	writeFileSync(rulePath, content);
	return rulePath;
};

afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("agent-sync rules service", () => {
	it("builds project Claude rules and a managed AGENTS.md block from canonical rules", () => {
		const { projectDir, homeDir } = workspace();
		writeCanonicalProjectRule(
			projectDir,
			"api",
			`---\npaths:\n  - "src/api/**/*.ts"\n---\n\n# API Rules\n\n- Validate all request inputs.\n`,
		);
		writeFileSync(join(projectDir, "AGENTS.md"), "# Existing Project Instructions\n\nKeep this text.\n");

		const entries = buildRules({ projectDir, homeDir, scope: "project", targets: "all" });

		expect(entries.map((entry) => `${entry.provider}:${entry.status}`).sort()).toEqual(["claude:OK", "codex:OK"]);
		expect(readFileSync(join(projectDir, ".claude", "rules", "api.md"), "utf-8")).toContain(
			'paths:\n  - "src/api/**/*.ts"',
		);
		const agents = readFileSync(join(projectDir, "AGENTS.md"), "utf-8");
		expect(agents).toContain("# Existing Project Instructions");
		expect(agents).toContain("<!-- cc-hub:project-rules:start -->");
		expect(agents).toContain("### api");
		expect(agents).toContain("When modifying `src/api/**/*.ts`");
		expect(agents).toContain("- Validate all request inputs.");
	});

	it("replaces only the managed AGENTS.md block on rebuild", () => {
		const { projectDir, homeDir } = workspace();
		writeCanonicalProjectRule(projectDir, "testing", "# Testing Rules\n\n- Run focused tests first.\n");
		writeFileSync(
			join(projectDir, "AGENTS.md"),
			[
				"# Manual Top",
				"",
				"<!-- cc-hub:project-rules:start -->",
				"old generated text",
				"<!-- cc-hub:project-rules:end -->",
				"",
				"## Manual Bottom",
			].join("\n"),
		);

		buildRules({ projectDir, homeDir, scope: "project", targets: "codex" });

		const agents = readFileSync(join(projectDir, "AGENTS.md"), "utf-8");
		expect(agents).toContain("# Manual Top");
		expect(agents).toContain("## Manual Bottom");
		expect(agents).not.toContain("old generated text");
		expect(agents).toContain("- Run focused tests first.");
	});

	it("builds global Claude rules and a global Codex AGENTS.md block from namespaced rules", () => {
		const { projectDir, homeDir } = workspace();
		const rulePath = join(homeDir, ".agent-sync", "rules", "project-x", "api.md");
		mkdirSync(join(rulePath, ".."), { recursive: true });
		writeFileSync(rulePath, "# API Rules\n\n- Prefer explicit DTOs.\n");

		buildRules({ projectDir, homeDir, scope: "global", targets: "all" });

		expect(readFileSync(join(homeDir, ".claude", "rules", "project-x", "api.md"), "utf-8")).toContain(
			"Prefer explicit DTOs.",
		);
		const globalAgents = readFileSync(join(homeDir, ".codex", "AGENTS.md"), "utf-8");
		expect(globalAgents).toContain("<!-- cc-hub:global-rules:start -->");
		expect(globalAgents).toContain("### project-x/api");
		expect(globalAgents).toContain("- Prefer explicit DTOs.");
	});

	it("reflects updates from a globally linked project rule", () => {
		const { projectDir, homeDir } = workspace();
		const source = writeCanonicalProjectRule(projectDir, "api", "# API Rules\n\n- First version.\n");

		linkRule(source, {
			projectDir,
			homeDir,
			scope: "global",
			targets: "all",
			namespace: "project-x",
			force: true,
		});
		writeFileSync(source, "# API Rules\n\n- Updated version.\n");
		buildRules({ projectDir, homeDir, scope: "global", targets: "all" });

		expect(readlinkSync(join(homeDir, ".agent-sync", "rules", "project-x", "api.md"))).toBe(source);
		expect(readFileSync(join(homeDir, ".codex", "AGENTS.md"), "utf-8")).toContain("- Updated version.");
	});

	it("links a single project rule then reports and unlinks it", () => {
		const { projectDir, homeDir } = workspace();
		const source = join(projectDir, "rules", "security.md");
		mkdirSync(join(source, ".."), { recursive: true });
		writeFileSync(source, "# Security Rules\n\n- Never log secrets.\n");

		linkRule(source, { projectDir, homeDir, scope: "project", targets: "all", force: true });

		expect(readlinkSync(join(projectDir, ".agent-sync", "rules", "security.md"))).toBe(source);
		expect(
			statusRules({ projectDir, homeDir, scope: "project", targets: "all" }).every((entry) => entry.status === "OK"),
		).toBe(true);

		unlinkRule("security", { projectDir, homeDir, scope: "project", targets: "all" });

		expect(existsSync(join(projectDir, ".agent-sync", "rules", "security.md"))).toBe(false);
		expect(existsSync(join(projectDir, ".claude", "rules", "security.md"))).toBe(false);
	});
});
