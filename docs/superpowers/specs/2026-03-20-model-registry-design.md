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

Static array of model definitions, versioned in the repository. Exports `ModelType` and `ProviderName` as the single source of truth for these types (other modules import from here).

```typescript
export type ModelType = 'text' | 'image' | 'video' | 'audio';
export const VALID_TYPES: readonly ModelType[] = ['text', 'image', 'video', 'audio'];

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
  // Note: openai/gpt-53-codex — the missing dot is intentional, this is
  // the actual OpenRouter ID (their slug convention strips dots for Codex models).
  // The existing prompt file `openai-gpt-53-codex.md` already uses this format.
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

**Conventions for ID format:**
- Models available on OpenRouter use their OpenRouter ID directly (e.g., `anthropic/claude-opus-4.6`)
- OpenRouter Codex models strip dots in their slug (e.g., `openai/gpt-53-codex` not `openai/gpt-5.3-codex`) — this is the actual OpenRouter convention, not a typo
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

/**
 * Resolve a user-supplied model identifier to the provider's native name.
 *
 * Strategy:
 * 1. If the ID is in the registry → translate to native name for the target provider
 * 2. If not in the registry:
 *    - openrouter: passthrough (OpenRouter accepts any valid model ID)
 *    - copilot/poyo: error (name format differs, blind passthrough would fail)
 */
export function resolveForProvider(userInput: string, provider: ProviderName): string {
  const model = byId.get(userInput);
  if (model) {
    const native = model.providers[provider];
    if (native) return native;
    throw new Error(
      `${userInput} is not available on ${provider}. ` +
      `Use 'cc-hub models list --provider ${provider}' to see available models.`
    );
  }
  // Not in registry — passthrough for OpenRouter, error for others
  if (provider === 'openrouter') return userInput;
  throw new Error(
    `Unknown model: ${userInput}. ` +
    `Use 'cc-hub models list --provider ${provider}' to see available models.`
  );
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

Key design: `resolveForProvider` replaces the previous `toProviderName` for command-level usage. It handles unregistered models gracefully: passthrough for OpenRouter (which accepts any valid model ID directly), error for Copilot/Poyo (where the name format is different and blind passthrough would fail silently or error at the API level).

Both functions are exported: `toProviderName` for internal/strict contexts where the model must exist in the registry, `resolveForProvider` for user-facing command input where unregistered models may be passed.

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
kuaishou/kling-3.0-standard     video  [poyo]

$ cc-hub models list --provider copilot --type text
anthropic/claude-opus-4.6       text   [openrouter, copilot]
...
```

Options:
- `--provider <name>` — filter by provider (openrouter, copilot, poyo)
- `--type <type>` — filter by type (text, image, video, audio)

Registered in `cli.ts` alongside existing commands.

### 4. Command Modifications

Translation happens at the **command level**, before passing the model to the service layer. This ensures env-var-sourced models are also translated.

**`copilot.ts`:**
- Import `resolveForProvider` from `services/models.ts`
- Resolve the final model (from `--model` flag, env var, or default) at command level
- Pass the resolved native name to `askCopilot`

```typescript
// In the action handler, before askCopilot call:
const rawModel = opts.model || getEnv('COPILOT_MODEL') || 'openai/gpt-4.1';
const nativeModel = resolveForProvider(rawModel, 'copilot');
const response = await askCopilot(prompt, { model: nativeModel, ... });
```

Note: the default changes from `'gpt-4.1'` (native Copilot name) to `'openai/gpt-4.1'` (canonical ID). The service `copilot.ts` no longer needs its own `DEFAULT_MODEL` constant — the command handles defaults. The service's `CopilotOptions.model` becomes effectively required (the command always provides it). The `COPILOT_MODEL` env var now accepts OpenRouter format (breaking change for users who had `COPILOT_MODEL=GPT-5.4` — must update to `openai/gpt-5.4`).

**`ask.ts`:**
- Import `resolveForProvider` from `services/models.ts`
- Determine provider, then resolve model before passing to service

```typescript
const provider = opts.provider || getEnv('ASK_PROVIDER') || 'openrouter';
const rawModel = opts.model || getEnv('ASK_MODEL');
if (!rawModel) { /* error: no model */ }
const providerName = provider === 'poyo' ? 'poyo' : 'openrouter';
const model = resolveForProvider(rawModel, providerName as ProviderName);
const askFn = provider === 'poyo' ? askPoyo : askLLM;
const response = await askFn(prompt, { model, ... });
```

This ensures env-var-sourced models (`ASK_MODEL`) are also translated when using `--provider poyo`.

The `ASK_MODEL` env var fallback is removed from the service layer (`openrouter.ts` and `poyo.ts`). Model resolution is the command's responsibility — services receive the final model name. This matches the same pattern applied to `copilot.ts`.

**`imagine.ts`:**
- Import `resolveForProvider` from `services/models.ts`
- Resolve model at command level, with fallback for unregistered native names

```typescript
const rawModel = opts.model || getEnv('IMAGINE_MODEL') || 'poyo/nano-banana-2-new';
const model = resolveForProvider(rawModel, 'poyo');
```

