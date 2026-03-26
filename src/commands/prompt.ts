import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Command } from 'commander';
import { PROMPTS_DIR, ensureDirs } from '../utils/paths.ts';
import { getConfig } from './config.ts';
import { modelToSlug } from '../services/models.ts';
import { VALID_TYPES, type ModelType } from '../data/models.ts';

function slugToPath(slug: string): string {
  return join(PROMPTS_DIR, `${slug}.md`);
}

const FALLBACK_MODEL_BY_TYPE: Record<ModelType, string> = {
  text: 'anthropic/claude-opus-4.6',
  image: 'google/gemini-3.1-flash-image',
  video: 'kuaishou/kling-3.0-pro',
  audio: 'soniox/soniox',
};

function getDefaultModel(type: ModelType): string {
  const cfg = getConfig();
  const configKey = `prompt.default.${type}`;
  const fromConfig = cfg[configKey];
  if (typeof fromConfig === 'string' && fromConfig.length > 0) return fromConfig;
  return FALLBACK_MODEL_BY_TYPE[type];
}

function validateModelType(type: string): asserts type is ModelType {
  if (!VALID_TYPES.includes(type as ModelType)) {
    throw new Error(`Type invalide: "${type}". Valeurs acceptées: ${VALID_TYPES.join(', ')}`);
  }
}

function extractTypeFromGuide(filePath: string): string | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const match = content.match(/^type:\s*(.+)$/m);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

export function createPromptCommand(): Command {
  const prompt = new Command('prompt').description(
    'Gérer les guides de prompting par modèle',
  );

  prompt
    .command('get')
    .description('Afficher le guide de prompting pour un modèle ou un type')
    .option('--model <model>', 'Modèle (ex: anthropic/claude-opus-4.6)')
    .option('--type <type>', 'Type (text, image, video, audio) — utilise le modèle par défaut du type')
    .action((opts: { model?: string; type?: string }) => {
      if (!opts.model && !opts.type) {
        console.error('⚠️  Précise --model ou --type');
        console.error('   Exemples :');
        console.error('     cc-hub prompt get --model "anthropic/claude-opus-4.6"');
        console.error('     cc-hub prompt get --type text');
        process.exit(1);
      }

      let model: string;
      if (opts.model) {
        model = opts.model;
      } else {
        validateModelType(opts.type!);
        model = getDefaultModel(opts.type! as ModelType);
        console.error(`📎 Type "${opts.type}" → modèle par défaut : ${model}`);
        console.error(`   (modifiable : cc-hub config set prompt.default.${opts.type} "autre/modele")`);
      }

      const slug = modelToSlug(model);
      const filePath = slugToPath(slug);

      if (!existsSync(filePath)) {
        console.error(`⚠️  Aucun guide trouvé pour ${model}`);
        console.error(`   → Utilise le skill /prompt-guide pour en générer un`);
        process.exit(2);
      }

      console.log(readFileSync(filePath, 'utf-8'));
    });

  prompt
    .command('list')
    .description('Lister les guides disponibles')
    .option('--type <type>', 'Filtrer par type (text, image, video, audio)')
    .action((opts: { type?: string }) => {
      ensureDirs();
      if (opts.type) validateModelType(opts.type);

      const files = readdirSync(PROMPTS_DIR).filter((f) => f.endsWith('.md'));

      if (files.length === 0) {
        console.log('Aucun guide disponible.');
        console.log('   → Utilise le skill /prompt-guide pour en générer');
        return;
      }

      let count = 0;
      for (const file of files) {
        const name = file.replace('.md', '');
        const fullPath = join(PROMPTS_DIR, file);
        const type = extractTypeFromGuide(fullPath) || '?';

        if (opts.type && type !== opts.type) continue;

        const stat = statSync(fullPath);
        const updated = stat.mtime.toLocaleDateString('fr-FR');
        const isDefault = VALID_TYPES.some(
          (t) => type === t && modelToSlug(getDefaultModel(t as ModelType)) === name,
        );
        const marker = isDefault ? ' ★' : '';
        console.log(`${name.padEnd(35)} [${type.padEnd(5)}] (mis à jour le ${updated})${marker}`);
        count++;
      }

      if (opts.type && count === 0) {
        console.log(`Aucun guide de type "${opts.type}".`);
      }
    });

  return prompt;
}
