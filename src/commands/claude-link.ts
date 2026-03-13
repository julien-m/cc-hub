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
): Promise<void> {
  const source = resolvePath(pathOrName, config);
  const name = config.extractName(source);
  const dest = join(globalDir(config), name);

  let destStat;
  try {
    destStat = lstatSync(dest);
  } catch {
    // n'existe pas
  }
  if (destStat) {
    const info = destStat.isSymbolicLink()
      ? `symlink → ${readlinkSync(dest)}`
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
    rmSync(dest, { recursive: true, force: true });
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

async function unlink(name: string, config: ClaudeLinkConfig): Promise<void> {
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

  cmd
    .command('link')
    .description(`Installer un ${config.type} globalement (symlink)`)
    .argument('<path>', `Chemin ou nom du ${config.type}`)
    .action(async (path: string) => {
      try {
        await link(path, config);
      } catch (err) {
        console.error(`Erreur: ${(err as Error).message}`);
        process.exit(1);
      }
    });

  cmd
    .command('list')
    .description(`Lister les ${config.type}s installés globalement`)
    .action(() => list(config));

  cmd
    .command('unlink')
    .description(`Désinstaller un ${config.type} global`)
    .argument('<name>', `Nom du ${config.type} à désinstaller`)
    .action(async (name: string) => {
      try {
        await unlink(name, config);
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
