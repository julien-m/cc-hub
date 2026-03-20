# Model Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralized model registry so all cc-hub commands use OpenRouter-format IDs with automatic translation to provider-native names.

**Architecture:** A static registry (`src/data/models.ts`) holds all model definitions. A service layer (`src/services/models.ts`) provides lookup/translation. Commands resolve models at the command level before calling services. A new `cc-hub models list` command exposes the registry.

**Tech Stack:** TypeScript, Bun runtime, Bun test runner, Commander.js

**Spec:** `docs/superpowers/specs/2026-03-20-model-registry-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/data/models.ts` | Create | Model registry: types, constants, MODELS array |
| `src/services/models.ts` | Create | Lookup/translation: resolveForProvider, modelToSlug, listModels, findModel, findByProviderName |
| `tests/services/models.test.ts` | Create | Unit tests for the service layer |
| `src/commands/models.ts` | Create | `cc-hub models list` command |
| `src/cli.ts` | Modify | Register models command |
| `src/commands/ask.ts` | Modify | Resolve model at command level |
| `src/commands/copilot.ts` | Modify | Resolve model at command level |
| `src/commands/imagine.ts` | Modify | Resolve model at command level |
| `src/commands/video.ts` | Modify | Resolve model at command level |
| `src/commands/prompt.ts` | Modify | Import shared types/functions |
| `src/services/copilot.ts` | Modify | Remove DEFAULT_MODEL and env var fallback |
| `src/services/openrouter.ts` | Modify | Remove ASK_MODEL env var fallback, require model from caller |
| `src/services/poyo.ts` | Modify | Remove ASK_MODEL env var fallback, require model from caller |

---

### Task 1: Data Registry

**Files:**
- Create: `src/data/models.ts`

- [ ] **Step 1: Create the data directory**

Run: `mkdir -p src/data`

- [ ] **Step 2: Write the model registry**

Create `src/data/models.ts` with the full registry from the spec:

```typescript
export type ModelType = 'text' | 'image' | 'video' | 'audio';
export const VALID_TYPES: readonly ModelType[] = ['text', 'image', 'video', 'audio'];

export type ProviderName = 'openrouter' | 'copilot' | 'poyo';

export interface Model {
  id: string;
  type: ModelType;
  providers: Partial<Record<ProviderName, string>>;
}

export const MODELS: Model[] = [
  // --- Anthropic ---
  {
    id: 'anthropic/claude-opus-4.6',
    type: 'text',
    providers: {
      openrouter: 'anthropic/claude-opus-4.6',
      copilot: 'Claude Opus 4.6',
    },
  },
  {
    id: 'anthropic/claude-opus-4.5',
    type: 'text',
    providers: {
      openrouter: 'anthropic/claude-opus-4.5',
      copilot: 'Claude Opus 4.5',
    },
  },
  {
    id: 'anthropic/claude-sonnet-4.6',
    type: 'text',
    providers: {
      openrouter: 'anthropic/claude-sonnet-4.6',
      copilot: 'Claude Sonnet 4.6',
    },
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    type: 'text',
    providers: {
      openrouter: 'anthropic/claude-sonnet-4.5',
      copilot: 'Claude Sonnet 4.5',
    },
  },
  {
    id: 'anthropic/claude-sonnet-4',
    type: 'text',
    providers: {
      openrouter: 'anthropic/claude-sonnet-4',
      copilot: 'Claude Sonnet 4',
    },
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    type: 'text',
    providers: {
      openrouter: 'anthropic/claude-haiku-4.5',
      copilot: 'Claude Haiku 4.5',
    },
  },

  // --- OpenAI ---
  // Codex models: OpenRouter strips dots in their slug (gpt-53-codex, not gpt-5.3-codex)
  {
    id: 'openai/gpt-5.4',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-5.4',
      copilot: 'GPT-5.4',
    },
  },
  {
    id: 'openai/gpt-53-codex',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-53-codex',
      copilot: 'GPT-5.3-Codex',
    },
  },
  {
    id: 'openai/gpt-52-codex',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-52-codex',
      copilot: 'GPT-5.2-Codex',
    },
  },
  {
    id: 'openai/gpt-5.2',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-5.2',
      copilot: 'GPT-5.2',
    },
  },
  {
    id: 'openai/gpt-51-codex-max',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-51-codex-max',
      copilot: 'GPT-5.1-Codex-Max',
    },
  },
  {
    id: 'openai/gpt-51-codex',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-51-codex',
      copilot: 'GPT-5.1-Codex',
    },
  },
  {
    id: 'openai/gpt-5.1',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-5.1',
      copilot: 'GPT-5.1',
    },
  },
  {
    id: 'openai/gpt-5-mini',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-5-mini',
      copilot: 'GPT-5 mini',
    },
  },
  {
    id: 'openai/gpt-4.1',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-4.1',
      copilot: 'GPT-4.1',
    },
  },

  // --- Google ---
  {
    id: 'google/gemini-3-pro',
    type: 'text',
    providers: {
      openrouter: 'google/gemini-3-pro',
      copilot: 'Gemini 3 Pro (Preview)',
      poyo: 'gemini-3-pro-preview',
    },
  },
  {
    id: 'google/gemini-3-flash',
    type: 'text',
    providers: {
      openrouter: 'google/gemini-3-flash',
      copilot: 'Gemini 3 Flash (Preview)',
      poyo: 'gemini-3-flash-preview',
    },
  },
  {
    id: 'google/gemini-2.5-flash',
    type: 'text',
    providers: {
      openrouter: 'google/gemini-2.5-flash',
    },
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    type: 'text',
    providers: {
      openrouter: 'google/gemini-2.5-flash-lite',
    },
  },

  // --- Poyo media ---
  {
    id: 'poyo/nano-banana-2-new',
    type: 'image',
    providers: {
      poyo: 'nano-banana-2-new',
    },
  },
  {
    id: 'kuaishou/kling-3.0-pro',
    type: 'video',
    providers: {
      poyo: 'kling-3.0/pro',
    },
  },
  {
    id: 'kuaishou/kling-3.0-standard',
    type: 'video',
    providers: {
      poyo: 'kling-3.0/standard',
    },
  },

  // --- Soniox ---
  {
    id: 'soniox/soniox',
    type: 'audio',
    providers: {
      poyo: 'soniox',
    },
  },
];
```