No slash-based heuristic needed: `resolveForProvider` checks the registry first. If `rawModel` is a canonical ID like `poyo/nano-banana-2-new`, it resolves to `nano-banana-2-new`. If someone passes a raw native name like `nano-banana-2-new`, it won't be in the registry (no match by canonical ID), and since provider is `poyo` (not `openrouter`), it will error — which is the correct behavior to enforce the canonical format.

**`video.ts`:**
- Same pattern as `imagine.ts`
- Default changes from `'kling-3.0/standard'` (native) to `'kuaishou/kling-3.0-pro'` (canonical), aligning with the cc-hub documentation which specifies `kling-3.0/pro` as the default

**`prompt.ts`:**
- Import `modelToSlug` and `ModelType`, `VALID_TYPES` from the shared modules
- Remove local `modelToSlug`, `VALID_TYPES`, `ModelType` definitions
- `FALLBACK_MODEL_BY_TYPE` updated to use canonical IDs:

```typescript
const FALLBACK_MODEL_BY_TYPE: Record<ModelType, string> = {
  text: 'anthropic/claude-opus-4.6',
  image: 'poyo/nano-banana-2-new',
  video: 'kuaishou/kling-3.0-pro',
  audio: 'soniox/soniox',
};
```

### 5. Backward Compatibility

**Non-breaking:**
- `prompt get` with existing slugs for OpenRouter models still resolves correctly (slug algorithm unchanged)
- `ask` without `--provider` still sends to OpenRouter with passthrough

**Breaking (minor):**
- `COPILOT_MODEL` env var must now use OpenRouter format (`openai/gpt-5.4` instead of `GPT-5.4`)
- `IMAGINE_MODEL` env var must now use canonical format (`poyo/nano-banana-2-new` instead of `nano-banana-2-new`)
- `VIDEO_MODEL` env var must now use canonical format (`kuaishou/kling-3.0-standard` instead of `kling-3.0/standard`)

These env vars are set in `.env` files consumed by `creds env`. The migration is a one-time edit per `.env` file.

**Prompt guide file migration:**
The FALLBACK_MODEL_BY_TYPE change to canonical IDs affects slugs for non-OpenRouter models:
- `nano-banana-2-new.md` → `poyo-nano-banana-2-new.md`
- `kling-30-pro.md` → `kuaishou-kling-30-pro.md`
- `soniox.md` → `soniox-soniox.md`

These 3 files must be renamed in `~/.claude-hub/prompts/` as part of implementation. A one-time migration step (simple `mv` commands) will be documented.

### 6. Updating the Skill Reference

`known-models.md` in the `prompt-guide` skill gets a note pointing to `src/data/models.ts` as the authoritative source. The skill still uses `known-models.md` for guide generation metadata (traits, documentation URLs, must-mention items) which is complementary to the code registry.

## Files Changed

| File | Action |
|------|--------|
| `src/data/models.ts` | **New** — model registry, exports `ModelType`, `VALID_TYPES`, `ProviderName`, `Model`, `MODELS` |
| `src/services/models.ts` | **New** — `resolveForProvider`, `findModel`, `findByProviderName`, `modelToSlug`, `listModels` |
| `src/commands/models.ts` | **New** — `cc-hub models list` command |
| `src/cli.ts` | **Modified** — register models command |
| `src/commands/copilot.ts` | **Modified** — resolve model at command level via `resolveForProvider` |
| `src/commands/ask.ts` | **Modified** — resolve model at command level via `resolveForProvider` |
| `src/commands/imagine.ts` | **Modified** — resolve model at command level via `resolveForProvider` |
| `src/commands/video.ts` | **Modified** — resolve model at command level via `resolveForProvider` |
| `src/commands/prompt.ts` | **Modified** — import shared `modelToSlug`, `ModelType`, `VALID_TYPES`; update `FALLBACK_MODEL_BY_TYPE` to canonical IDs |
| `src/services/copilot.ts` | **Modified** — remove `DEFAULT_MODEL` and `COPILOT_MODEL` fallback; model required from caller |
| `src/services/openrouter.ts` | **Modified** — remove `ASK_MODEL` env var fallback; model must be provided by caller |
| `src/services/poyo.ts` | **Modified** — remove `ASK_MODEL` env var fallback; model must be provided by caller |

## Test Plan

Unit tests for `src/services/models.ts`:

1. **`resolveForProvider`** — registered model returns native name; unregistered model passes through for openrouter; unregistered model throws for copilot/poyo; model not available on target provider throws with helpful message
2. **`modelToSlug`** — converts `anthropic/claude-opus-4.6` to `anthropic-claude-opus-46`; handles edge cases (double dashes, special chars)
3. **`listModels`** — filters by type; filters by provider; combines both filters; returns all when no filter
4. **`findModel`** / **`findByProviderName`** — basic lookup, returns undefined for unknown

## Out of Scope

- Dynamic model discovery via API calls to providers
- `cc-hub models add/remove` CLI commands (edit `src/data/models.ts` directly)
- Fuzzy matching or alias resolution beyond the registry
- Migration of existing prompt guide files (slugs remain unchanged)
