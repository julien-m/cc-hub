/** Portable SessionStart hook synchronization for Claude Code and Codex. */

import {
	existsSync,
	lstatSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, resolve } from "node:path";
import { type ProviderId, resolveProviders, resolveScopes, type SyncOptions, type SyncScope } from "./agent-sync.ts";

export type HookSyncStatus = "OK" | "MISSING" | "BROKEN" | "LOCAL" | "ERROR";

export interface HookSyncEntry {
	readonly kind: "hook";
	readonly name: string;
	readonly scope: Exclude<SyncScope, "all">;
	readonly provider: ProviderId;
	readonly providerPath: string;
	readonly targetPath: string;
	readonly status: HookSyncStatus;
	readonly detail?: string;
}

interface RuntimePaths {
	readonly projectDir: string;
	readonly homeDir: string;
	readonly agentSyncRoot?: string;
}

interface HookCommand {
	readonly command: string;
	readonly scriptPath: string;
}

type JsonObject = Record<string, unknown>;

const FEATURE_SPEC = ".specs/features/006-agent-sync-hooks/spec.md";
const HOOK_EVENT = "SessionStart";
const SESSION_START_CANDIDATES = ["session-start.sh", "hook.sh"] as const;

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
	// @spec FR-001: Canonical hook roots - .specs/features/006-agent-sync-hooks/spec.md#fr-001
	paths.agentSyncRoot ??
	(scope === "project" ? join(paths.projectDir, ".agent-sync") : join(paths.homeDir, ".agent-sync"));

const hookCanonicalPath = (name: string, scope: Exclude<SyncScope, "all">, paths: RuntimePaths): string =>
	join(canonicalRoot(scope, paths), "hooks", name);

const ensureDirectory = (path: string): void => {
	mkdirSync(path, { recursive: true });
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

const listCanonicalHookNames = (scope: Exclude<SyncScope, "all">, paths: RuntimePaths): readonly string[] =>
	listDirectories(join(canonicalRoot(scope, paths), "hooks"));

const resolveInputPath = (path: string, paths: RuntimePaths): string => {
	const resolved = isAbsolute(path) ? path : resolve(paths.projectDir, path);
	if (!existsSync(resolved)) throw new Error(`Path ${resolved} does not exist`);
	return resolved;
};

const removeIfAllowed = (path: string, force: boolean | undefined): void => {
	if (!existsSync(path)) return;
	const stat = lstatSync(path);
	if (!stat.isSymbolicLink() && !force) {
		throw new Error(`${path} already exists and is not a symlink. Re-run with --force to replace it.`);
	}
	rmSync(path, { recursive: true, force: true });
};

const shellQuote = (value: string): string => `'${value.replace(/'/g, "'\\''")}'`;

const hookProviderConfig = (provider: ProviderId, paths: RuntimePaths): { readonly configPath: string } => ({
	configPath:
		provider === "claude"
			? join(paths.homeDir, ".claude", "settings.json")
			: join(paths.homeDir, ".codex", "hooks.json"),
});

const readJsonConfig = (configPath: string): JsonObject => {
	if (!existsSync(configPath)) return {};
	const content = readFileSync(configPath, "utf-8").trim();
	if (!content) return {};
	const parsed = JSON.parse(content) as unknown;
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		throw new Error(`${configPath} must contain a JSON object`);
	}
	return parsed as JsonObject;
};

const writeJsonConfig = (configPath: string, config: JsonObject): void => {
	ensureDirectory(dirname(configPath));
	writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
};

const hookEvents = (config: JsonObject): JsonObject => {
	const current = config.hooks;
	if (typeof current === "object" && current !== null && !Array.isArray(current)) return current as JsonObject;
	const hooks: JsonObject = {};
	config.hooks = hooks;
	return hooks;
};

const sessionStartEntries = (config: JsonObject): unknown[] => {
	const hooks = hookEvents(config);
	const current = hooks[HOOK_EVENT];
	if (Array.isArray(current)) return current;
	const entries: unknown[] = [];
	hooks[HOOK_EVENT] = entries;
	return entries;
};

