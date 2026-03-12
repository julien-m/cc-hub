import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import { CONFIG_PATH, ensureDirs } from '../utils/paths.ts';

export function getConfig(): Record<string, unknown> {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function saveConfig(config: Record<string, unknown>): void {
  ensureDirs();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

export function createConfigCommand(): Command {
  const config = new Command('config').description(
    'Gérer les préférences',
  );

  config
    .command('set <key> <value>')
    .description('Définir une préférence')
    .action((key: string, value: string) => {
      const cfg = getConfig();
      let parsed: unknown = value;
      if (value === 'true') parsed = true;
      else if (value === 'false') parsed = false;
      else if (/^\d+$/.test(value)) parsed = parseInt(value);

      cfg[key] = parsed;
      saveConfig(cfg);
      console.error(`✅ ${key} = ${JSON.stringify(parsed)}`);
    });

  config
    .command('show')
    .description('Afficher la configuration')
    .action(() => {
      const cfg = getConfig();
      if (Object.keys(cfg).length === 0) {
        console.log('Configuration vide.');
        return;
      }
      for (const [key, value] of Object.entries(cfg)) {
        console.log(`${key} = ${JSON.stringify(value)}`);
      }
    });

  return config;
}
