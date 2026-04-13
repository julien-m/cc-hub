/** Shared logic for managing Claude Code skills, commands, rules, and agents via symlinks. */
import { Command } from 'commander';
import { homedir } from 'os';
import { join, resolve, basename } from 'path';
import {
  lstatSync,
  readlinkSync,
  readdirSync,
  existsSync,
  readFileSync,
  symlinkSync,
  rmSync,
  mkdirSync,
  statSync,
} from 'fs';
import { createInterface } from 'readline';
import { exitCode } from '../errors.ts';

/**
 * Prompt the user for confirmation via stdin.
 * @param message - The question to display.
 * @returns True if the user confirmed.
 */
const confirm = (message: string): Promise<boolean> => {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((res) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      res(answer.toLowerCase() === 'y');
    });
  });
};

/**
 * Extract the name from a SKILL.md frontmatter.
 * @param filePath - Path to the SKILL.md file.
 * @returns The extracted name.
 * @throws {Error} When frontmatter is missing or lacks a name field.
 */
const extractNameFromFile = (filePath: string): string => {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error(`Invalid frontmatter in ${filePath} — expected YAML between --- delimiters`);
  }
  const nameMatch = match[1].match(/^name:\s*(.+)$/m);
  if (!nameMatch) {
    throw new Error(`Missing "name" field in frontmatter of ${filePath}`);
  }
  return nameMatch[1].trim();
};

export interface ClaudeLinkConfig {
  /** "skill" | "command" | "rule" | "agent" */
  type: 'skill' | 'command' | 'rule' | 'agent';
  /** Subdirectory in ~/.claude/ ("skills", "commands", "rules", "agents") */
  subdir: string;
  /** true = source is a directory (skill), false = source is a .md file */
  isDirectory: boolean;
  /** Extract the name from the source (for skill: frontmatter, for command/rule: filename) */
  extractName: (sourcePath: string) => string;
  /** Resolve source path from a simple name */
  resolveLocal: (name: string) => string;
}

/**
 * Get the global directory for a given config type.
 * @param config - The link configuration.
 * @returns Absolute path to the global directory.
 */
const globalDir = (config: ClaudeLinkConfig): string =>
  join(homedir(), '.claude', config.subdir);

/**
 * Resolve a user-provided path or name to an absolute source path.
 * @param pathOrName - A relative/absolute path or a simple name.
 * @param config - The link configuration.
 * @returns Absolute path to the source.
 * @throws {Error} When the resolved path does not exist.
 */
const resolvePath = (pathOrName: string, config: ClaudeLinkConfig): string => {
  if (pathOrName.includes('/') || pathOrName.startsWith('.')) {
    const abs = resolve(pathOrName);
    if (!existsSync(abs)) {
      throw new Error(`Path ${abs} does not exist`);
    }
    return abs;
  }
  const local = config.resolveLocal(pathOrName);
  if (!existsSync(local)) {
    throw new Error(
      `${config.type} "${pathOrName}" not found at ${local}`,
    );
  }
  return local;
};

/**
 * Determine the destination path and whether wrapping is needed.
 * @param source - Absolute path to the source.
 * @param config - The link configuration.
 * @param customName - Optional custom name override.
 * @returns Object with name, dest path, destDir, and needsWrap flag.
 */
const resolveDestination = (
  source: string,
  config: ClaudeLinkConfig,
  customName?: string,
): { name: string; dest: string; destDir: string; needsWrap: boolean } => {
  const sourceIsFile = statSync(source).isFile();
  const needsWrap = config.isDirectory && sourceIsFile;

  let name: string;
  if (customName) {
    // For file-based types (commands/rules), ensure .md extension
    name = !config.isDirectory && !customName.endsWith('.md')
      ? `${customName}.md`
      : customName;
  } else {
    name = needsWrap
      ? extractNameFromFile(source)
      : config.extractName(source);
  }

  const dest = needsWrap
    ? join(globalDir(config), name, 'SKILL.md')
    : join(globalDir(config), name);

  const destDir = needsWrap
    ? join(globalDir(config), name)
    : dest;

  return { name, dest, destDir, needsWrap };
};