const commandInEntry = (entry: unknown, command: string): boolean => {
	if (typeof entry !== "object" || entry === null) return false;
	const hooks = (entry as { hooks?: unknown }).hooks;
	if (!Array.isArray(hooks)) return false;
	return hooks.some((hook) => {
		if (typeof hook !== "object" || hook === null) return false;
		const candidate = hook as { type?: unknown; command?: unknown };
		return candidate.type === "command" && candidate.command === command;
	});
};

const hasHookCommand = (config: JsonObject, command: string): boolean => {
	const hooks = config.hooks;
	if (typeof hooks !== "object" || hooks === null || Array.isArray(hooks)) return false;
	const entries = (hooks as JsonObject)[HOOK_EVENT];
	return Array.isArray(entries) && entries.some((entry) => commandInEntry(entry, command));
};

const removeHookCommand = (config: JsonObject, command: string): boolean => {
	const hooks = config.hooks;
	if (typeof hooks !== "object" || hooks === null || Array.isArray(hooks)) return false;
	const entries = (hooks as JsonObject)[HOOK_EVENT];
	if (!Array.isArray(entries)) return false;
	const next = entries
		.map((entry) => {
			if (typeof entry !== "object" || entry === null) return entry;
			const hookList = (entry as { hooks?: unknown }).hooks;
			if (!Array.isArray(hookList)) return entry;
			const keptHooks = hookList.filter((hook) => {
				if (typeof hook !== "object" || hook === null) return true;
				const candidate = hook as { type?: unknown; command?: unknown };
				return !(candidate.type === "command" && candidate.command === command);
			});
			return { ...(entry as JsonObject), hooks: keptHooks };
		})
		.filter((entry) => {
			if (typeof entry !== "object" || entry === null) return true;
			const hookList = (entry as { hooks?: unknown }).hooks;
			return !Array.isArray(hookList) || hookList.length > 0;
		});
	(hooks as JsonObject)[HOOK_EVENT] = next;
	return next.length !== entries.length || next.some((entry, index) => entry !== entries[index]);
};

const appendHookCommand = (config: JsonObject, hook: HookCommand): boolean => {
	if (hasHookCommand(config, hook.command)) return false;
	sessionStartEntries(config).push({
		matcher: "",
		hooks: [{ type: "command", command: hook.command, timeout: 10 }],
	});
	return true;
};

const resolveHookScript = (canonicalPath: string, name: string): string => {
	const candidates = [...SESSION_START_CANDIDATES, `${name}.sh`];
	for (const candidate of candidates) {
		const scriptPath = join(canonicalPath, candidate);
		if (existsSync(scriptPath)) return scriptPath;
	}
	return join(canonicalPath, SESSION_START_CANDIDATES[0]);
};

const expectedHookCommand = (canonicalPath: string, name: string): HookCommand => {
	// @spec FR-002: Publish SessionStart shell command - .specs/features/006-agent-sync-hooks/spec.md#fr-002
	const scriptPath = resolveHookScript(canonicalPath, name);
	return { command: `bash ${shellQuote(scriptPath)}`, scriptPath };
};

const ensureCanonicalHook = (
	pathOrName: string,
	scope: Exclude<SyncScope, "all">,
	options: SyncOptions,
): { name: string; canonicalPath: string } => {
	const paths = runtimePaths(options);
	const resolved =
		pathOrName.includes("/") || pathOrName.startsWith(".") ? resolveInputPath(pathOrName, paths) : undefined;
	if (!resolved) {
		const canonicalPath = hookCanonicalPath(pathOrName, scope, paths);
		if (!existsSync(canonicalPath)) throw new Error(`hook "${pathOrName}" not found at ${canonicalPath}`);
		return { name: pathOrName, canonicalPath };
	}
	const stat = statSync(resolved);
	const name = options.name ?? (stat.isDirectory() ? basename(resolved) : basename(resolved, extname(resolved)));
	const canonicalPath = hookCanonicalPath(name, scope, paths);
	if (stat.isDirectory()) {
		if (resolve(resolved) !== resolve(canonicalPath)) {
			removeIfAllowed(canonicalPath, options.force);
			ensureDirectory(dirname(canonicalPath));
			symlinkSync(resolved, canonicalPath);
		}
		return { name, canonicalPath };
	}
	removeIfAllowed(canonicalPath, options.force);
	ensureDirectory(canonicalPath);
	symlinkSync(resolved, join(canonicalPath, basename(resolved)));
	return { name, canonicalPath };
};

