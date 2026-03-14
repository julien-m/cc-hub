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

function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((res) => {
    rl.question(`${message} (o/N) `, (answer) => {
      rl.close();
      res(answer.toLowerCase() === 'o' || answer.toLowerCase() === 'y');
    });
  });
}

/** Extrait le nom depuis le frontmatter d'un fichier SKILL.md */
function extractNameFromFile(filePath: string): string {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error(`Frontmatter invalide dans ${filePath}`);
  }
  const nameMatch = match[1].match(/^name:\s*(.+)$/m);
  if (!nameMatch) {
    throw new Error(`Champ "name" manquant dans le frontmatter de ${filePath}`);
  }
  return nameMatch[1].trim();
}

export interface ClaudeLinkConfig {
  /** "skill" | "command" | "rule" */
  type: string;
  /** Sous-dossier dans ~/.claude/ ("skills", "commands", "rules") */
  subdir: string;
  /** true = source est un dossier (skill), false = source est un fichier .md */
  isDirectory: boolean;
  /** Extrait le nom depuis la source (pour skill: frontmatter, pour command/rule: filename) */
  extractName: (sourcePath: string) => string;
  /** Résout le chemin source depuis un nom simple */
  resolveLocal: (name: string) => string;
}

function globalDir(config: ClaudeLinkConfig): string {
  return join(homedir(), '.claude', config.subdir);
}

function resolvePath(pathOrName: string, config: ClaudeLinkConfig): string {
  if (pathOrName.includes('/') || pathOrName.startsWith('.')) {
    const abs = resolve(pathOrName);
    if (!existsSync(abs)) {
      throw new Error(`Le chemin ${abs} n'existe pas`);
    }
    return abs;
  }
  const local = config.resolveLocal(pathOrName);
  if (!existsSync(local)) {
    throw new Error(
      `${config.type} "${pathOrName}" introuvable dans ${local}`,
    );
  }
  return local;
}

async function link(
  pathOrName: string,
  config: ClaudeLinkConfig,
  customName?: string,
): Promise<void> {
  const source = resolvePath(pathOrName, config);

  // Skills: si la source est un fichier (SKILL.md), on crée le dossier
  // et on symlinke le fichier à l'intérieur
  const sourceIsFile = statSync(source).isFile();
  const needsWrap = config.isDirectory && sourceIsFile;

  let name: string;
  if (customName) {
    // For file-based types (commands/rules), ensure .md extension
    if (!config.isDirectory && !customName.endsWith('.md')) {
      name = `${customName}.md`;
    } else {
      name = customName;
    }
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

  let destStat;
  try {
    destStat = lstatSync(destDir);
  } catch {
    // n'existe pas
  }
  if (destStat) {
    const info = destStat.isSymbolicLink()
      ? `symlink → ${readlinkSync(destDir)}`
      : config.isDirectory
        ? 'dossier'
        : 'fichier';
    const ok = await confirm(
      `${config.type} "${name}" existe déjà (${info}). Remplacer ?`,
    );
    if (!ok) {
      console.error('Annulé.');
      return;
    }
    if (needsWrap) {
      // Ne supprimer que le symlink SKILL.md, pas le dossier entier
      // au cas où il contient d'autres fichiers
      try { rmSync(dest, { force: true }); } catch { /* */ }
    } else {
      rmSync(destDir, { recursive: true, force: true });
    }
  }

  if (needsWrap) {
    mkdirSync(join(globalDir(config), name), { recursive: true });
  }

  symlinkSync(source, dest);
  console.error(`Lié ${name} → ${dest} (symlink → ${source})`);
}

function list(config: ClaudeLinkConfig): void {
  const dir = globalDir(config);
  if (!existsSync(dir)) {
    console.log(`Aucun ${config.type} installé globalement.`);
    return;
  }
  const entries = readdirSync(dir);
  if (entries.length === 0) {
    console.log(`Aucun ${config.type} installé globalement.`);
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    try {
      const stat = lstatSync(full);
      if (stat.isSymbolicLink()) {
        console.log(`${entry}\t→ symlink → ${readlinkSync(full)}`);
      } else if (stat.isDirectory() || stat.isFile()) {
        console.log(`${entry}\t→ local`);
      }
    } catch {
      // skip
    }
  }
}

function resolveUnlinkName(nameOrPath: string, config: ClaudeLinkConfig): string {
  // Si c'est un chemin (contient / ou commence par .), on résout le nom
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
}

async function unlink(nameOrPath: string, config: ClaudeLinkConfig): Promise<void> {
  const name = resolveUnlinkName(nameOrPath, config);
  const dest = join(globalDir(config), name);
  try {
    lstatSync(dest);
  } catch {
    console.error(
      `${config.type} "${name}" non trouvé dans ${globalDir(config)}`,
    );
    process.exit(2);
  }

  rmSync(dest, { recursive: true, force: true });
  console.error(`Supprimé ${name} de ${globalDir(config)}`);
}

export function createClaudeLinkCommand(config: ClaudeLinkConfig): Command {
  const cmd = new Command(config.type).description(
    `Gérer les ${config.type}s Claude Code installés globalement`,
  );

  const linkCmd = cmd
    .command('link')
    .description(`Installer un ${config.type} globalement (symlink)`)
    .argument('<path>', `Chemin ou nom du ${config.type}`)
    .option('--name <name>', 'Nom personnalisé pour le symlink');

  if (!config.isDirectory) {
    linkCmd.argument('[directory]', 'Répertoire associé à linker aussi');
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
      console.error(`Erreur: ${(err as Error).message}`);
      process.exit(1);
    }
  });

  cmd
    .command('list')
    .description(`Lister les ${config.type}s installés globalement`)
    .action(() => list(config));

  const unlinkCmd = cmd
    .command('unlink')
    .description(`Désinstaller un ${config.type} global`)
    .argument('<name>', `Nom du ${config.type} à désinstaller`);

  if (!config.isDirectory) {
    unlinkCmd.argument('[directory]', 'Répertoire associé à unliker aussi');
  }

  unlinkCmd.action(async (name: string, directory?: string) => {
    try {
      await unlink(name, config);
      if (typeof directory === 'string') {
        await unlink(directory, config);
      }
    } catch (err) {
      console.error(`Erreur: ${(err as Error).message}`);
      process.exit(1);
    }
  });

  return cmd;
}

// --- Configs ---

export const skillConfig: ClaudeLinkConfig = {
  type: 'skill',
  subdir: 'skills',
  isDirectory: true,
  extractName(sourcePath: string): string {
    const skillMd = join(sourcePath, 'SKILL.md');
    if (!existsSync(skillMd)) {
      throw new Error(`Pas de SKILL.md trouvé dans ${sourcePath}`);
    }
    const content = readFileSync(skillMd, 'utf-8');
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) {
      throw new Error(`Frontmatter invalide dans ${skillMd}`);
    }
    const nameMatch = match[1].match(/^name:\s*(.+)$/m);
    if (!nameMatch) {
      throw new Error(
        `Champ "name" manquant dans le frontmatter de ${skillMd}`,
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