/**
 * Handle an existing link/file at the destination, prompting the user to replace it.
 * @param destDir - The destination directory or file path.
 * @param dest - The exact symlink destination.
 * @param name - Display name of the item.
 * @param config - The link configuration.
 * @param needsWrap - Whether the source needs wrapping in a directory.
 * @returns True if we should proceed, false if cancelled.
 */
const handleExistingLink = async (
  destDir: string,
  dest: string,
  name: string,
  config: ClaudeLinkConfig,
  needsWrap: boolean,
): Promise<boolean> => {
  let destStat;
  try {
    destStat = lstatSync(destDir);
  } catch {
    // Does not exist
    return true;
  }

  const info = destStat.isSymbolicLink()
    ? `symlink -> ${readlinkSync(destDir)}`
    : config.isDirectory
      ? 'directory'
      : 'file';
  const ok = await confirm(
    `${config.type} "${name}" already exists (${info}). Replace?`,
  );
  if (!ok) {
    console.error('Cancelled.');
    return false;
  }
  if (needsWrap) {
    // Only remove the SKILL.md symlink, not the entire directory
    try { rmSync(dest, { force: true }); } catch { /* */ }
  } else {
    rmSync(destDir, { recursive: true, force: true });
  }
  return true;
};

/**
 * Create a symlink for the given source to the global Claude directory.
 * @param source - Absolute source path.
 * @param dest - Absolute destination path for the symlink.
 * @param name - Display name.
 * @param config - The link configuration.
 * @param needsWrap - Whether to wrap in a directory first.
 */
const createSymlink = (
  source: string,
  dest: string,
  name: string,
  config: ClaudeLinkConfig,
  needsWrap: boolean,
): void => {
  if (needsWrap) {
    mkdirSync(join(globalDir(config), name), { recursive: true });
  }
  symlinkSync(source, dest);
  console.error(`Linked ${name} -> ${dest} (symlink -> ${source})`);
};

/**
 * Link a skill/command/rule/agent to the global Claude directory.
 * @param pathOrName - Source path or name.
 * @param config - The link configuration.
 * @param customName - Optional custom name.
 */
const link = async (
  pathOrName: string,
  config: ClaudeLinkConfig,
  customName?: string,
): Promise<void> => {
  const source = resolvePath(pathOrName, config);
  const { name, dest, destDir, needsWrap } = resolveDestination(source, config, customName);

  const shouldProceed = await handleExistingLink(destDir, dest, name, config, needsWrap);
  if (!shouldProceed) return;

  createSymlink(source, dest, name, config, needsWrap);
};

/**
 * List all globally installed items of the given type.
 * @param config - The link configuration.
 */
const list = (config: ClaudeLinkConfig): void => {
  const dir = globalDir(config);
  if (!existsSync(dir)) {
    console.log(`No ${config.type} installed globally.`);
    return;
  }
  const entries = readdirSync(dir);
  if (entries.length === 0) {
    console.log(`No ${config.type} installed globally.`);
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    try {
      const stat = lstatSync(full);
      if (stat.isSymbolicLink()) {
        console.log(`${entry}\t-> symlink -> ${readlinkSync(full)}`);
      } else if (stat.isDirectory() || stat.isFile()) {
        console.log(`${entry}\t-> local`);
      }
    } catch {
      // skip
    }
  }
};

/**
 * Resolve the name to unlink from a path or name string.
 * @param nameOrPath - A name or path to resolve.
 * @param config - The link configuration.
 * @returns The resolved name.
 */
const resolveUnlinkName = (nameOrPath: string, config: ClaudeLinkConfig): string => {
  if (nameOrPath.includes('/') || nameOrPath.startsWith('.')) {
    const abs = resolve(nameOrPath);
    if (existsSync(abs)) {
      const isFile = statSync(abs).isFile();
      if (config.isDirectory && isFile) {
        return extractNameFromFile(abs);
      }
      if (config.isDirectory) {
        return config.extractName(abs);
      }
      return basename(abs);
    }
  }
  return nameOrPath;
};

/**
 * Unlink a skill/command/rule/agent from the global Claude directory.
 * @param nameOrPath - Name or path of the item to unlink.
 * @param config - The link configuration.
 */