const classifyProviderConfig = (configPath: string, hook: HookCommand): Pick<HookSyncEntry, "status" | "detail"> => {
	try {
		const scriptExists = existsSync(hook.scriptPath);
		const config = readJsonConfig(configPath);
		const configured = hasHookCommand(config, hook.command);
		if (configured && scriptExists) return { status: "OK", detail: hook.command };
		if (configured && !scriptExists) return { status: "BROKEN", detail: `script missing: ${hook.scriptPath}` };
		if (!configured && scriptExists) return { status: "MISSING", detail: "SessionStart command missing" };
		return { status: "MISSING", detail: `script missing: ${hook.scriptPath}` };
	} catch (error) {
		return { status: "ERROR", detail: error instanceof Error ? error.message : String(error) };
	}
};

const expectedEntry = (
	name: string,
	scope: Exclude<SyncScope, "all">,
	provider: ProviderId,
	paths: RuntimePaths,
): HookSyncEntry => {
	const canonicalPath = hookCanonicalPath(name, scope, paths);
	const hook = expectedHookCommand(canonicalPath, name);
	const config = hookProviderConfig(provider, paths);
	return {
		kind: "hook",
		name,
		scope,
		provider,
		providerPath: config.configPath,
		targetPath: hook.scriptPath,
		...classifyProviderConfig(config.configPath, hook),
	};
};

const writeProviderHook = (
	name: string,
	scope: Exclude<SyncScope, "all">,
	provider: ProviderId,
	paths: RuntimePaths,
): HookSyncEntry => {
	const canonicalPath = hookCanonicalPath(name, scope, paths);
	const hook = expectedHookCommand(canonicalPath, name);
	const configInfo = hookProviderConfig(provider, paths);
	if (!existsSync(hook.scriptPath)) {
		return {
			kind: "hook",
			name,
			scope,
			provider,
			providerPath: configInfo.configPath,
			targetPath: hook.scriptPath,
			status: "BROKEN",
			detail: `script missing: ${hook.scriptPath}`,
		};
	}
	const config = readJsonConfig(configInfo.configPath);
	// @spec FR-003: Merge provider hook config - .specs/features/006-agent-sync-hooks/spec.md#fr-003
	appendHookCommand(config, hook);
	writeJsonConfig(configInfo.configPath, config);
	return expectedEntry(name, scope, provider, paths);
};

/**
 * Link a hook source into canonical storage and provider SessionStart configs.
 * @param pathOrName Source hook directory/file path or canonical hook name.
 * @param options Sync options controlling canonical scope and provider targets.
 * @returns Provider hook status entries after linking.
 */
export const linkHook = (pathOrName: string, options: SyncOptions = {}): readonly HookSyncEntry[] => {
	const paths = runtimePaths(options);
	const entries: HookSyncEntry[] = [];
	for (const scope of resolveScopes(options.scope ?? "global")) {
		const { name } = ensureCanonicalHook(pathOrName, scope, options);
		for (const provider of resolveProviders(options.targets ?? "all")) {
			entries.push(writeProviderHook(name, scope, provider.id, paths));
		}
	}
	return entries;
};

/**
 * List canonical hook names for the requested scope.
 * @param options Scope and filesystem root options.
 * @returns Canonical hook names.
 */