- [ ] **Step 3: Verify the file compiles**

Run: `bun build src/data/models.ts --no-bundle`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/data/models.ts
git commit -m "feat(models): add centralized model registry"
```

---

### Task 2: Service Layer + Tests

**Files:**
- Create: `src/services/models.ts`
- Create: `tests/services/models.test.ts`

- [ ] **Step 1: Create the test directory**

Run: `mkdir -p tests/services`

- [ ] **Step 2: Write the failing tests**

Create `tests/services/models.test.ts`:

```typescript
import { describe, test, expect } from 'bun:test';
import {
  findModel,
  findByProviderName,
  toProviderName,
  resolveForProvider,
  modelToSlug,
  listModels,
} from '../../src/services/models.ts';

describe('findModel', () => {
  test('returns model by canonical ID', () => {
    const model = findModel('anthropic/claude-opus-4.6');
    expect(model).toBeDefined();
    expect(model!.type).toBe('text');
  });

  test('returns undefined for unknown ID', () => {
    expect(findModel('unknown/model')).toBeUndefined();
  });
});

describe('findByProviderName', () => {
  test('finds model by copilot native name', () => {
    const model = findByProviderName('copilot', 'GPT-5.3-Codex');
    expect(model).toBeDefined();
    expect(model!.id).toBe('openai/gpt-53-codex');
  });

  test('finds model by poyo native name', () => {
    const model = findByProviderName('poyo', 'nano-banana-2-new');
    expect(model).toBeDefined();
    expect(model!.id).toBe('poyo/nano-banana-2-new');
  });

  test('returns undefined for unknown native name', () => {
    expect(findByProviderName('copilot', 'Unknown Model')).toBeUndefined();
  });
});

describe('toProviderName', () => {
  test('translates canonical ID to copilot name', () => {
    expect(toProviderName('openai/gpt-53-codex', 'copilot')).toBe('GPT-5.3-Codex');
  });

  test('translates canonical ID to poyo name', () => {
    expect(toProviderName('poyo/nano-banana-2-new', 'poyo')).toBe('nano-banana-2-new');
  });

  test('throws for unknown model', () => {
    expect(() => toProviderName('unknown/model', 'copilot')).toThrow('Unknown model');
  });

  test('throws for model not available on provider', () => {
    expect(() => toProviderName('poyo/nano-banana-2-new', 'copilot')).toThrow('not available on copilot');
  });
});

