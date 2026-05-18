/** Migration utilities for importing provider folders into agent-sync. */

import {
	cpSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import {
	linkAgent,
	linkSkill,
	type ProviderId,
	resolveScopes,
	type SyncEntry,
	type SyncOptions,
} from "./agent-sync.ts";
import { buildRules, type RuleSyncEntry } from "./agent-sync-rules.ts";

export type MigrationOrigin = ProviderId;
export type MigrationSourceType = "skill" | "agent" | "command" | "rule";
export type MigrationStatus = "MIGRATED" | "DRY_RUN" | "CONFLICT" | "SKIPPED";

export interface MigrateOptions extends SyncOptions {
	readonly from?: MigrationOrigin;
}

export interface MigrationResult {
	readonly kind: "skill" | "agent" | "rule";
	readonly sourceType: MigrationSourceType;
	readonly name: string;
	readonly status: MigrationStatus;
	readonly sourcePath: string;
	readonly canonicalPath: string;
	readonly actions: readonly string[];
	readonly links: readonly (SyncEntry | RuleSyncEntry)[];
	readonly detail?: string;
}

interface RuntimePaths {
	readonly projectDir: string;
	readonly homeDir: string;
}

interface ParsedAgent {
	readonly name: string;
	readonly description: string;
	readonly model?: string;
	readonly effort?: string;
	readonly tools: readonly string[];
	readonly skills: readonly string[];
	readonly prompt: string;
}

const FEATURE_SPEC = ".specs/features/003-migrate-provider-folders-to-agent-sync/spec.md";

const runtimePaths = (options: MigrateOptions = {}): RuntimePaths => ({
	projectDir: resolve(options.projectDir ?? process.cwd()),
	homeDir: resolve(options.homeDir ?? homedir()),
});

const canonicalRoot = (scope: "project" | "global", paths: RuntimePaths): string =>
	scope === "project" ? join(paths.projectDir, ".agent-sync") : join(paths.homeDir, ".agent-sync");

const canonicalSkillPath = (name: string, scope: "project" | "global", paths: RuntimePaths): string =>
	join(canonicalRoot(scope, paths), "skills", name);

const canonicalAgentPath = (name: string, scope: "project" | "global", paths: RuntimePaths): string =>
	join(canonicalRoot(scope, paths), "agents", name);

const canonicalRulePath = (relativePath: string, scope: "project" | "global", paths: RuntimePaths): string =>
	join(canonicalRoot(scope, paths), "rules", relativePath.endsWith(".md") ? relativePath : `${relativePath}.md`);

const resolveInputPath = (path: string, paths: RuntimePaths): string => {
	const resolved = isAbsolute(path) ? path : resolve(paths.projectDir, path);
	if (!existsSync(resolved)) {
		throw new Error(`Path ${resolved} does not exist`);
	}
	return resolved;
};

const ensureDirectory = (path: string): void => {
	mkdirSync(path, { recursive: true });
};

const removeDestinationForWrite = (dest: string, force: boolean | undefined): void => {
	// @spec FR-009: Preserve non-forced conflicts — .specs/features/003-migrate-provider-folders-to-agent-sync/spec.md#fr-009
	if (!existsSync(dest)) return;
	if (!force) {
		throw new Error(`${dest} already exists. Re-run with --force to replace it.`);
	}
	rmSync(dest, { recursive: true, force: true });
};

const nameFromFile = (filePath: string): string => basename(filePath, extname(filePath));

const yamlScalar = (value: string): string => value.replace(/^['"]|['"]$/g, "").trim();

const yamlQuoted = (value: string): string => JSON.stringify(value);

const yamlList = (values: readonly string[]): string =>
	values.length === 0 ? "" : values.map((value) => `  - ${yamlQuoted(value)}`).join("\n");

const renderAgentYaml = (agent: ParsedAgent): string => {
	const lines = [
		`name: ${yamlQuoted(agent.name)}`,
		`description: ${yamlQuoted(agent.description)}`,
		`model: ${yamlQuoted(agent.model ?? "inherit")}`,
	];
	if (agent.effort) lines.push(`effort: ${yamlQuoted(agent.effort)}`);
	if (agent.tools.length > 0) lines.push("tools:", yamlList(agent.tools));
	if (agent.skills.length > 0) lines.push("skills:", yamlList(agent.skills));
	lines.push("targets:", "  - claude", "  - codex", "");
	return lines.join("\n");
};

const parseFrontmatterMarkdown = (filePath: string): { metadata: Record<string, string | string[]>; body: string } => {
	const content = readFileSync(filePath, "utf-8");
	const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
	if (!match) {
		return { metadata: {}, body: content.trimEnd() };
	}
	const metadata: Record<string, string | string[]> = {};
	let activeList: string | undefined;
	for (const rawLine of match[1].split("\n")) {
		const line = rawLine.trim();
		if (!line) continue;
		const keyValue = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
		if (keyValue) {
			const [, key, value] = keyValue;
			if (value === "") {
				metadata[key] = [];
				activeList = key;
				continue;
			}
			metadata[key] = yamlScalar(value);
			activeList = undefined;
			continue;
		}
		const listValue = line.match(/^-\s*(.+)$/)?.[1];
		if (activeList && listValue) {
			const existing = metadata[activeList];
			metadata[activeList] = [...(Array.isArray(existing) ? existing : []), yamlScalar(listValue)];
		}
	}
	return { metadata, body: content.slice(match[0].length).trimEnd() };
};

const metadataList = (metadata: Record<string, string | string[]>, key: string): readonly string[] => {
	const value = metadata[key];
	return Array.isArray(value) ? value : [];
};

const metadataString = (metadata: Record<string, string | string[]>, key: string): string | undefined => {
	const value = metadata[key];
	return typeof value === "string" ? value : undefined;
};

const parseClaudeAgent = (filePath: string): ParsedAgent => {
	const parsed = parseFrontmatterMarkdown(filePath);
	const name = metadataString(parsed.metadata, "name") ?? nameFromFile(filePath);
	return {
		name,
		description: metadataString(parsed.metadata, "description") ?? `${name} agent`,
		model: metadataString(parsed.metadata, "model"),
		effort: metadataString(parsed.metadata, "effort"),
		tools: metadataList(parsed.metadata, "tools"),
		skills: metadataList(parsed.metadata, "skills"),
		prompt: parsed.body,
	};
};

const readTomlString = (content: string, key: string): string | undefined => {
	const triple = content.match(new RegExp(`^${key}\\s*=\\s*"""([\\s\\S]*?)"""`, "m"));
	if (triple) return triple[1];
	const quoted = content.match(new RegExp(`^${key}\\s*=\\s*("([^"\\\\]|\\\\.)*")`, "m"))?.[1];
	if (!quoted) return undefined;
	try {
		return JSON.parse(quoted) as string;
	} catch {
		return quoted.replace(/^"|"$/g, "");
	}
};

const parseCodexAgent = (filePath: string): ParsedAgent => {
	const content = readFileSync(filePath, "utf-8");
	const name = readTomlString(content, "name") ?? nameFromFile(filePath);
	return {
		name,
		description: readTomlString(content, "description") ?? `${name} agent`,
		model: readTomlString(content, "model"),
		effort: readTomlString(content, "reasoning_effort"),
		tools: [],
		skills: [],
		prompt: readTomlString(content, "developer_instructions") ?? "",
	};
};

const extractSkillName = (skillDir: string): string => {
	const skillFile = join(skillDir, "SKILL.md");
	if (!existsSync(skillFile)) throw new Error(`No SKILL.md found in ${skillDir}`);
	const parsed = parseFrontmatterMarkdown(skillFile);
	return metadataString(parsed.metadata, "name") ?? basename(skillDir);
};

const renderCommandSkill = (name: string, commandPath: string): string => {
	const body = readFileSync(commandPath, "utf-8").trimEnd();
	return `---\nname: ${name}\ndescription: Migrated Claude command /${name}\n---\n\n# /${name}\n\n${body}\n`;
};

const resultFromError = (
	kind: "skill" | "agent" | "rule",
	sourceType: MigrationSourceType,
	name: string,
	sourcePath: string,
	canonicalPath: string,
	actions: readonly string[],
	error: unknown,
): MigrationResult => ({
	kind,
	sourceType,
	name,
	status: "CONFLICT",
	sourcePath,
	canonicalPath,
	actions,
	links: [],
	detail: error instanceof Error ? error.message : String(error),
});

const linkMigratedSkill = (name: string, scope: "project" | "global", options: MigrateOptions): readonly SyncEntry[] =>
	linkSkill(name, { ...options, scope, targets: options.targets ?? "all" });

const linkMigratedAgent = (name: string, scope: "project" | "global", options: MigrateOptions): readonly SyncEntry[] =>
	linkAgent(name, { ...options, scope, targets: options.targets ?? "all" });

const buildMigratedRules = (scope: "project" | "global", options: MigrateOptions): readonly RuleSyncEntry[] =>
	buildRules({ ...options, scope, targets: options.targets ?? "all" });

const resolveMigrationOrigin = (from: MigrateOptions["from"] | undefined, sourcePath: string): MigrationOrigin => {
	const origin = from ?? inferOrigin(sourcePath);
	if (origin === "claude" || origin === "codex") return origin;
	throw new Error(`Unsupported source provider "${origin}". Supported providers: claude, codex`);
};

const migrateSkillForScope = (
	sourcePath: string,
	scope: "project" | "global",
	options: MigrateOptions,
): MigrationResult => {
	// @spec FR-006: Link migrated artifacts — .specs/features/003-migrate-provider-folders-to-agent-sync/spec.md#fr-006
	const paths = runtimePaths(options);
	const sourceDir = statSync(sourcePath).isDirectory() ? sourcePath : dirname(sourcePath);
	const name = options.name ?? extractSkillName(sourceDir);
	const canonicalPath = canonicalSkillPath(name, scope, paths);
	const actions = [`copy ${sourceDir} -> ${canonicalPath}`, `link skill ${name} (${scope})`];
	if (options.dryRun) {
		// @spec FR-008: Dry-run avoids writes — .specs/features/003-migrate-provider-folders-to-agent-sync/spec.md#fr-008
		return {
			kind: "skill",
			sourceType: "skill",
			name,
			status: "DRY_RUN",
			sourcePath,
			canonicalPath,
			actions,
			links: [],
		};
	}
	try {
		if (resolve(sourceDir) !== resolve(canonicalPath)) {
			removeDestinationForWrite(canonicalPath, options.force);
			ensureDirectory(dirname(canonicalPath));
			cpSync(sourceDir, canonicalPath, { recursive: true, dereference: true });
		}
		return {
			kind: "skill",
			sourceType: "skill",
			name,
			status: "MIGRATED",
			sourcePath,
			canonicalPath,
			actions,
			links: linkMigratedSkill(name, scope, options),
		};
	} catch (error) {
		return resultFromError("skill", "skill", name, sourcePath, canonicalPath, actions, error);
	}
};

const migrateCommandForScope = (
	sourcePath: string,
	scope: "project" | "global",
	options: MigrateOptions,
): MigrationResult => {
	// @spec FR-003: Convert Claude commands to skills — .specs/features/003-migrate-provider-folders-to-agent-sync/spec.md#fr-003
	const paths = runtimePaths(options);
	const name = options.name ?? nameFromFile(sourcePath);
	const canonicalPath = canonicalSkillPath(name, scope, paths);
	const actions = [`write command skill ${canonicalPath}`, `link skill ${name} (${scope})`];
	if (options.dryRun) {
		return {
			kind: "skill",
			sourceType: "command",
			name,
			status: "DRY_RUN",
			sourcePath,
			canonicalPath,
			actions,
			links: [],
		};
	}
	try {
		removeDestinationForWrite(canonicalPath, options.force);
		ensureDirectory(canonicalPath);
		writeFileSync(join(canonicalPath, "SKILL.md"), renderCommandSkill(name, sourcePath));
		return {
			kind: "skill",
			sourceType: "command",
			name,
			status: "MIGRATED",
			sourcePath,
			canonicalPath,
			actions,
			links: linkMigratedSkill(name, scope, options),
		};
	} catch (error) {
		return resultFromError("skill", "command", name, sourcePath, canonicalPath, actions, error);
	}
};

const migrateRuleForScope = (
	sourcePath: string,
	scope: "project" | "global",
	options: MigrateOptions,
	sourceRoot?: string,
): MigrationResult => {
	// @spec FR-007: Import Claude rules, FR-008: Dry-run rules — .specs/features/004-portable-agent-sync-rules/spec.md#fr-007
	const paths = runtimePaths(options);
	const relativeName =
		options.name ??
		(sourceRoot ? relative(sourceRoot, sourcePath).replace(/\\/g, "/") : `${nameFromFile(sourcePath)}.md`);
	const relativePath = relativeName.endsWith(".md") ? relativeName : `${relativeName}.md`;
	const name = relativePath.slice(0, -extname(relativePath).length);
	const canonicalPath = canonicalRulePath(relativePath, scope, paths);
	const actions = [`copy rule ${sourcePath} -> ${canonicalPath}`, `build rules (${scope})`];
	if (options.dryRun) {
		return {
			kind: "rule",
			sourceType: "rule",
			name,
			status: "DRY_RUN",
			sourcePath,
			canonicalPath,
			actions,
			links: [],
		};
	}
	try {
		removeDestinationForWrite(canonicalPath, options.force);
		ensureDirectory(dirname(canonicalPath));
		writeFileSync(canonicalPath, readFileSync(sourcePath, "utf-8"));
		return {
			kind: "rule",
			sourceType: "rule",
			name,
			status: "MIGRATED",
			sourcePath,
			canonicalPath,
			actions,
			links: buildMigratedRules(scope, options),
		};
	} catch (error) {
		return resultFromError("rule", "rule", name, sourcePath, canonicalPath, actions, error);
	}
};

const writeAgentSource = (canonicalPath: string, agent: ParsedAgent, force: boolean | undefined): void => {
	removeDestinationForWrite(canonicalPath, force);
	ensureDirectory(canonicalPath);
	writeFileSync(join(canonicalPath, "agent.yaml"), renderAgentYaml(agent));
	writeFileSync(join(canonicalPath, "prompt.md"), `${agent.prompt.trimEnd()}\n`);
};

const migrateAgentForScope = (
	sourcePath: string,
	scope: "project" | "global",
	options: MigrateOptions,
): MigrationResult => {
	// @spec FR-004: Convert Claude agents, FR-005: Convert Codex agents — .specs/features/003-migrate-provider-folders-to-agent-sync/spec.md#fr-004
	const paths = runtimePaths(options);
	const origin = resolveMigrationOrigin(options.from, sourcePath);
	const agent = origin === "codex" ? parseCodexAgent(sourcePath) : parseClaudeAgent(sourcePath);
	const name = options.name ?? agent.name;
	const canonicalPath = canonicalAgentPath(name, scope, paths);
	const actions = [`write agent source ${canonicalPath}`, `build and link agent ${name} (${scope})`];
	if (options.dryRun) {
		return {
			kind: "agent",
			sourceType: "agent",
			name,
			status: "DRY_RUN",
			sourcePath,
			canonicalPath,
			actions,
			links: [],
		};
	}
	try {
		writeAgentSource(canonicalPath, { ...agent, name }, options.force);
		return {
			kind: "agent",
			sourceType: "agent",
			name,
			status: "MIGRATED",
			sourcePath,
			canonicalPath,
			actions,
			links: linkMigratedAgent(name, scope, options),
		};
	} catch (error) {
		return resultFromError("agent", "agent", name, sourcePath, canonicalPath, actions, error);
	}
};

const sortedFiles = (dir: string, extension?: string): readonly string[] => {
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.map((entry) => join(dir, entry))
		.filter((entry) => {
			try {
				const stat = lstatSync(entry);
				return (stat.isFile() || stat.isSymbolicLink()) && (!extension || entry.endsWith(extension));
			} catch {
				return false;
			}
		})
		.sort();
};

const sortedDirectories = (dir: string): readonly string[] => {
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.map((entry) => join(dir, entry))
		.filter((entry) => {
			try {
				const stat = lstatSync(entry);
				return stat.isDirectory() || stat.isSymbolicLink();
			} catch {
				return false;
			}
		})
		.sort();
};

const sortedMarkdownFilesRecursive = (dir: string): readonly string[] => {
	if (!existsSync(dir)) return [];
	const files: string[] = [];
	const visit = (currentDir: string): void => {
		for (const entry of readdirSync(currentDir).sort()) {
			const path = join(currentDir, entry);
			try {
				const stat = lstatSync(path);
				if (stat.isDirectory()) {
					visit(path);
					continue;
				}
				if ((stat.isFile() || stat.isSymbolicLink()) && path.endsWith(".md")) files.push(path);
			} catch {
				// Ignore entries that disappear during traversal.
			}
		}
	};
	visit(dir);
	return files;
};

const inferOrigin = (path: string): MigrationOrigin => (path.includes(`${".codex"}/`) ? "codex" : "claude");

const scopesForMigration = (options: MigrateOptions): readonly ("project" | "global")[] =>
	resolveScopes(options.scope ?? "project");

/**
 * Migrate one skill directory into agent-sync.
 */
export const migrateSkill = (path: string, options: MigrateOptions = {}): readonly MigrationResult[] => {
	// @spec FR-007: Targeted migrations — .specs/features/003-migrate-provider-folders-to-agent-sync/spec.md#fr-007
	const paths = runtimePaths(options);
	const sourcePath = resolveInputPath(path, paths);
	return scopesForMigration(options).map((scope) => migrateSkillForScope(sourcePath, scope, options));
};

/**
 * Migrate one Claude command markdown file into an agent-sync skill.
 */
export const migrateCommand = (path: string, options: MigrateOptions = {}): readonly MigrationResult[] => {
	const paths = runtimePaths(options);
	const sourcePath = resolveInputPath(path, paths);
	return scopesForMigration(options).map((scope) =>
		migrateCommandForScope(sourcePath, scope, { ...options, from: "claude" }),
	);
};

/**
 * Migrate one Claude rule markdown file into canonical agent-sync rules.
 */
export const migrateRule = (path: string, options: MigrateOptions = {}): readonly MigrationResult[] => {
	const paths = runtimePaths(options);
	const sourcePath = resolveInputPath(path, paths);
	return scopesForMigration(options).map((scope) =>
		migrateRuleForScope(sourcePath, scope, { ...options, from: "claude" }),
	);
};

/**
 * Migrate a Claude rules folder into canonical agent-sync rules.
 */
export const migrateRules = (path: string, options: MigrateOptions = {}): readonly MigrationResult[] => {
	const paths = runtimePaths(options);
	const sourcePath = resolveInputPath(path, paths);
	const files = statSync(sourcePath).isDirectory() ? sortedMarkdownFilesRecursive(sourcePath) : [sourcePath];
	const sourceRoot = statSync(sourcePath).isDirectory() ? sourcePath : undefined;
	const results: MigrationResult[] = [];
	for (const scope of scopesForMigration(options)) {
		for (const file of files) {
			results.push(migrateRuleForScope(file, scope, { ...options, from: "claude" }, sourceRoot));
		}
	}
	return results;
};

/**
 * Migrate one provider-native agent file into an agent-sync agent source.
 */
export const migrateAgent = (path: string, options: MigrateOptions = {}): readonly MigrationResult[] => {
	const paths = runtimePaths(options);
	const sourcePath = resolveInputPath(path, paths);
	return scopesForMigration(options).map((scope) => migrateAgentForScope(sourcePath, scope, options));
};

/**
 * Migrate a provider folder, discovering supported artifacts.
 */
export const migratePath = (path: string, options: MigrateOptions = {}): readonly MigrationResult[] => {
	// @spec FR-001: Folder migrate command, FR-002: Discover Claude folder — .specs/features/003-migrate-provider-folders-to-agent-sync/spec.md#fr-001
	const paths = runtimePaths(options);
	const sourcePath = resolveInputPath(path, paths);
	const origin = resolveMigrationOrigin(options.from, sourcePath);
	const results: MigrationResult[] = [];
	for (const scope of scopesForMigration(options)) {
		if (origin === "claude") {
			for (const skillDir of sortedDirectories(join(sourcePath, "skills"))) {
				results.push(migrateSkillForScope(skillDir, scope, { ...options, from: origin }));
			}
			for (const agentFile of sortedFiles(join(sourcePath, "agents"), ".md")) {
				results.push(migrateAgentForScope(agentFile, scope, { ...options, from: origin }));
			}
			for (const commandFile of sortedFiles(join(sourcePath, "commands"), ".md")) {
				results.push(migrateCommandForScope(commandFile, scope, { ...options, from: origin }));
			}
			for (const ruleFile of sortedMarkdownFilesRecursive(join(sourcePath, "rules"))) {
				results.push(migrateRuleForScope(ruleFile, scope, { ...options, from: origin }, join(sourcePath, "rules")));
			}
		} else {
			for (const agentFile of sortedFiles(join(sourcePath, "agents"), ".toml")) {
				results.push(migrateAgentForScope(agentFile, scope, { ...options, from: origin }));
			}
		}
	}
	return results;
};

export const formatMigrationResults = (results: readonly MigrationResult[]): string => {
	// @spec FR-010: Printable migration results — .specs/features/003-migrate-provider-folders-to-agent-sync/spec.md#fr-010
	if (results.length === 0) return "No migratable artifacts found.";
	return results
		.map((result) => {
			const detail = result.detail ? `\t${result.detail}` : "";
			return `${result.kind}\t${result.name}\t${result.sourceType}\t${result.status}\t${result.sourcePath} -> ${result.canonicalPath}${detail}`;
		})
		.join("\n");
};

export const featureSpecPath = FEATURE_SPEC;