export const listHooks = (options: SyncOptions = {}): readonly string[] => {
	const paths = runtimePaths(options);
	const names = new Set<string>();
	for (const scope of resolveScopes(options.scope ?? "global")) {
		for (const name of listCanonicalHookNames(scope, paths)) {
			if (!options.name || name === options.name) names.add(name);
		}
	}
	return [...names].sort();
};

/**
 * Inspect canonical hooks and provider SessionStart config entries.
 * @param options Scope, target, and filesystem root options.
 * @returns Provider hook status entries.
 */
export const statusHooks = (options: SyncOptions = {}): readonly HookSyncEntry[] => {
	// @spec FR-004: Hook status lifecycle - .specs/features/006-agent-sync-hooks/spec.md#fr-004
	const paths = runtimePaths(options);
	const entries: HookSyncEntry[] = [];
	for (const scope of resolveScopes(options.scope ?? "all")) {
		for (const name of options.name ? [options.name] : listCanonicalHookNames(scope, paths)) {
			for (const provider of resolveProviders(options.targets ?? "all")) {
				entries.push(expectedEntry(name, scope, provider.id, paths));
			}
		}
	}
	return entries;
};

/**
 * Repair missing provider SessionStart config entries for canonical hooks.
 * @param options Scope, target, and dry-run options.
 * @returns Provider hook status entries.
 */
export const repairHooks = (options: SyncOptions = {}): readonly HookSyncEntry[] => {
	const before = statusHooks(options);
	if (options.dryRun) return before;
	const paths = runtimePaths(options);
	const repaired: HookSyncEntry[] = [];
	for (const entry of before) {
		if (entry.status === "MISSING") {
			repaired.push(writeProviderHook(entry.name, entry.scope, entry.provider, paths));
			continue;
		}
		repaired.push(entry);
	}
	return repaired;
};

/**
 * Publish every canonical hook for the selected scopes and providers.
 * @param options Scope and target options.
 * @returns Provider hook status entries.
 */
export const runHooks = (options: SyncOptions = {}): readonly HookSyncEntry[] => {
	// @spec FR-005: Hooks in aggregate sync - .specs/features/006-agent-sync-hooks/spec.md#fr-005
	const paths = runtimePaths(options);
	const entries: HookSyncEntry[] = [];
	for (const scope of resolveScopes(options.scope ?? "all")) {
		for (const name of listCanonicalHookNames(scope, paths)) {
			for (const provider of resolveProviders(options.targets ?? "all")) {
				entries.push(writeProviderHook(name, scope, provider.id, paths));
			}
		}
	}
	return entries;
};

/**
 * Remove provider config entries for one managed hook.
 * @param name Canonical hook name.
 * @param options Scope and target options.
 * @returns Provider config paths changed by the unlink.
 */
export const unlinkHook = (name: string, options: SyncOptions = {}): readonly string[] => {
	const paths = runtimePaths(options);
	const removed: string[] = [];
	for (const scope of resolveScopes(options.scope ?? "global")) {
		const canonicalPath = hookCanonicalPath(name, scope, paths);
		const hook = expectedHookCommand(canonicalPath, name);
		for (const provider of resolveProviders(options.targets ?? "all")) {
			const configInfo = hookProviderConfig(provider.id, paths);
			const config = readJsonConfig(configInfo.configPath);
			if (removeHookCommand(config, hook.command)) {
				writeJsonConfig(configInfo.configPath, config);
				removed.push(configInfo.configPath);
			}
		}
	}
	return removed;
};

export const formatHookEntries = (entries: readonly HookSyncEntry[]): string => {
	if (entries.length === 0) return "No hooks found.";
	return entries
		.map((entry) => {
			const detail = entry.detail ? ` (${entry.detail})` : "";
			return `${entry.kind}\t${entry.name}\t${entry.scope}\t${entry.provider}\t${entry.status}\t${entry.providerPath} -> ${entry.targetPath}${detail}`;
		})
		.join("\n");
};

export const featureSpecPath = FEATURE_SPEC;
