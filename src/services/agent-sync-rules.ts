/** Portable rule synchronization for Claude and Codex provider outputs. */

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
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { type ProviderId, resolveProviders, resolveScopes, type SyncOptions, type SyncScope } from "./agent-sync.ts";

export type RuleSyncStatus = "OK" | "MISSING" | "BROKEN" | "LOCAL" | "ERROR";

export interface RuleSyncOptions extends SyncOptions {
	readonly namespace?: string;
}

export interface RuleSyncEntry {
	readonly kind: "rule";
	readonly name: string;
	readonly scope: Exclude<SyncScope, "all">;
	readonly provider: ProviderId;
	readonly providerPath: string;
	readonly targetPath: string;
	readonly status: RuleSyncStatus;
	readonly detail?: string;
}

interface RuntimePaths {
	readonly projectDir: string;
	readonly homeDir: string;
	readonly agentSyncRoot?: string;
}

interface CanonicalRule {
	readonly name: string;
	readonly relativePath: string;
	readonly canonicalPath: string;
	readonly content: string;
	readonly paths: readonly string[];
	readonly body: string;
}

const FEATURE_SPEC = ".specs/features/004-portable-agent-sync-rules/spec.md";

const runtimePaths = (options: RuleSyncOptions = {}): RuntimePaths => {
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
	// @spec FR-001: Canonical rule roots — .specs/features/004-portable-agent-sync-rules/spec.md#fr-001
	join(
		paths.agentSyncRoot ??
			(scope === "project" ? join(paths.projectDir, ".agent-sync") : join(paths.homeDir, ".agent-sync")),
		"rules",
	);

const claudeRulesRoot = (scope: Exclude<SyncScope, "all">, paths: RuntimePaths): string =>
	scope === "project" ? join(paths.projectDir, ".claude", "rules") : join(paths.homeDir, ".claude", "rules");

const codexAgentsPath = (scope: Exclude<SyncScope, "all">, paths: RuntimePaths): string =>
	scope === "project" ? join(paths.projectDir, "AGENTS.md") : join(paths.homeDir, ".codex", "AGENTS.md");

const markerName = (scope: Exclude<SyncScope, "all">): string => `${scope}-rules`;

const startMarker = (scope: Exclude<SyncScope, "all">): string => `<!-- cc-hub:${markerName(scope)}:start -->`;

const endMarker = (scope: Exclude<SyncScope, "all">): string => `<!-- cc-hub:${markerName(scope)}:end -->`;

const ensureDirectory = (path: string): void => {
	mkdirSync(path, { recursive: true });
};

const withMdExtension = (value: string): string => (value.endsWith(".md") ? value : `${value}.md`);

const resolveInputPath = (path: string, paths: RuntimePaths): string => {
	const resolved = isAbsolute(path) ? path : resolve(paths.projectDir, path);
	if (!existsSync(resolved)) throw new Error(`Path ${resolved} does not exist`);
	return resolved;
};

const normalizeNamespace = (namespace: string | undefined): string | undefined => {
	if (!namespace) return undefined;
	const normalized = namespace
		.split("/")
		.map((segment) => segment.trim())
		.filter(Boolean)
		.join("/");
	if (!normalized || normalized.includes("..")) {
		throw new Error(`Invalid namespace "${namespace}"`);
	}
	return normalized;
};

const walkMarkdownFiles = (root: string): readonly string[] => {
	if (!existsSync(root)) return [];
	const files: string[] = [];
	const visit = (dir: string): void => {
		for (const entry of readdirSync(dir).sort()) {
			const path = join(dir, entry);
			const stat = lstatSync(path);
			if (stat.isDirectory()) {
				visit(path);
				continue;
			}
			if ((stat.isFile() || stat.isSymbolicLink()) && path.endsWith(".md")) files.push(path);
		}
	};
	visit(root);
	return files;
};

const parseRuleContent = (content: string): { paths: readonly string[]; body: string } => {
	const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
	if (!match) return { paths: [], body: content.trimEnd() };
	const paths: string[] = [];
	let inPaths = false;
	for (const rawLine of match[1].split("\n")) {
		const line = rawLine.trim();
		const keyValue = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
		if (keyValue) {
			inPaths = keyValue[1] === "paths";
			const inlineValue = keyValue[2].trim();
			if (inPaths && inlineValue.startsWith("[") && inlineValue.endsWith("]")) {
				paths.push(
					...inlineValue
						.slice(1, -1)
						.split(",")
						.map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
						.filter(Boolean),
				);
			}
			continue;
		}
		const listValue = line.match(/^-\s*(.+)$/)?.[1];
		if (inPaths && listValue) paths.push(listValue.trim().replace(/^['"]|['"]$/g, ""));
	}
	return { paths, body: content.slice(match[0].length).trimEnd() };
};

const readCanonicalRules = (scope: Exclude<SyncScope, "all">, paths: RuntimePaths): readonly CanonicalRule[] => {
	const root = canonicalRoot(scope, paths);
	return walkMarkdownFiles(root).map((canonicalPath) => {
		const relativePath = relative(root, canonicalPath);
		const content = readFileSync(canonicalPath, "utf-8").trimEnd();
		const parsed = parseRuleContent(content);
		const name = relativePath.slice(0, -extname(relativePath).length);
		return { name, relativePath, canonicalPath, content, ...parsed };
	});
};

const removeIfAllowed = (path: string, force: boolean | undefined): void => {
	if (!existsSync(path)) return;
	const stat = lstatSync(path);
	if (!stat.isSymbolicLink() && !force) {
		throw new Error(`${path} already exists and is not a symlink. Re-run with --force to replace it.`);
	}
	rmSync(path, { recursive: true, force: true });
};

const createSymlink = (sourcePath: string, canonicalPath: string, force: boolean | undefined): void => {
	removeIfAllowed(canonicalPath, force);
	ensureDirectory(dirname(canonicalPath));
	symlinkSync(sourcePath, canonicalPath);
};

const lstatIfExists = (path: string): ReturnType<typeof lstatSync> | undefined => {
	try {
		return lstatSync(path);
	} catch (error) {
		const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
		// Missing parent paths are normal for status checks; other filesystem errors must surface.
		if (code === "ENOENT" || code === "ENOTDIR") return undefined;
		throw error;
	}
};

const resolvedSymlinkTarget = (linkPath: string, linkTarget: string): string =>
	isAbsolute(linkTarget) ? resolve(linkTarget) : resolve(dirname(linkPath), linkTarget);

const isExpectedSymlinkTarget = (linkPath: string, linkTarget: string, expectedTarget: string): boolean =>
	resolvedSymlinkTarget(linkPath, linkTarget) === resolve(expectedTarget);

const isOldClaudeRuleCopy = (providerContent: string, ruleContent: string): boolean =>
	providerContent === ruleContent || providerContent === `${ruleContent}\n`;

const createClaudeRuleSymlink = (
	rule: CanonicalRule,
	providerPath: string,
	force: boolean | undefined,
): Pick<RuleSyncEntry, "status" | "detail"> => {
	// Claude publishing is strict: keep expected symlinks, convert legacy copies, and replace conflicts only with force.
	const stat = lstatIfExists(providerPath);
	if (stat) {
		if (stat.isSymbolicLink()) {
			const linkTarget = readlinkSync(providerPath);
			if (isExpectedSymlinkTarget(providerPath, linkTarget, rule.canonicalPath)) {
				return { status: "OK", detail: `symlink -> ${linkTarget}` };
			}
			if (!force) {
				return { status: "ERROR", detail: `symlink points to ${linkTarget}, expected ${rule.canonicalPath}` };
			}
			rmSync(providerPath, { force: true });
		} else if (stat.isFile() && (force || isOldClaudeRuleCopy(readFileSync(providerPath, "utf-8"), rule.content))) {
			rmSync(providerPath, { force: true });
		} else {
			return { status: "LOCAL", detail: "provider path exists but is not the expected symlink" };
		}
	}
	ensureDirectory(dirname(providerPath));
	symlinkSync(rule.canonicalPath, providerPath);
	return { status: "OK", detail: `symlink -> ${rule.canonicalPath}` };
};

const classifyClaudeRuleSymlink = (
	providerPath: string,
	targetPath: string,
): Pick<RuleSyncEntry, "status" | "detail"> => {
	// @spec FR-013: Validate Claude symlink target — .specs/features/004-portable-agent-sync-rules/spec.md#fr-013
	const stat = lstatIfExists(providerPath);
	if (!stat) return { status: "MISSING" };
	try {
		if (!stat.isSymbolicLink()) {
			return { status: "LOCAL", detail: "provider path exists but is not a symlink" };
		}
		const linkTarget = readlinkSync(providerPath);
		const resolvedTarget = resolvedSymlinkTarget(providerPath, linkTarget);
		if (!existsSync(resolvedTarget)) {
			return { status: "BROKEN", detail: `symlink -> ${linkTarget}` };
		}
		if (isExpectedSymlinkTarget(providerPath, linkTarget, targetPath))
			return { status: "OK", detail: `symlink -> ${linkTarget}` };
		return { status: "ERROR", detail: `symlink points to ${linkTarget}, expected ${targetPath}` };
	} catch (error) {
		return { status: "ERROR", detail: error instanceof Error ? error.message : String(error) };
	}
};

const classifyGeneratedFile = (providerPath: string): Pick<RuleSyncEntry, "status" | "detail"> => {
	if (!existsSync(providerPath)) return { status: "MISSING" };
	try {
		const stat = lstatSync(providerPath);
		if (stat.isSymbolicLink()) {
			try {
				statSync(providerPath);
				return { status: "OK", detail: `symlink -> ${readlinkSync(providerPath)}` };
			} catch {
				return { status: "BROKEN", detail: "symlink target does not exist" };
			}
		}
		return stat.isFile() ? { status: "OK" } : { status: "LOCAL", detail: "path exists but is not a file" };
	} catch (error) {
		return { status: "ERROR", detail: error instanceof Error ? error.message : String(error) };
	}
};

const writeClaudeRules = (
	rules: readonly CanonicalRule[],
	scope: Exclude<SyncScope, "all">,
	paths: RuntimePaths,
	options: RuleSyncOptions,
): readonly RuleSyncEntry[] => {
	// @spec FR-002: Link Claude rules, FR-009: Preserve paths — .specs/features/004-portable-agent-sync-rules/spec.md#fr-002
	const root = claudeRulesRoot(scope, paths);
	const entries: RuleSyncEntry[] = [];
	for (const rule of rules) {
		const providerPath = join(root, rule.relativePath);
		entries.push({
			kind: "rule",
			name: rule.name,
			scope,
			provider: "claude",
			providerPath,
			targetPath: rule.canonicalPath,
			...createClaudeRuleSymlink(rule, providerPath, options.force),
		});
	}
	return entries;
};

const renderCodexRule = (rule: CanonicalRule): string => {
	const lines = [`### ${rule.name}`, "", `Source: \`${rule.relativePath}\``];
	if (rule.paths.length > 0) {
		lines.push("", "Path guidance:");
		for (const path of rule.paths) lines.push(`- When modifying \`${path}\`, apply this rule.`);
	}
	lines.push("", rule.body.trimEnd());
	return lines.join("\n").trimEnd();
};

const renderCodexBlock = (rules: readonly CanonicalRule[], scope: Exclude<SyncScope, "all">): string => {
	const title = scope === "project" ? "Shared Project Agent Rules" : "Shared Global Agent Rules";
	const renderedRules = rules.length > 0 ? rules.map(renderCodexRule).join("\n\n") : "_No canonical rules found._";
	return [
		startMarker(scope),
		"Generated by cc-hub from canonical `.agent-sync/rules`. Do not edit this block manually.",
		"",
		`## ${title}`,
		"",
		renderedRules,
		endMarker(scope),
		"",
	].join("\n");
};

const replaceManagedBlock = (existing: string, block: string, scope: Exclude<SyncScope, "all">): string => {
	// @spec FR-003: Generate Codex block, FR-004: Preserve manual content — .specs/features/004-portable-agent-sync-rules/spec.md#fr-003
	const start = startMarker(scope);
	const end = endMarker(scope);
	const startIndex = existing.indexOf(start);
	const endIndex = existing.indexOf(end);
	if (startIndex >= 0 && endIndex > startIndex) {
		const afterEnd = endIndex + end.length;
		const updated =
			`${existing.slice(0, startIndex).trimEnd()}\n\n${block}${existing.slice(afterEnd).trimStart()}`.trimEnd();
		return `${updated}\n`;
	}
	const prefix = existing.trimEnd();
	return prefix ? `${prefix}\n\n${block}` : block;
};

const writeCodexRules = (
	rules: readonly CanonicalRule[],
	scope: Exclude<SyncScope, "all">,
	paths: RuntimePaths,
): RuleSyncEntry => {
	const providerPath = codexAgentsPath(scope, paths);
	ensureDirectory(dirname(providerPath));
	const existing = existsSync(providerPath) ? readFileSync(providerPath, "utf-8") : "";
	writeFileSync(providerPath, replaceManagedBlock(existing, renderCodexBlock(rules, scope), scope));
	return {
		kind: "rule",
		name: markerName(scope),
		scope,
		provider: "codex",
		providerPath,
		targetPath: canonicalRoot(scope, paths),
		...classifyGeneratedFile(providerPath),
	};
};

/**
 * Build generated provider rule outputs from canonical rule roots.
 * @param options Scope, target, and filesystem root options.
 * @returns Provider output status entries.
 */
export const buildRules = (options: RuleSyncOptions = {}): readonly RuleSyncEntry[] => {
	const paths = runtimePaths(options);
	const entries: RuleSyncEntry[] = [];
	for (const scope of resolveScopes(options.scope ?? "global")) {
		const rules = readCanonicalRules(scope, paths);
		const providers = resolveProviders(options.targets ?? "all");
		if (providers.some((provider) => provider.id === "claude")) {
			entries.push(...writeClaudeRules(rules, scope, paths, options));
		}
		if (providers.some((provider) => provider.id === "codex")) {
			entries.push(writeCodexRules(rules, scope, paths));
		}
	}
	return entries;
};

/**
 * Link one rule file into canonical rule roots and rebuild requested outputs.
 * @param pathOrName Rule source path or existing canonical rule name.
 * @param options Scope, target, namespace, and filesystem root options.
 * @returns Provider output status entries.
 */
export const linkRule = (pathOrName: string, options: RuleSyncOptions = {}): readonly RuleSyncEntry[] => {
	// @spec FR-005: Link one rule, FR-006: Global namespace — .specs/features/004-portable-agent-sync-rules/spec.md#fr-005
	const paths = runtimePaths(options);
	const sourcePath = resolveInputPath(pathOrName, paths);
	const sourceName = withMdExtension(options.name ?? basename(sourcePath, extname(sourcePath)));
	for (const scope of resolveScopes(options.scope ?? "global")) {
		const namespace = scope === "global" ? normalizeNamespace(options.namespace) : undefined;
		const canonicalPath = join(canonicalRoot(scope, paths), ...(namespace ? [namespace] : []), sourceName);
		if (resolve(sourcePath) !== resolve(canonicalPath)) createSymlink(sourcePath, canonicalPath, options.force);
	}
	return buildRules(options);
};

/**
 * List canonical rule names for the requested scopes.
 * @param options Scope and filesystem root options.
 * @returns Canonical rule names.
 */
export const listRules = (options: RuleSyncOptions = {}): readonly string[] => {
	// @spec FR-010: Rule list/status/unlink — .specs/features/004-portable-agent-sync-rules/spec.md#fr-010
	const paths = runtimePaths(options);
	return resolveScopes(options.scope ?? "global").flatMap((scope) =>
		readCanonicalRules(scope, paths).map((rule) => `${scope}:${rule.name}`),
	);
};

/**
 * Inspect generated provider rule outputs without writing.
 * @param options Scope, target, and filesystem root options.
 * @returns Provider output status entries.
 */
export const statusRules = (options: RuleSyncOptions = {}): readonly RuleSyncEntry[] => {
	// @spec FR-010: Rule list/status/unlink — .specs/features/004-portable-agent-sync-rules/spec.md#fr-010
	const paths = runtimePaths(options);
	const entries: RuleSyncEntry[] = [];
	for (const scope of resolveScopes(options.scope ?? "all")) {
		const rules = readCanonicalRules(scope, paths);
		const providers = resolveProviders(options.targets ?? "all");
		if (providers.some((provider) => provider.id === "claude")) {
			for (const rule of rules) {
				const providerPath = join(claudeRulesRoot(scope, paths), rule.relativePath);
				entries.push({
					kind: "rule",
					name: rule.name,
					scope,
					provider: "claude",
					providerPath,
					targetPath: rule.canonicalPath,
					...classifyClaudeRuleSymlink(providerPath, rule.canonicalPath),
				});
			}
		}
		if (providers.some((provider) => provider.id === "codex")) {
			const providerPath = codexAgentsPath(scope, paths);
			entries.push({
				kind: "rule",
				name: markerName(scope),
				scope,
				provider: "codex",
				providerPath,
				targetPath: canonicalRoot(scope, paths),
				...classifyGeneratedFile(providerPath),
			});
		}
	}
	return entries;
};

/**
 * Repair generated rule outputs.
 * @param options Scope, target, and filesystem root options.
 * @returns Provider output status entries.
 * @remarks Non-dry-run repair passes `force: true`, so it may replace conflicting Claude provider files or symlinks.
 */
export const repairRules = (options: RuleSyncOptions = {}): readonly RuleSyncEntry[] => {
	return options.dryRun ? statusRules(options) : buildRules({ ...options, force: true });
};

/**
 * Remove one canonical rule and rebuild generated outputs.
 * @param name Rule name, with optional namespace and optional `.md`.
 * @param options Scope, target, and filesystem root options.
 * @returns Provider output status entries after removal.
 */
export const unlinkRule = (name: string, options: RuleSyncOptions = {}): readonly RuleSyncEntry[] => {
	// @spec FR-010: Rule list/status/unlink — .specs/features/004-portable-agent-sync-rules/spec.md#fr-010
	const paths = runtimePaths(options);
	const ruleName = withMdExtension(name);
	for (const scope of resolveScopes(options.scope ?? "global")) {
		const canonicalPath = join(canonicalRoot(scope, paths), ruleName);
		rmSync(canonicalPath, { force: true });
		rmSync(join(claudeRulesRoot(scope, paths), ruleName), { force: true });
	}
	return buildRules(options);
};

export const featureSpecPath = FEATURE_SPEC;
