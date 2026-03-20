# Model Registry — Centralized Model Mapping

**Date:** 2026-03-20
**Status:** Approved
**Scope:** cc-hub CLI

## Problem

cc-hub uses models from multiple providers (OpenRouter, GitHub Copilot, Poyo) that use different naming conventions for the same models:

- OpenRouter: `openai/gpt-53-codex`
- Copilot: `GPT-5.3-Codex`
- Poyo: `gemini-3-pro-preview`

Users must remember provider-specific names. The `prompt-guide` skill generates files with OpenRouter-based slugs, but users may reference models by their Copilot or Codex names. No translation layer exists.

## Decision

Introduce a centralized, static model registry as the single source of truth for all model identifiers across providers. Users always interact using OpenRouter format; cc-hub translates internally to the provider's native name.

## Design

### 1. Data Registry — `src/data/models.ts`

Static array of model definitions, versioned in the repository.

```typescript
export type ModelType = 'text' | 'image' | 'video' | 'audio';
export type ProviderName = 'openrouter' | 'copilot' | 'poyo';

export interface Model {
  id: string;                                         // canonical OpenRouter format
  type: ModelType;
  providers: Partial<Record<ProviderName, string>>;   // native name per provider
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
    id: 'openai/gpt-5.2-codex',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-5.2-codex',
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
    id: 'openai/gpt-5.1-codex-max',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-5.1-codex-max',
      copilot: 'GPT-5.1-Codex-Max',
    },
  },
  {
    id: 'openai/gpt-5.1-codex',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-5.1-codex',
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

**Conventions for ID format:**
- Models available on OpenRouter use their OpenRouter ID directly (e.g., `anthropic/claude-opus-4.6`)
- Models only on Poyo get a pseudo-provider prefix: `poyo/`, `kuaishou/`, `soniox/`
- The ID is always `lowercase/slug-format`

### 2. Service Layer — `src/services/models.ts`

Lookup and translation functions:

```typescript
import { MODELS, type Model, type ModelType, type ProviderName } from '../data/models.ts';

const byId = new Map<string, Model>(MODELS.map(m => [m.id, m]));

/** Find a model by its canonical ID */
export function findModel(id: string): Model | undefined {
  return byId.get(id);
}

/** Find a model by its native name at a given provider */
export function findByProviderName(provider: ProviderName, name: string): Model | undefined {
  return MODELS.find(m => m.providers[provider] === name);
}

/** Translate canonical ID to provider-native name. Throws if unavailable. */
export function toProviderName(id: string, provider: ProviderName): string {
  const model = byId.get(id);
  if (!model) throw new Error(`Unknown model: ${id}`);
  const native = model.providers[provider];
  if (!native) throw new Error(`${id} is not available on ${provider}`);
  return native;
}

/** Convert canonical ID to filesystem slug for prompt guide files */
export function modelToSlug(id: string): string {
  return id.replace(/\//g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase();
}

/** List models with optional filters */
export function listModels(opts?: {
  type?: ModelType;
  provider?: ProviderName;
}): Model[] {
  return MODELS.filter(m => {
    if (opts?.type && m.type !== opts.type) return false;
    if (opts?.provider && !m.providers[opts.provider]) return false;
    return true;
  });
}
```

### 3. New Command — `cc-hub models list`

New file: `src/commands/models.ts`

```
$ cc-hub models list
anthropic/claude-opus-4.6       text   [openrouter, copilot]
anthropic/claude-sonnet-4.6     text   [openrouter, copilot]
openai/gpt-53-codex             text   [openrouter, copilot]
google/gemini-3-pro             text   [openrouter, copilot, poyo]
poyo/nano-banana-2-new          image  [poyo]
kuaishou/kling-3.0-pro          video  [poyo]

$ cc-hub models list --provider copilot --type text
anthropic/claude-opus-4.6       text   [openrouter, copilot]
...
```

Options:
- `--provider <name>` — filter by provider (openrouter, copilot, poyo)
- `--type <type>` — filter by type (text, image, video, audio)

Registered in `cli.ts` alongside existing commands.

### 4. Command Modifications

All changes are minimal — add a single translation call before the API call.

**`copilot.ts`:**
- Import `toProviderName` from `services/models.ts`
- Before calling `askCopilot`, translate: `toProviderName(opts.model, 'copilot')`
- Default (no `--model`) remains `gpt-4.1` unchanged

**`ask.ts`:**
- When `provider === 'poyo'` and `opts.model` is set, translate via `toProviderName(model, 'poyo')`
- OpenRouter calls pass the ID through unchanged (it's already in the right format)

**`imagine.ts`:**
- If model contains `/` (canonical format), translate via `toProviderName(model, 'poyo')`
- Otherwise, pass through as-is (backward compatibility with `nano-banana-2-new`)

**`video.ts`:**
- Same logic as `imagine.ts`

**`prompt.ts`:**
- Replace local `modelToSlug` with import from `services/models.ts`
- Replace `FALLBACK_MODEL_BY_TYPE` with a lookup from the registry (or keep as simple config)
- Rest unchanged

### 5. Backward Compatibility

- Native provider names (`nano-banana-2-new`, `kling-3.0/pro`) continue to work in `imagine`/`video` via passthrough
- `ask` without `--model` still uses `ASK_MODEL` env var or errors
- `copilot` without `--model` still defaults to `gpt-4.1`
- `prompt get` with existing slugs still resolves correctly (slug algorithm unchanged)

### 6. Updating the Skill Reference

`known-models.md` in the `prompt-guide` skill gets a note pointing to `src/data/models.ts` as the authoritative source. The skill still uses `known-models.md` for guide generation metadata (traits, documentation URLs, must-mention items) which is complementary to the code registry.

## Files Changed

| File | Action |
|------|--------|
| `src/data/models.ts` | **New** — model registry |
| `src/services/models.ts` | **New** — lookup/translation functions |
| `src/commands/models.ts` | **New** — `cc-hub models list` command |
| `src/cli.ts` | **Modified** — register models command |
| `src/commands/copilot.ts` | **Modified** — add translation call |
| `src/commands/ask.ts` | **Modified** — add translation for poyo provider |
| `src/commands/imagine.ts` | **Modified** — add translation for canonical IDs |
| `src/commands/video.ts` | **Modified** — add translation for canonical IDs |
| `src/commands/prompt.ts` | **Modified** — import shared `modelToSlug` |

## Out of Scope

- Dynamic model discovery via API calls to providers
- `cc-hub models add/remove` CLI commands (edit `src/data/models.ts` directly)
- Fuzzy matching or alias resolution beyond the registry
- Migration of existing prompt guide files (slugs remain unchanged)