const unlink = async (nameOrPath: string, config: ClaudeLinkConfig): Promise<void> => {
  const name = resolveUnlinkName(nameOrPath, config);
  const dest = join(globalDir(config), name);
  try {
    lstatSync(dest);
  } catch {
    console.error(
      `${config.type} "${name}" not found in ${globalDir(config)}`,
    );
    process.exit(2);
  }

  rmSync(dest, { recursive: true, force: true });
  console.error(`Removed ${name} from ${globalDir(config)}`);
};

/**
 * Create a Claude link command group (link/list/unlink) for the given type.
 * @param config - The link configuration defining the type behavior.
 * @returns The configured Commander command.
 */
export const createClaudeLinkCommand = (config: ClaudeLinkConfig): Command => {
  const cmd = new Command(config.type).description(
    `Manage globally installed Claude Code ${config.type}s`,
  );

  const linkCmd = cmd
    .command('link')
    .description(`Install a ${config.type} globally (symlink)`)
    .argument('<path>', `Path or name of the ${config.type}`)
    .option('-n, --name <name>', 'Custom name for the symlink');

  if (!config.isDirectory) {
    linkCmd.argument('[directory]', 'Associated directory to link as well');
  }

  linkCmd.action(async (path: string, ...args: unknown[]) => {
    try {
      const { name: customName } = linkCmd.opts<{ name?: string }>();
      const directory = !config.isDirectory && typeof args[0] === 'string'
        ? args[0]
        : undefined;
      await link(path, config, customName);
      if (typeof directory === 'string') {
        await link(directory, config);
      }
    } catch (err) {
      console.error(
        `Failed to link ${config.type}: ${(err as Error).message}`,
      );
      process.exit(1);
    }
  });

  cmd
    .command('list')
    .description(`List globally installed ${config.type}s`)
    .action(() => list(config));

  const unlinkCmd = cmd
    .command('unlink')
    .description(`Uninstall a global ${config.type}`)
    .argument('<name>', `Name of the ${config.type} to uninstall`);

  if (!config.isDirectory) {
    unlinkCmd.argument('[directory]', 'Associated directory to unlink as well');
  }

  unlinkCmd.action(async (name: string, directory?: string) => {
    try {
      await unlink(name, config);
      if (typeof directory === 'string') {
        await unlink(directory, config);
      }
    } catch (err) {
      console.error(
        `Failed to unlink ${config.type}: ${(err as Error).message}`,
      );
      process.exit(1);
    }
  });

  return cmd;
};

// --- Configs ---

export const skillConfig: ClaudeLinkConfig = {
  type: 'skill',
  subdir: 'skills',
  isDirectory: true,
  extractName(sourcePath: string): string {
    const skillMd = join(sourcePath, 'SKILL.md');
    if (!existsSync(skillMd)) {
      throw new Error(`No SKILL.md found in ${sourcePath}`);
    }
    const content = readFileSync(skillMd, 'utf-8');
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) {
      throw new Error(`Invalid frontmatter in ${skillMd}`);
    }
    const nameMatch = match[1].match(/^name:\s*(.+)$/m);
    if (!nameMatch) {
      throw new Error(
        `Missing "name" field in frontmatter of ${skillMd}`,
      );
    }
    return nameMatch[1].trim();
  },
  resolveLocal(name: string): string {
    return resolve('.claude', 'skills', name);
  },
};

export const commandConfig: ClaudeLinkConfig = {
  type: 'command',
  subdir: 'commands',
  isDirectory: false,
  extractName(sourcePath: string): string {
    return basename(sourcePath);
  },
  resolveLocal(name: string): string {
    const withExt = name.endsWith('.md') ? name : `${name}.md`;
    return resolve('.claude', 'commands', withExt);
  },
};

export const ruleConfig: ClaudeLinkConfig = {
  type: 'rule',
  subdir: 'rules',
  isDirectory: false,
  extractName(sourcePath: string): string {
    return basename(sourcePath);
  },
  resolveLocal(name: string): string {
    const withExt = name.endsWith('.md') ? name : `${name}.md`;
    return resolve('.claude', 'rules', withExt);
  },
};

export const agentConfig: ClaudeLinkConfig = {
  type: 'agent',
  subdir: 'agents',
  isDirectory: false,
  extractName(sourcePath: string): string {
    return basename(sourcePath);
  },
  resolveLocal(name: string): string {
    const withExt = name.endsWith('.md') ? name : `${name}.md`;
    return resolve('.claude', 'agents', withExt);
  },
};