describe('resolveForProvider', () => {
  test('registered model returns native name for copilot', () => {
    expect(resolveForProvider('anthropic/claude-sonnet-4.6', 'copilot')).toBe('Claude Sonnet 4.6');
  });

  test('registered model returns native name for poyo', () => {
    expect(resolveForProvider('google/gemini-3-pro', 'poyo')).toBe('gemini-3-pro-preview');
  });

  test('unregistered model passes through for openrouter', () => {
    expect(resolveForProvider('meta/llama-4-scout', 'openrouter')).toBe('meta/llama-4-scout');
  });

  test('unregistered model throws for copilot', () => {
    expect(() => resolveForProvider('meta/llama-4-scout', 'copilot')).toThrow('Unknown model');
  });

  test('unregistered model throws for poyo', () => {
    expect(() => resolveForProvider('meta/llama-4-scout', 'poyo')).toThrow('Unknown model');
  });

  test('model not available on target provider throws with helpful message', () => {
    expect(() => resolveForProvider('poyo/nano-banana-2-new', 'copilot')).toThrow(
      "cc-hub models list --provider copilot"
    );
  });
});

describe('modelToSlug', () => {
  test('converts OpenRouter ID to slug', () => {
    expect(modelToSlug('anthropic/claude-opus-4.6')).toBe('anthropic-claude-opus-46');
  });

  test('converts Codex model ID', () => {
    expect(modelToSlug('openai/gpt-53-codex')).toBe('openai-gpt-53-codex');
  });

  test('converts Poyo model ID', () => {
    expect(modelToSlug('poyo/nano-banana-2-new')).toBe('poyo-nano-banana-2-new');
  });

  test('converts Kling model ID (strips dot)', () => {
    expect(modelToSlug('kuaishou/kling-3.0-pro')).toBe('kuaishou-kling-30-pro');
  });
});

