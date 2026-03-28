/** Command handler for managing user preferences. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { Command } from 'commander';
import { CONFIG_PATH, ensureDirs } from '../infra/paths.ts';

/**
 * Load the configuration object from disk.
 * @returns The parsed config, or an empty object if the file is missing or invalid.
 */
export const getConfig = (): Record<string, unknown> => {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as Record<string, unknown>;
  } catch {
    return {};
  }
};

/**
 * Persist the configuration object to disk.
 * @param config - The configuration to save.
 */
const saveConfig = (config: Record<string, unknown>): void => {
  ensureDirs();
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
};

/**
 * Create the `config` command group.
 * @returns The configured Commander command.
 */
export const createConfigCommand = (): Command => {
  const config = new Command('config').description(
    'Manage preferences',
  );

  config
    .command('set <key> <value>')
    .description('Set a preference')
    .action((key: string, value: string) => {
      const cfg = getConfig();
      let parsed: unknown = value;
      if (value === 'true') parsed = true;
      else if (value === 'false') parsed = false;
      else if (/^\d+$/.test(value)) parsed = parseInt(value);

      cfg[key] = parsed;
      saveConfig(cfg);
      console.error(`${key} = ${JSON.stringify(parsed)}`);
    });

  config
    .command('show')
    .description('Show the configuration')
    .action(() => {
      const cfg = getConfig();
      if (Object.keys(cfg).length === 0) {
        console.log('Configuration is empty.');
        return;
      }
      for (const [key, value] of Object.entries(cfg)) {
        console.log(`${key} = ${JSON.stringify(value)}`);
      }
    });

  return config;
};
