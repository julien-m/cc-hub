import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Command } from 'commander';
import { PROMPTS_DIR, ensureDirs } from '../utils/paths.ts';
import { askLLM } from '../services/openrouter.ts';

function modelToSlug(model: string): string {
  return model.replace(/\//g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase();
}

function slugToPath(slug: string): string {
  return join(PROMPTS_DIR, `${slug}.md`);
}

export function createPromptCommand(): Command {
  const prompt = new Command('prompt').description(
    'Guides de prompting par modèle',
  );

  prompt
    .command('get')
    .description('Afficher le guide de prompting pour un modèle')
    .requiredOption('--model <model>', 'Modèle (ex: openai/gpt-4o)')
    .action((opts: { model: string }) => {
      const slug = modelToSlug(opts.model);
      const filePath = slugToPath(slug);

      if (!existsSync(filePath)) {
        console.error(`⚠️  Aucun guide trouvé pour ${opts.model}`);
        console.error(`   → Lance : cc-hub prompt init --model ${opts.model}`);
        process.exit(2);
      }

      console.log(readFileSync(filePath, 'utf-8'));
    });

  prompt
    .command('init')
    .description('Générer un guide de prompting pour un modèle')
    .requiredOption('--model <model>', 'Modèle (ex: openai/gpt-4o)')
    .action(async (opts: { model: string }) => {
      try {
        const slug = modelToSlug(opts.model);
        const filePath = slugToPath(slug);

        if (existsSync(filePath)) {
          console.error(`⚠️  Un guide existe déjà pour ${opts.model}`);
          console.error(`   → Utilise : cc-hub prompt update --model ${opts.model}`);
          process.exit(1);
        }

        await generatePromptGuide(opts.model, filePath);
      } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        process.exit(4);
      }
    });

  prompt
    .command('list')
    .description('Lister les guides disponibles')
    .action(() => {
      ensureDirs();
      const files = readdirSync(PROMPTS_DIR).filter((f) => f.endsWith('.md'));

      if (files.length === 0) {
        console.log('Aucun guide disponible.');
        console.log('   → Lance : cc-hub prompt init --model <model>');
        return;
      }

      for (const file of files) {
        const name = file.replace('.md', '');
        const fullPath = join(PROMPTS_DIR, file);
        const stat = statSync(fullPath);
        const updated = stat.mtime.toLocaleDateString('fr-FR');
        console.log(`${name.padEnd(35)} (mis à jour le ${updated})`);
      }
    });

  prompt
    .command('update')
    .description("Mettre à jour un guide existant")
    .requiredOption('--model <model>', 'Modèle (ex: openai/gpt-4o)')
    .action(async (opts: { model: string }) => {
      try {
        const slug = modelToSlug(opts.model);
        const filePath = slugToPath(slug);

        if (!existsSync(filePath)) {
          console.error(`⚠️  Aucun guide trouvé pour ${opts.model}`);
          console.error(`   → Lance : cc-hub prompt init --model ${opts.model}`);
          process.exit(2);
        }

        await generatePromptGuide(opts.model, filePath);
      } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        process.exit(4);
      }
    });

  return prompt;
}

async function generatePromptGuide(model: string, filePath: string): Promise<void> {
  console.error(`🧠 Génération du guide de prompting pour ${model}...`);

  const guidePrompt = `You are an expert prompt engineer. Generate a comprehensive prompting guide for the model "${model}".

The guide should be a Markdown document with these sections:

1. **Model Overview** — What the model excels at, its strengths and limitations
2. **Key Principles** — The most important prompting principles for this specific model
3. **Recommended Prompt Structure** — How to structure prompts for best results
4. **Best Practices** — Specific techniques that work well with this model
5. **Common Mistakes to Avoid** — What NOT to do when prompting this model
6. **Examples** — 2-3 concrete before/after examples showing good vs bad prompts

Write the guide in English. Be specific to this model — don't give generic advice. Include concrete, actionable tips.
Start with a YAML frontmatter block with: model, provider, last_updated (today's date).`;

  const content = await askLLM(guidePrompt, {
    model: 'anthropic/claude-sonnet-4-20250514',
  });

  ensureDirs();
  writeFileSync(filePath, content + '\n');

  console.error(`✅ Guide sauvegardé: ${filePath}`);
}