describe('listModels', () => {
  test('returns all models when no filters', () => {
    const all = listModels();
    expect(all.length).toBeGreaterThan(20);
  });

  test('filters by type', () => {
    const images = listModels({ type: 'image' });
    expect(images.every(m => m.type === 'image')).toBe(true);
    expect(images.length).toBeGreaterThan(0);
  });

  test('filters by provider', () => {
    const copilot = listModels({ provider: 'copilot' });
    expect(copilot.every(m => m.providers.copilot !== undefined)).toBe(true);
    expect(copilot.length).toBeGreaterThan(0);
  });

  test('combines type and provider filters', () => {
    const poyoText = listModels({ type: 'text', provider: 'poyo' });
    expect(poyoText.every(m => m.type === 'text' && m.providers.poyo !== undefined)).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `bun test tests/services/models.test.ts`
Expected: FAIL — module `../../src/services/models.ts` not found

- [ ] **Step 4: Write the service implementation**

Create `src/services/models.ts`:

```typescript
import { MODELS, type Model, type ModelType, type ProviderName } from '../data/models.ts';

const byId = new Map<string, Model>(MODELS.map((m) => [m.id, m]));

export function findModel(id: string): Model | undefined {
  return byId.get(id);
}

export function findByProviderName(provider: ProviderName, name: string): Model | undefined {
  return MODELS.find((m) => m.providers[provider] === name);
}

export function toProviderName(id: string, provider: ProviderName): string {
  const model = byId.get(id);
  if (!model) throw new Error(`Unknown model: ${id}`);
  const native = model.providers[provider];
  if (!native) throw new Error(`${id} is not available on ${provider}`);
  return native;
}

export function resolveForProvider(userInput: string, provider: ProviderName): string {
  const model = byId.get(userInput);
  if (model) {
    const native = model.providers[provider];
    if (native) return native;
    throw new Error(
      `${userInput} is not available on ${provider}. ` +
      `Use 'cc-hub models list --provider ${provider}' to see available models.`,
    );
  }
  if (provider === 'openrouter') return userInput;
  throw new Error(
    `Unknown model: ${userInput}. ` +
    `Use 'cc-hub models list --provider ${provider}' to see available models.`,
  );
}

export function modelToSlug(id: string): string {
  return id.replace(/\//g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase();
}

export function listModels(opts?: {
  type?: ModelType;
  provider?: ProviderName;
}): Model[] {
  return MODELS.filter((m) => {
    if (opts?.type && m.type !== opts.type) return false;
    if (opts?.provider && !m.providers[opts.provider]) return false;
    return true;
  });
}

export { type Model, type ModelType, type ProviderName } from '../data/models.ts';
export { VALID_TYPES } from '../data/models.ts';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun test tests/services/models.test.ts`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/services/models.ts tests/services/models.test.ts
git commit -m "feat(models): add model service layer with tests"
```

---

### Task 3: `cc-hub models list` Command

**Files:**
- Create: `src/commands/models.ts`
- Modify: `src/cli.ts`

- [ ] **Step 1: Write the models command**

Create `src/commands/models.ts`:

```typescript
import { Command } from 'commander';
import { listModels } from '../services/models.ts';
import { VALID_TYPES, type ModelType, type ProviderName } from '../data/models.ts';

const VALID_PROVIDERS: ProviderName[] = ['openrouter', 'copilot', 'poyo'];

export function createModelsCommand(): Command {
  const models = new Command('models').description('Gérer le registre des modèles');

  models
    .command('list')
    .description('Lister les modèles disponibles')
    .option('--provider <name>', `Filtrer par provider (${VALID_PROVIDERS.join(', ')})`)
    .option('--type <type>', `Filtrer par type (${VALID_TYPES.join(', ')})`)
    .action((opts: { provider?: string; type?: string }) => {
      if (opts.type && !VALID_TYPES.includes(opts.type as ModelType)) {
        console.error(`Type invalide: "${opts.type}". Valeurs acceptées: ${VALID_TYPES.join(', ')}`);
        process.exit(1);
      }
      if (opts.provider && !VALID_PROVIDERS.includes(opts.provider as ProviderName)) {
        console.error(`Provider invalide: "${opts.provider}". Valeurs acceptées: ${VALID_PROVIDERS.join(', ')}`);
        process.exit(1);
      }

      const results = listModels({
        type: opts.type as ModelType | undefined,
        provider: opts.provider as ProviderName | undefined,
      });

      if (results.length === 0) {
        console.log('Aucun modèle trouvé.');
        return;
      }

      for (const m of results) {
        const providers = Object.keys(m.providers).join(', ');
        console.log(`${m.id.padEnd(35)} ${m.type.padEnd(7)} [${providers}]`);
      }
    });

  return models;
}
```

- [ ] **Step 2: Register in cli.ts**

In `src/cli.ts`, add import and registration:

```typescript
import { createModelsCommand } from './commands/models.ts';
```

Add after the last `program.addCommand(...)`:

```typescript
program.addCommand(createModelsCommand());
```

- [ ] **Step 3: Test manually**

Run: `bun bin/cc-hub.ts models list`
Expected: Full model list with providers

Run: `bun bin/cc-hub.ts models list --provider copilot --type text`
Expected: Filtered list showing only text models on Copilot

- [ ] **Step 4: Commit**

```bash
git add src/commands/models.ts src/cli.ts
git commit -m "feat(models): add 'cc-hub models list' command"
```

---

### Task 4: Update Services — Remove Model Fallbacks

**Files:**
- Modify: `src/services/copilot.ts:16,25`
- Modify: `src/services/openrouter.ts:18-22`
- Modify: `src/services/poyo.ts:17-21`

- [ ] **Step 1: Update `copilot.ts` — remove DEFAULT_MODEL and env var fallback**

In `src/services/copilot.ts`:

Remove line 16:
```typescript
const DEFAULT_MODEL = 'gpt-4.1';
```

Replace line 25:
```typescript
const model = opts.model || getEnv('COPILOT_MODEL') || DEFAULT_MODEL;
```
with:
```typescript
const model = opts.model;
if (!model) throw new Error('No model specified for Copilot');
```

Remove the `import { getEnv } from './env.ts';` line (no longer used).

- [ ] **Step 2: Update `openrouter.ts` — require model from caller**

In `src/services/openrouter.ts`, replace lines 18-22:
```typescript
  const model = opts.model || getEnv('ASK_MODEL');
  if (!model) {
    console.error('Aucun modèle spécifié — utilise --model <model>');
    process.exit(1);
  }
```
with:
```typescript
  const model = opts.model;
  if (!model) throw new Error('No model specified');
```

- [ ] **Step 3: Update `poyo.ts` — require model from caller**

In `src/services/poyo.ts`, replace lines 17-21:
```typescript
	const model = opts.model || getEnv('ASK_MODEL');
	if (!model) {
		console.error('Aucun modèle spécifié — utilise --model <model>');
		process.exit(1);
	}
```
with:
```typescript
	const model = opts.model;
	if (!model) throw new Error('No model specified');
```

- [ ] **Step 4: Verify compilation**

Run: `bun build src/services/copilot.ts src/services/openrouter.ts src/services/poyo.ts --no-bundle`
Expected: No errors (note: unused `getEnv` import may remain in openrouter.ts and poyo.ts — remove only if it becomes the only usage; keep if other env vars are still read in the same file)

- [ ] **Step 5: Commit**

```bash
git add src/services/copilot.ts src/services/openrouter.ts src/services/poyo.ts
git commit -m "refactor(services): remove model env var fallbacks, require model from caller"
```

---

### Task 5: Update Commands — Model Resolution at Command Level

**Files:**
- Modify: `src/commands/ask.ts:36,70-79`
- Modify: `src/commands/copilot.ts:39,72`
- Modify: `src/commands/imagine.ts:16-18`
- Modify: `src/commands/video.ts:16-18`

- [ ] **Step 1: Update `ask.ts`**

Add import at top of `src/commands/ask.ts`:
```typescript
import { resolveForProvider } from '../services/models.ts';
import type { ProviderName } from '../data/models.ts';
```

In the action handler (inside the try block), replace lines 70-79:
```typescript
			const provider = opts.provider || getEnv('ASK_PROVIDER') || 'openrouter';
			const askFn = provider === 'poyo' ? askPoyo : askLLM;

			const response = await askFn(prompt, {
				model: opts.model,
				stdin,
				files: files.length > 0 ? files : undefined,
				json: opts.json || !!jsonSchema,
				jsonSchema,
			});
```
with:
```typescript
			const provider = opts.provider || getEnv('ASK_PROVIDER') || 'openrouter';
			const rawModel = opts.model || getEnv('ASK_MODEL');
			if (!rawModel) {
				console.error('Aucun modèle spécifié — utilise --model <model>');
				process.exit(1);
			}
			const providerName: ProviderName = provider === 'poyo' ? 'poyo' : 'openrouter';
			const model = resolveForProvider(rawModel, providerName);
			const askFn = provider === 'poyo' ? askPoyo : askLLM;

			const response = await askFn(prompt, {
				model,
				stdin,
				files: files.length > 0 ? files : undefined,
				json: opts.json || !!jsonSchema,
				jsonSchema,
			});
```

- [ ] **Step 2: Update `copilot.ts`**

Add import at top of `src/commands/copilot.ts`:
```typescript
import { resolveForProvider } from '../services/models.ts';
import { getEnv } from '../services/env.ts';
```

In the action handler (inside the try block), before the `askCopilot` call, add model resolution:
```typescript
			const rawModel = opts.model || getEnv('COPILOT_MODEL') || 'openai/gpt-4.1';
			const nativeModel = resolveForProvider(rawModel, 'copilot');
```

Update the `askCopilot` call to pass `nativeModel`:
```typescript
			const response = await askCopilot(prompt, {
				model: nativeModel,
				stdin,
				files: files.length > 0 ? files : undefined,
			});
```

- [ ] **Step 3: Update `imagine.ts`**

Add import at top of `src/commands/imagine.ts`:
```typescript
import { resolveForProvider } from '../services/models.ts';
```

Replace the model resolution line (inside the action handler):
```typescript
			const model = opts.model || getEnv('IMAGINE_MODEL') || 'nano-banana-2-new';
```
with:
```typescript
			const rawModel = opts.model || getEnv('IMAGINE_MODEL') || 'poyo/nano-banana-2-new';
			const model = resolveForProvider(rawModel, 'poyo');
```

- [ ] **Step 4: Update `video.ts`**

Add import at top of `src/commands/video.ts`:
```typescript
import { resolveForProvider } from '../services/models.ts';
```

Replace the model resolution line (inside the action handler):
```typescript
			const model = opts.model || getEnv('VIDEO_MODEL') || 'kling-3.0/standard';
```
with:
```typescript
			const rawModel = opts.model || getEnv('VIDEO_MODEL') || 'kuaishou/kling-3.0-pro';
			const model = resolveForProvider(rawModel, 'poyo');
```

- [ ] **Step 5: Verify compilation**

Run: `bun build src/commands/ask.ts src/commands/copilot.ts src/commands/imagine.ts src/commands/video.ts --no-bundle`
Expected: No errors

- [ ] **Step 6: Test manually**

Run: `bun bin/cc-hub.ts models list --provider copilot`
Then verify: `bun bin/cc-hub.ts copilot --help` still shows model option

- [ ] **Step 7: Commit**

```bash
git add src/commands/ask.ts src/commands/copilot.ts src/commands/imagine.ts src/commands/video.ts
git commit -m "feat(commands): resolve models via registry at command level"
```

---

### Task 6: Update `prompt.ts` — Shared Types

**Files:**
- Modify: `src/commands/prompt.ts:1-31`

- [ ] **Step 1: Update imports and remove local definitions**

In `src/commands/prompt.ts`, replace lines 1-23:
```typescript
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Command } from 'commander';
import { PROMPTS_DIR, ensureDirs } from '../utils/paths.ts';
import { getConfig } from './config.ts';

function modelToSlug(model: string): string {
  return model.replace(/\//g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase();
}

function slugToPath(slug: string): string {
  return join(PROMPTS_DIR, `${slug}.md`);
}

const VALID_TYPES = ['image', 'video', 'audio', 'text'] as const;
type ModelType = typeof VALID_TYPES[number];

const FALLBACK_MODEL_BY_TYPE: Record<ModelType, string> = {
  text: 'anthropic/claude-opus-4.6',
  image: 'nano-banana-2-new',
  video: 'kling-30-pro',
  audio: 'soniox',
};
```
with:
```typescript
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
  image: 'poyo/nano-banana-2-new',
  video: 'kuaishou/kling-3.0-pro',
  audio: 'soniox/soniox',
};
```

- [ ] **Step 2: Verify compilation**

Run: `bun build src/commands/prompt.ts --no-bundle`
Expected: No errors

- [ ] **Step 3: Run existing tests**

Run: `bun test`
Expected: All tests from Task 2 still pass

- [ ] **Step 4: Commit**

```bash
git add src/commands/prompt.ts
git commit -m "refactor(prompt): use shared modelToSlug and types from registry"
```

---

### Task 7: Prompt Guide File Migration

**Files:**
- Rename: `~/.claude-hub/prompts/nano-banana-2-new.md` → `poyo-nano-banana-2-new.md`
- Rename: `~/.claude-hub/prompts/kling-30-pro.md` → `kuaishou-kling-30-pro.md`
- Rename: `~/.claude-hub/prompts/soniox.md` → `soniox-soniox.md`

- [ ] **Step 1: Rename the 3 prompt guide files**

```bash
mv ~/.claude-hub/prompts/nano-banana-2-new.md ~/.claude-hub/prompts/poyo-nano-banana-2-new.md
mv ~/.claude-hub/prompts/kling-30-pro.md ~/.claude-hub/prompts/kuaishou-kling-30-pro.md
mv ~/.claude-hub/prompts/soniox.md ~/.claude-hub/prompts/soniox-soniox.md
```

- [ ] **Step 2: Verify prompt lookup still works**

Run: `bun bin/cc-hub.ts prompt get --type image`
Expected: Should show the nano-banana guide (now resolved via `poyo/nano-banana-2-new` → slug `poyo-nano-banana-2-new`)

Run: `bun bin/cc-hub.ts prompt get --type video`
Expected: Should show the kling guide

Run: `bun bin/cc-hub.ts prompt list`
Expected: All 15 guides listed with correct names

- [ ] **Step 3: No git commit needed** (these files are outside the repo)

---

### Task 8: Final Verification

- [ ] **Step 1: Run all tests**

Run: `bun test`
Expected: All tests pass

- [ ] **Step 2: End-to-end smoke tests**

```bash
# Models list
bun bin/cc-hub.ts models list
bun bin/cc-hub.ts models list --provider copilot
bun bin/cc-hub.ts models list --type image

# Prompt lookup
bun bin/cc-hub.ts prompt get --model "openai/gpt-53-codex"
bun bin/cc-hub.ts prompt list

# Help text (verify no regressions)
bun bin/cc-hub.ts ask --help
bun bin/cc-hub.ts copilot --help
bun bin/cc-hub.ts imagine --help
bun bin/cc-hub.ts video --help
```

- [ ] **Step 3: Final commit (if any remaining changes)**

```bash
git status
# If clean, nothing to do
```
