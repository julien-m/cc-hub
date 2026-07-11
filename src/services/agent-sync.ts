/** Provider-driven synchronization for portable skills and agents. */

import type { Stats } from "node:fs";
import {
	existsSync,
	lstatSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	readlinkSync,
	rmSync,
	statSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { findByProviderName, findModel } from "./models.ts";

export type ArtifactKind = "skill" | "agent";
export type ProviderId = "claude" | "codex";
export type SyncScope = "project" | "global" | "all";
export type SyncStatus = "OK" | "MISSING" | "BROKEN" | "LOCAL" | "ERROR";

export interface SyncOptions {
	readonly scope?: SyncScope;
	readonly targets?: string;
	readonly name?: string;
	readonly force?: boolean;
	readonly dryRun?: boolean;
	readonly json?: boolean;
	readonly projectDir?: string;
	readonly homeDir?: string;
	readonly agentSyncRoot?: string;
}

export interface ProviderDefinition {
	readonly id: ProviderId;
	readonly label: string;
	readonly skills: {
		readonly projectDir: string;
		readonly globalDir: string;
	};
	readonly agents: {
		readonly extension: ".md" | ".toml";
		readonly projectDir: string;
		readonly globalDir: string;
		readonly distFile: "claude.md" | "codex.toml";
	};
}

export interface SyncEntry {
	readonly kind: ArtifactKind;
	readonly name: string;
	readonly scope: Exclude<SyncScope, "all">;
	readonly provider: ProviderId;
	readonly providerPath: string;
	readonly targetPath: string;
	readonly status: SyncStatus;
	readonly detail?: string;
}

interface AgentMetadata {
	readonly name: string;
	readonly description: string;
	readonly model?: string;
	readonly effort?: string;
	readonly tools: readonly string[];
	readonly skills: readonly string[];
	readonly targets: readonly ProviderId[];
}

interface RuntimePaths {
	readonly projectDir: string;
	readonly homeDir: string;
	readonly agentSyncRoot?: string;
}

// @spec FR-010: Data-driven provider registry - .specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/spec.md#fr-010
export const PROVIDERS: readonly ProviderDefinition[] = [
	{
		id: "claude",
		label: "Claude Code",
		skills: {
			projectDir: ".claude/skills",
			globalDir: ".claude/skills",
		},
		agents: {
			extension: ".md",
			projectDir: ".claude/agents",
			globalDir: ".claude/agents",
			distFile: "claude.md",
		},
	},
	{
		id: "codex",
		label: "Codex",
		skills: {
			projectDir: ".agents/skills",
			globalDir: ".agents/skills",
		},
		agents: {
			extension: ".toml",
			projectDir: ".codex/agents",
			globalDir: ".codex/agents",
			distFile: "codex.toml",
		},
	},
] as const;

const FEATURE_SPEC = ".specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/spec.md";

const runtimePaths = (options: SyncOptions = {}): RuntimePaths => {
	const projectDir = resolve(options.projectDir ?? process.cwd());
	return {
		projectDir,
		homeDir: resolve(options.homeDir ?? homedir()),
		agentSyncRoot: options.agentSyncRoot
			? isAbsolute(options.agentSyncRoot)
				? resolve(options.agentSyncRoot)
				: resolve(projectDir, options.agentSyncRoot)
			: undefined,
	};
};

const canonicalRoot = (scope: Exclude<SyncScope, "all">, paths: RuntimePaths): string =>
	paths.agentSyncRoot ??
	(scope === "project" ? join(paths.projectDir, ".agent-sync") : join(paths.homeDir, ".agent-sync"));

const providerRoot = (
	provider: ProviderDefinition,
	kind: ArtifactKind,
	scope: Exclude<SyncScope, "all">,
	paths: RuntimePaths,
): string => {
	const relativeRoot =
		kind === "skill"
			? scope === "project"
				? provider.skills.projectDir
				: provider.skills.globalDir
			: scope === "project"
				? provider.agents.projectDir
				: provider.agents.globalDir;
	return join(scope === "project" ? paths.projectDir : paths.homeDir, relativeRoot);
};

/**
 * Resolve a scope option into concrete scopes.
 * @param scope The user-supplied scope option.
 * @returns Concrete scopes to process.
 */
export const resolveScopes = (scope: SyncScope = "global"): readonly Exclude<SyncScope, "all">[] => {
	if (scope === "all") return ["project", "global"];
	if (scope === "project" || scope === "global") return [scope];
	throw new Error(`Unsupported scope "${scope}". Supported scopes: project, global, all`);
};

/**
 * Resolve target provider names.
 * @param targets Comma-separated targets or "all".
 * @returns Matching provider definitions.
 * @throws Error when a target is unsupported.
 */
export const resolveProviders = (targets = "claude"): readonly ProviderDefinition[] => {
	// @spec FR-009: Validate provider targets - .specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/spec.md#fr-009
	const requested = targets
		.split(",")
		.map((target) => target.trim())
		.filter(Boolean);
	const expanded =
		requested.length === 0 || requested.includes("all") ? PROVIDERS.map((provider) => provider.id) : requested;
	const providers = expanded.map((target) => {
		const provider = PROVIDERS.find((candidate) => candidate.id === target);
		if (!provider) {
			throw new Error(
				`Unsupported target "${target}". Supported targets: ${PROVIDERS.map((p) => p.id).join(", ")}, all`,
			);
		}
		return provider;
	});
	return [...new Map(providers.map((provider) => [provider.id, provider])).values()];
};

const extractFrontmatterName = (filePath: string): string => {
	const content = readFileSync(filePath, "utf-8");
	const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---/);
	const name = frontmatter?.[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
	if (!name) {
		throw new Error(`Missing "name" field in frontmatter of ${filePath}`);
	}
	return name;
};

const ensureDirectory = (path: string): void => {
	mkdirSync(path, { recursive: true });
};

const removeIfAllowed = (path: string, force: boolean | undefined): void => {
	let stat: Stats;
	try {
		stat = lstatSync(path);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return;
		throw error;
	}
	if (!stat.isSymbolicLink() && !force) {
		throw new Error(`${path} already exists and is not a symlink. Re-run with --force to replace it.`);
	}
	rmSync(path, { recursive: true, force: true });
};

const createSymlink = (targetPath: string, providerPath: string, force: boolean | undefined): void => {
	removeIfAllowed(providerPath, force);
	ensureDirectory(dirname(providerPath));
	symlinkSync(targetPath, providerPath);
};

const safeReadlink = (path: string): string | undefined => {
	try {
		return readlinkSync(path);
	} catch {
		return undefined;
	}
};

const classifyPath = (providerPath: string, targetPath: string): Pick<SyncEntry, "status" | "detail"> => {
	try {
		const stat = lstatSync(providerPath);
		if (!stat.isSymbolicLink()) {
			return { status: "LOCAL", detail: "provider path exists but is not a symlink" };
		}
		try {
			const actualTarget = safeReadlink(providerPath);
			statSync(providerPath);
			if (actualTarget && resolve(dirname(providerPath), actualTarget) !== targetPath && actualTarget !== targetPath) {
				return { status: "ERROR", detail: `symlink points to ${actualTarget}` };
			}
			return { status: "OK" };
		} catch {
			return { status: "BROKEN", detail: "symlink target does not exist" };
		}
	} catch {
		return { status: "MISSING" };
	}
};

const listDirectories = (path: string): readonly string[] => {
	if (!existsSync(path)) return [];
	return readdirSync(path).filter((entry) => {
		try {
			const stat = lstatSync(join(path, entry));
			return stat.isDirectory() || stat.isSymbolicLink();
		} catch {
			return false;
		}
	});
};

const listCanonicalNames = (
	kind: ArtifactKind,
	scope: Exclude<SyncScope, "all">,
	paths: RuntimePaths,
): readonly string[] => {
	return listDirectories(join(canonicalRoot(scope, paths), `${kind}s`));
};

const filteredCanonicalNames = (
	kind: ArtifactKind,
	scope: Exclude<SyncScope, "all">,
	paths: RuntimePaths,
	name?: string,
): readonly string[] => {
	if (name) return [name];
	return listCanonicalNames(kind, scope, paths);
};

const skillCanonicalPath = (name: string, scope: Exclude<SyncScope, "all">, paths: RuntimePaths): string =>
	join(canonicalRoot(scope, paths), "skills", name);

const agentCanonicalPath = (name: string, scope: Exclude<SyncScope, "all">, paths: RuntimePaths): string =>
	join(canonicalRoot(scope, paths), "agents", name);

const resolveSourcePath = (pathOrName: string, baseDir: string): string => {
	if (pathOrName.includes("/") || pathOrName.startsWith(".")) {
		const abs = isAbsolute(pathOrName) ? pathOrName : resolve(baseDir, pathOrName);
		if (!existsSync(abs)) {
			throw new Error(`Path ${abs} does not exist`);
		}
		return abs;
	}
	return pathOrName;
};

const resolveSkillSource = (
	pathOrName: string,
	scope: Exclude<SyncScope, "all">,
	paths: RuntimePaths,
	customName?: string,
): { name: string; sourcePath: string; canonicalPath: string } => {
	const resolved = resolveSourcePath(pathOrName, paths.projectDir);
	if (!isAbsolute(resolved)) {
		const canonicalPath = skillCanonicalPath(resolved, scope, paths);
		if (!existsSync(canonicalPath)) {
			throw new Error(`skill "${resolved}" not found at ${canonicalPath}`);
		}
		return { name: resolved, sourcePath: canonicalPath, canonicalPath };
	}
	const stat = statSync(resolved);
	const skillDir = stat.isDirectory() ? resolved : dirname(resolved);
	const skillFile = stat.isDirectory() ? join(resolved, "SKILL.md") : resolved;
	if (!existsSync(skillFile)) {
		throw new Error(`No SKILL.md found in ${skillDir}`);
	}
	const name = customName ?? extractFrontmatterName(skillFile);
	return { name, sourcePath: skillDir, canonicalPath: skillCanonicalPath(name, scope, paths) };
};

const ensureCanonicalSkill = (
	pathOrName: string,
	scope: Exclude<SyncScope, "all">,
	options: SyncOptions,
): { name: string; canonicalPath: string } => {
	const paths = runtimePaths(options);
	const source = resolveSkillSource(pathOrName, scope, paths, options.name);
	if (source.sourcePath !== source.canonicalPath) {
		createSymlink(source.sourcePath, source.canonicalPath, options.force);
	}
	return { name: source.name, canonicalPath: source.canonicalPath };
};

const parseStringValue = (line: string): string => line.replace(/^['"]|['"]$/g, "").trim();

const parseAgentMetadata = (sourceDir: string): AgentMetadata => {
	const yamlPath = join(sourceDir, "agent.yaml");
	if (!existsSync(yamlPath)) {
		throw new Error(`Missing agent.yaml in ${sourceDir}`);
	}
	const yaml = readFileSync(yamlPath, "utf-8").split("\n");
	const data: {
		name?: string;
		description?: string;
		model?: string;
		effort?: string;
		tools: string[];
		skills: string[];
		targets: ProviderId[];
	} = { tools: [], skills: [], targets: [] };
	let section: "tools" | "skills" | "targets" | undefined;
	for (const rawLine of yaml) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
		const keyValue = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
		if (keyValue) {
			const [, key, value] = keyValue;
			section = key === "tools" || key === "skills" || key === "targets" ? key : undefined;
			if (key === "name") data.name = parseStringValue(value);
			if (key === "description") data.description = parseStringValue(value);
			if (key === "model") data.model = parseStringValue(value);
			if (key === "effort") data.effort = parseStringValue(value);
			if (section && value.startsWith("[")) {
				const values = value
					.replace(/^\[|\]$/g, "")
					.split(",")
					.map((item) => parseStringValue(item.trim()))
					.filter(Boolean);
				if (section === "tools") data.tools.push(...values);
				if (section === "skills") data.skills.push(...values);
				if (section === "targets") data.targets.push(...(values as ProviderId[]));
			}
			continue;
		}
		const listValue = line.match(/^-\s*(.+)$/)?.[1];
		if (section && listValue) {
			if (section === "tools") data.tools.push(parseStringValue(listValue));
			if (section === "skills") data.skills.push(parseStringValue(listValue));
			if (section === "targets") data.targets.push(parseStringValue(listValue) as ProviderId);
		}
		const targetToggle = line.match(/^(claude|codex):\s*(true|false)$/);
		if (section === "targets" && targetToggle?.[2] === "true") {
			data.targets.push(targetToggle[1] as ProviderId);
		}
	}
	if (!data.name) throw new Error(`Missing "name" in ${yamlPath}`);
	if (!data.description) throw new Error(`Missing "description" in ${yamlPath}`);
	const targets = data.targets.length > 0 ? data.targets : PROVIDERS.map((provider) => provider.id);
	return {
		name: data.name,
		description: data.description,
		model: data.model,
		effort: data.effort,
		tools: data.tools,
		skills: data.skills,
		targets,
	};
};

const readPrompt = (sourceDir: string): string => {
	const promptPath = join(sourceDir, "prompt.md");
	if (!existsSync(promptPath)) {
		throw new Error(`Missing prompt.md in ${sourceDir}`);
	}
	return readFileSync(promptPath, "utf-8").trimEnd();
};

const yamlList = (values: readonly string[]): string =>
	values.length === 0 ? "" : values.map((value) => `  - ${value}`).join("\n");

const renderClaudeAgent = (metadata: AgentMetadata, prompt: string): string => {
	const lines = ["---", `name: ${metadata.name}`, `description: ${metadata.description}`];
	if (metadata.model && metadata.model !== "inherit") lines.push(`model: ${metadata.model}`);
	if (metadata.tools.length > 0) lines.push("tools:", yamlList(metadata.tools));
	if (metadata.skills.length > 0) lines.push("skills:", yamlList(metadata.skills));
	lines.push("---", "", prompt, "");
	return lines
		.filter((line) => line !== "")
		.join("\n")
		.replace(/\n---\n\n/, "\n---\n\n");
};

const tomlString = (value: string): string => JSON.stringify(value);

const tomlMultiline = (value: string): string => `"""${value.replace(/\\/g, "\\\\").replace(/"""/g, '\\"\\"\\"')}"""`;

const isClaudeOnlyModel = (model: string): boolean => {
	const normalized = model.trim().toLowerCase();
	return (
		normalized === "haiku" ||
		normalized === "sonnet" ||
		normalized === "opus" ||
		normalized.startsWith("claude-") ||
		normalized.startsWith("anthropic/claude-")
	);
};

const codexAgentModel = (model: string | undefined): string | undefined => {
	if (!model || model === "inherit" || isClaudeOnlyModel(model)) return undefined;
	const canonical = findModel(model);
	if (canonical) return canonical.providers.codex;
	if (findByProviderName("codex", model)) return model;
	return model;
};

const renderCodexAgent = (metadata: AgentMetadata, prompt: string): string => {
	const lines = [`name = ${tomlString(metadata.name)}`, `description = ${tomlString(metadata.description)}`];
	const model = codexAgentModel(metadata.model);
	if (model) lines.push(`model = ${tomlString(model)}`);
	if (metadata.effort) lines.push(`reasoning_effort = ${tomlString(metadata.effort)}`);
	lines.push("", `developer_instructions = ${tomlMultiline(prompt)}`, "");
	return lines.join("\n");
};

/**
 * Create a portable agent source directory.
 * @param name Agent name.
 * @param options Sync options controlling scope and filesystem roots.
 * @returns The created source directory path.
 */
export const createAgentSource = (name: string, options: SyncOptions = {}): string => {
	// @spec FR-001: Canonical agent-sync roots, FR-003: Portable agent source - .specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/spec.md#fr-003
	const paths = runtimePaths(options);
	const scope = resolveScopes(options.scope ?? "project")[0];
	const sourceDir = agentCanonicalPath(name, scope, paths);
	if (existsSync(sourceDir) && !options.force) {
		throw new Error(`Agent source already exists at ${sourceDir}. Re-run with --force to replace it.`);
	}
	if (options.force) rmSync(sourceDir, { recursive: true, force: true });
	ensureDirectory(sourceDir);
	writeFileSync(
		join(sourceDir, "agent.yaml"),
		`name: ${name}\ndescription: ${name} agent\nmodel: inherit\ntargets:\n  - claude\n  - codex\n`,
	);
	writeFileSync(join(sourceDir, "prompt.md"), `You are ${name}.\n`);
	return sourceDir;
};

/**
 * Build provider-native agent files from a portable agent source.
 * @param name Agent name.
 * @param options Sync options controlling scope and targets.
 * @returns Written provider output file paths.
 */
export const buildAgent = (name: string, options: SyncOptions = {}): readonly string[] => {
	const paths = runtimePaths(options);
	const written: string[] = [];
	for (const scope of resolveScopes(options.scope ?? "project")) {
		const sourceDir = agentCanonicalPath(name, scope, paths);
		const metadata = parseAgentMetadata(sourceDir);
		const prompt = readPrompt(sourceDir);
		const providers = resolveProviders(options.targets ?? "all").filter((provider) =>
			metadata.targets.includes(provider.id),
		);
		const distDir = join(sourceDir, "dist");
		ensureDirectory(distDir);
		for (const provider of providers) {
			const dest = join(distDir, provider.agents.distFile);
			const content =
				provider.id === "claude" ? renderClaudeAgent(metadata, prompt) : renderCodexAgent(metadata, prompt);
			// @spec FR-004: Render provider-native agents - .specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/spec.md#fr-004
			writeFileSync(dest, content);
			written.push(dest);
		}
	}
	return written;
};

const expectedEntry = (
	kind: ArtifactKind,
	name: string,
	scope: Exclude<SyncScope, "all">,
	provider: ProviderDefinition,
	paths: RuntimePaths,
): SyncEntry => {
	const root = providerRoot(provider, kind, scope, paths);
	const targetPath =
		kind === "skill"
			? skillCanonicalPath(name, scope, paths)
			: join(agentCanonicalPath(name, scope, paths), "dist", provider.agents.distFile);
	const providerPath = kind === "skill" ? join(root, name) : join(root, `${name}${provider.agents.extension}`);
	const classification = classifyPath(providerPath, targetPath);
	return { kind, name, scope, provider: provider.id, providerPath, targetPath, ...classification };
};

const linkEntry = (entry: SyncEntry, force: boolean | undefined): void => {
	if (!existsSync(entry.targetPath)) {
		throw new Error(`Cannot link ${entry.kind} "${entry.name}": target ${entry.targetPath} does not exist`);
	}
	// @spec FR-005: Provider links target generated files - .specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/spec.md#fr-005
	createSymlink(entry.targetPath, entry.providerPath, force);
};

/**
 * Link a skill into canonical and provider locations.
 * @param pathOrName Source path or canonical skill name.
 * @param options Sync options controlling scope and targets.
 * @returns Provider status entries after linking.
 */
export const linkSkill = (pathOrName: string, options: SyncOptions = {}): readonly SyncEntry[] => {
	const paths = runtimePaths(options);
	const entries: SyncEntry[] = [];
	for (const scope of resolveScopes(options.scope ?? "global")) {
		const { name } = ensureCanonicalSkill(pathOrName, scope, options);
		for (const provider of resolveProviders(options.targets ?? "claude")) {
			const entry = expectedEntry("skill", name, scope, provider, paths);
			// @spec FR-002: Canonical skill source and provider symlink - .specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/spec.md#fr-002
			linkEntry(entry, options.force);
			entries.push(expectedEntry("skill", name, scope, provider, paths));
		}
	}
	return entries;
};

/**
 * Link generated provider-native agent files.
 * @param name Agent name.
 * @param options Sync options controlling scope and targets.
 * @returns Provider status entries after linking.
 */
export const linkAgent = (name: string, options: SyncOptions = {}): readonly SyncEntry[] => {
	const paths = runtimePaths(options);
	buildAgent(name, options);
	const entries: SyncEntry[] = [];
	for (const scope of resolveScopes(options.scope ?? "global")) {
		const metadata = parseAgentMetadata(agentCanonicalPath(name, scope, paths));
		const providers = resolveProviders(options.targets ?? "claude").filter((provider) =>
			metadata.targets.includes(provider.id),
		);
		for (const provider of providers) {
			const entry = expectedEntry("agent", name, scope, provider, paths);
			linkEntry(entry, options.force);
			entries.push(expectedEntry("agent", name, scope, provider, paths));
		}
	}
	return entries;
};

const statusForKind = (kind: ArtifactKind, options: SyncOptions = {}): readonly SyncEntry[] => {
	// @spec FR-006: Classify provider sync status - .specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/spec.md#fr-006
	const paths = runtimePaths(options);
	const entries: SyncEntry[] = [];
	for (const scope of resolveScopes(options.scope ?? "all")) {
		for (const name of filteredCanonicalNames(kind, scope, paths, options.name)) {
			for (const provider of resolveProviders(options.targets ?? "all")) {
				entries.push(expectedEntry(kind, name, scope, provider, paths));
			}
		}
	}
	return entries;
};

export const statusSkills = (options: SyncOptions = {}): readonly SyncEntry[] => statusForKind("skill", options);

export const statusAgents = (options: SyncOptions = {}): readonly SyncEntry[] => statusForKind("agent", options);

export const statusAll = (options: SyncOptions = {}): readonly SyncEntry[] => [
	...statusSkills(options),
	...statusAgents(options),
];

const repairEntries = (entries: readonly SyncEntry[], options: SyncOptions): readonly SyncEntry[] => {
	// @spec FR-007: Repair missing or broken symlinks - .specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/spec.md#fr-007
	const repaired: SyncEntry[] = [];
	for (const entry of entries) {
		if (entry.kind === "agent" && !existsSync(entry.targetPath)) {
			buildAgent(entry.name, { ...options, scope: entry.scope, targets: entry.provider });
		}
		if (entry.status === "MISSING" || entry.status === "BROKEN" || (entry.status === "LOCAL" && options.force)) {
			if (!options.dryRun) linkEntry(entry, options.force);
			repaired.push({ ...entry, status: options.dryRun ? entry.status : "OK" });
		}
	}
	return repaired;
};

export const repairSkills = (options: SyncOptions = {}): readonly SyncEntry[] =>
	repairEntries(statusSkills(options), options);

export const repairAgents = (options: SyncOptions = {}): readonly SyncEntry[] =>
	repairEntries(statusAgents(options), options);

export const repairAll = (options: SyncOptions = {}): readonly SyncEntry[] =>
	repairEntries(statusAll(options), options);

/**
 * Synchronize every canonical skill and agent for selected scopes and providers.
 * @param options Sync options controlling scope and targets.
 * @returns Provider entries after synchronization.
 */
export const runSync = (options: SyncOptions = {}): readonly SyncEntry[] => {
	// @spec FR-008: Aggregate skill and agent sync - .specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/spec.md#fr-008
	const paths = runtimePaths(options);
	const entries: SyncEntry[] = [];
	for (const scope of resolveScopes(options.scope ?? "all")) {
		for (const name of listCanonicalNames("skill", scope, paths)) {
			for (const provider of resolveProviders(options.targets ?? "all")) {
				const entry = expectedEntry("skill", name, scope, provider, paths);
				linkEntry(entry, options.force);
				entries.push(expectedEntry("skill", name, scope, provider, paths));
			}
		}
		for (const name of listCanonicalNames("agent", scope, paths)) {
			buildAgent(name, { ...options, scope });
			const metadata = parseAgentMetadata(agentCanonicalPath(name, scope, paths));
			const providers = resolveProviders(options.targets ?? "all").filter((provider) =>
				metadata.targets.includes(provider.id),
			);
			for (const provider of providers) {
				const entry = expectedEntry("agent", name, scope, provider, paths);
				linkEntry(entry, options.force);
				entries.push(expectedEntry("agent", name, scope, provider, paths));
			}
		}
	}
	return entries;
};

export const unlinkArtifact = (kind: ArtifactKind, name: string, options: SyncOptions = {}): readonly string[] => {
	const paths = runtimePaths(options);
	const removed: string[] = [];
	for (const scope of resolveScopes(options.scope ?? "global")) {
		for (const provider of resolveProviders(options.targets ?? "claude")) {
			const entry = expectedEntry(kind, name, scope, provider, paths);
			if (existsSync(entry.providerPath) || lstatExists(entry.providerPath)) {
				rmSync(entry.providerPath, { recursive: true, force: true });
				removed.push(entry.providerPath);
			}
		}
	}
	return removed;
};

const lstatExists = (path: string): boolean => {
	try {
		lstatSync(path);
		return true;
	} catch {
		return false;
	}
};

export const cleanAll = (options: SyncOptions = {}): readonly SyncEntry[] => {
	const entries = statusAll(options).filter((entry) => entry.status === "BROKEN");
	if (!options.dryRun) {
		for (const entry of entries) rmSync(entry.providerPath, { recursive: true, force: true });
	}
	return entries;
};

export const listCanonical = (kind: ArtifactKind, options: SyncOptions = {}): readonly string[] => {
	const paths = runtimePaths(options);
	const names = new Set<string>();
	for (const scope of resolveScopes(options.scope ?? "global")) {
		for (const name of listCanonicalNames(kind, scope, paths)) {
			if (!options.name || name === options.name) names.add(name);
		}
	}
	return [...names].sort();
};

export const formatEntries = (entries: readonly SyncEntry[]): string => {
	if (entries.length === 0) return "No agent-sync entries found.";
	return entries
		.map((entry) => {
			const providerPath = relative(process.cwd(), entry.providerPath) || entry.providerPath;
			const targetPath = relative(process.cwd(), entry.targetPath) || entry.targetPath;
			const detail = entry.detail ? ` (${entry.detail})` : "";
			return `${entry.kind}\t${entry.name}\t${entry.scope}\t${entry.provider}\t${entry.status}\t${providerPath} -> ${targetPath}${detail}`;
		})
		.join("\n");
};

export const featureSpecPath = FEATURE_SPEC;
