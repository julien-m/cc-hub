import { afterEach, describe, expect, it } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { linkHook, repairHooks, runHooks, statusHooks, unlinkHook } from "../../src/services/agent-sync-hooks.ts";

// @spec FR-007: Isolated hook filesystem tests - .specs/features/006-agent-sync-hooks/spec.md#fr-007
const tempDirs: string[] = [];

const tempWorkspace = (): { projectDir: string; homeDir: string } => {
	const root = mkdtempSync(join(tmpdir(), "cc-hub-agent-sync-hooks-"));
	tempDirs.push(root);
	return { projectDir: join(root, "project"), homeDir: join(root, "home") };
};

const mkdirp = (path: string): void => {
	mkdirSync(path, { recursive: true });
};

const readJson = (path: string): Record<string, unknown> =>
	JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;

const writeJson = (path: string, value: unknown): void => {
	mkdirp(join(path, ".."));
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
};

const writeHook = (projectDir: string, name = "workflow-router"): string => {
	const hookDir = join(projectDir, "projects", "core", "kit", "hooks", name);
	mkdirp(hookDir);
	writeFileSync(
		join(hookDir, "session-start.sh"),
		[
			"#!/bin/sh",
			'printf \'%s\\n\' \'{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"ok"}}\'',
			"",
		].join("\n"),
	);
	return hookDir;
};

const seedProviderConfigs = (homeDir: string): void => {
	writeJson(join(homeDir, ".claude", "settings.json"), {
		hooks: {
			PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "existing-pre" }] }],
			Stop: [{ matcher: "", hooks: [{ type: "command", command: "existing-stop" }] }],
		},
	});
	writeJson(join(homeDir, ".codex", "hooks.json"), {
		hooks: {
			PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "existing-codex-pre" }] }],
			Stop: [{ matcher: "", hooks: [{ type: "command", command: "existing-codex-stop" }] }],
			SessionStart: [],
		},
	});
};

const sessionStartCommands = (config: Record<string, unknown>): readonly string[] => {
	const hooks = config.hooks as Record<string, unknown>;
	const entries = hooks.SessionStart as Array<{ hooks: Array<{ command?: string }> }>;
	return entries.flatMap((entry) =>
		entry.hooks.map((hook) => hook.command).filter((command): command is string => Boolean(command)),
	);
};

afterEach(() => {
	for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("agent-sync hooks service", () => {
	it("links a SessionStart hook to Claude and Codex without overwriting existing hooks", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		seedProviderConfigs(homeDir);
		const source = writeHook(projectDir);

		const entries = linkHook(source, { projectDir, homeDir, scope: "project", targets: "all" });
		const repeated = linkHook(source, { projectDir, homeDir, scope: "project", targets: "all", force: true });

		expect(entries.map((entry) => `${entry.provider}:${entry.status}`).sort()).toEqual(["claude:OK", "codex:OK"]);
		expect(repeated.map((entry) => `${entry.provider}:${entry.status}`).sort()).toEqual(["claude:OK", "codex:OK"]);
		expect(readlinkSync(join(projectDir, ".agent-sync", "hooks", "workflow-router"))).toBe(source);

		const claude = readJson(join(homeDir, ".claude", "settings.json"));
		const codex = readJson(join(homeDir, ".codex", "hooks.json"));
		expect(JSON.stringify(claude)).toContain("existing-pre");
		expect(JSON.stringify(claude)).toContain("existing-stop");
		expect(JSON.stringify(codex)).toContain("existing-codex-pre");
		expect(JSON.stringify(codex)).toContain("existing-codex-stop");
		expect(sessionStartCommands(claude)).toHaveLength(1);
		expect(sessionStartCommands(codex)).toHaveLength(1);

		const output = execFileSync(
			"bash",
			[join(projectDir, ".agent-sync", "hooks", "workflow-router", "session-start.sh")],
			{
				encoding: "utf-8",
			},
		);
		expect(JSON.parse(output)).toMatchObject({
			hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: "ok" },
		});
	});

	it("reports missing config entries and repairs them idempotently", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		const source = writeHook(projectDir);
		linkHook(source, { projectDir, homeDir, scope: "project", targets: "all" });
		writeJson(join(homeDir, ".codex", "hooks.json"), { hooks: { SessionStart: [] } });

		const before = statusHooks({ projectDir, homeDir, scope: "project", targets: "all" });
		const repaired = repairHooks({ projectDir, homeDir, scope: "project", targets: "all" });
		const after = statusHooks({ projectDir, homeDir, scope: "project", targets: "all" });

		expect(before.map((entry) => `${entry.provider}:${entry.status}`).sort()).toEqual(["claude:OK", "codex:MISSING"]);
		expect(repaired.map((entry) => `${entry.provider}:${entry.status}`).sort()).toEqual(["claude:OK", "codex:OK"]);
		expect(after.every((entry) => entry.status === "OK")).toBe(true);
		expect(sessionStartCommands(readJson(join(homeDir, ".codex", "hooks.json")))).toHaveLength(1);
	});

	it("reports broken hooks when the canonical script target disappears", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		const source = writeHook(projectDir);
		linkHook(source, { projectDir, homeDir, scope: "project", targets: "claude" });
		rmSync(source, { recursive: true, force: true });

		const entries = statusHooks({ projectDir, homeDir, scope: "project", targets: "claude" });

		expect(entries[0]).toMatchObject({ provider: "claude", status: "BROKEN" });
	});

	it("unlinks only the managed SessionStart command and keeps other commands", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		const source = writeHook(projectDir);
		linkHook(source, { projectDir, homeDir, scope: "project", targets: "claude" });
		const configPath = join(homeDir, ".claude", "settings.json");
		const config = readJson(configPath);
		((config.hooks as Record<string, unknown>).SessionStart as unknown[]).push({
			matcher: "",
			hooks: [{ type: "command", command: "other-session-start" }],
		});
		writeJson(configPath, config);

		const removed = unlinkHook("workflow-router", { projectDir, homeDir, scope: "project", targets: "claude" });
		const commands = sessionStartCommands(readJson(configPath));

		expect(removed).toEqual([configPath]);
		expect(commands).toEqual(["other-session-start"]);
	});

	it("does not rewrite provider config when unlinking an absent hook", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		const configPath = join(homeDir, ".claude", "settings.json");
		writeJson(configPath, {
			hooks: {
				SessionStart: [{ matcher: "", hooks: [{ type: "command", command: "other-session-start" }] }],
			},
		});
		const before = readFileSync(configPath, "utf-8");

		const removed = unlinkHook("missing-hook", { projectDir, homeDir, scope: "project", targets: "claude" });

		expect(removed).toEqual([]);
		expect(readFileSync(configPath, "utf-8")).toBe(before);
	});

	it("syncs every canonical hook through aggregate hook sync", () => {
		const { projectDir, homeDir } = tempWorkspace();
		mkdirp(projectDir);
		mkdirp(homeDir);
		const source = writeHook(projectDir);
		linkHook(source, { projectDir, homeDir, scope: "project", targets: "claude" });
		writeJson(join(homeDir, ".claude", "settings.json"), { hooks: { SessionStart: [] } });

		const entries = runHooks({ projectDir, homeDir, scope: "project", targets: "all" });

		expect(entries.map((entry) => `${entry.provider}:${entry.status}`).sort()).toEqual(["claude:OK", "codex:OK"]);
	});
});
