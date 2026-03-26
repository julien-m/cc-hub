import { describe, expect, test } from 'bun:test';
import {
  findModel,
  findByProviderName,
  toProviderName,
  resolveForProvider,
  modelToSlug,
  listModels,
} from '../../src/services/models.ts';

// ---------------------------------------------------------------------------
// findModel
// ---------------------------------------------------------------------------
describe('findModel', () => {
  test('returns model by canonical ID', () => {
    const m = findModel('anthropic/claude-sonnet-4');
    expect(m).toBeDefined();
    expect(m!.id).toBe('anthropic/claude-sonnet-4');
    expect(m!.type).toBe('text');
  });

  test('returns undefined for unknown ID', () => {
    expect(findModel('unknown/model-99')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// findByProviderName
// ---------------------------------------------------------------------------
describe('findByProviderName', () => {
  test('finds by copilot display name', () => {
    const m = findByProviderName('copilot', 'claude-sonnet-4');
    expect(m).toBeDefined();
    expect(m!.id).toBe('anthropic/claude-sonnet-4');
  });

  test('finds by poyo native name', () => {
    const m = findByProviderName('poyo', 'kling-3.0/pro');
    expect(m).toBeDefined();
    expect(m!.id).toBe('kuaishou/kling-3.0-pro');
  });

  test('returns undefined for unknown provider name', () => {
    expect(findByProviderName('copilot', 'Nonexistent Model')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// toProviderName
// ---------------------------------------------------------------------------
describe('toProviderName', () => {
  test('translates canonical ID to copilot name', () => {
    expect(toProviderName('openai/gpt-4.1', 'copilot')).toBe('gpt-4.1');
  });

  test('translates canonical ID to poyo name', () => {
    expect(toProviderName('google/gemini-3-pro', 'poyo')).toBe('gemini-3-pro-preview');
  });

  test('openrouter self-maps (ID equals provider name)', () => {
    expect(toProviderName('anthropic/claude-sonnet-4', 'openrouter')).toBe(
      'anthropic/claude-sonnet-4',
    );
  });

  test('throws for unknown model ID', () => {
    expect(() => toProviderName('unknown/model', 'copilot')).toThrow('Unknown model');
  });

  test('throws for unavailable provider', () => {
    // gemini-2.5-flash has no copilot entry
    expect(() => toProviderName('google/gemini-2.5-flash', 'copilot')).toThrow(
      'not available on copilot',
    );
  });
});

// ---------------------------------------------------------------------------
// resolveForProvider
// ---------------------------------------------------------------------------
describe('resolveForProvider', () => {
  test('registered model resolves to copilot name', () => {
    expect(resolveForProvider('openai/gpt-4.1', 'copilot')).toBe('gpt-4.1');
  });

  test('registered model resolves to poyo name', () => {
    expect(resolveForProvider('google/gemini-3.1-flash-image', 'poyo')).toBe('nano-banana-2-new');
  });

  test('registered model resolves to openrouter name', () => {
    expect(resolveForProvider('anthropic/claude-sonnet-4', 'openrouter')).toBe(
      'anthropic/claude-sonnet-4',
    );
  });

  test('unregistered model passes through for openrouter', () => {
    expect(resolveForProvider('meta/llama-4-scout', 'openrouter')).toBe('meta/llama-4-scout');
  });

  test('unregistered model throws for copilot', () => {
    expect(() => resolveForProvider('meta/llama-4-scout', 'copilot')).toThrow('Unknown model');
    expect(() => resolveForProvider('meta/llama-4-scout', 'copilot')).toThrow(
      'cc-hub models list',
    );
  });

  test('unregistered model throws for poyo', () => {
    expect(() => resolveForProvider('meta/llama-4-scout', 'poyo')).toThrow('Unknown model');
  });

  test('registered model unavailable on provider throws with helpful message', () => {
    // gemini-2.5-flash has only openrouter
    expect(() => resolveForProvider('google/gemini-2.5-flash', 'copilot')).toThrow(
      'not available on copilot',
    );
    expect(() => resolveForProvider('google/gemini-2.5-flash', 'copilot')).toThrow(
      'cc-hub models list',
    );
  });
});

// ---------------------------------------------------------------------------
// modelToSlug
// ---------------------------------------------------------------------------
describe('modelToSlug', () => {
  test('standard ID with slash', () => {
    expect(modelToSlug('anthropic/claude-sonnet-4')).toBe('anthropic-claude-sonnet-4');
  });

  test('codex ID (already no dots)', () => {
    expect(modelToSlug('openai/gpt-53-codex')).toBe('openai-gpt-53-codex');
  });

  test('poyo image model ID', () => {
    expect(modelToSlug('google/gemini-3.1-flash-image')).toBe('google-gemini-31-flash-image');
  });

  test('kling ID (dots stripped)', () => {
    expect(modelToSlug('kuaishou/kling-3.0-pro')).toBe('kuaishou-kling-30-pro');
  });

  test('empty string returns empty', () => {
    expect(modelToSlug('')).toBe('');
  });

  test('uppercase input is lowercased', () => {
    expect(modelToSlug('OpenAI/GPT-4.1')).toBe('openai-gpt-41');
  });
});

// ---------------------------------------------------------------------------
// listModels
// ---------------------------------------------------------------------------
describe('listModels', () => {
  test('returns all models when no filter', () => {
    const all = listModels();
    expect(all.length).toBeGreaterThan(0);
  });

  test('filters by type', () => {
    const images = listModels({ type: 'image' });
    expect(images.length).toBeGreaterThan(0);
    expect(images.every((m) => m.type === 'image')).toBe(true);
  });

  test('filters by provider', () => {
    const copilot = listModels({ provider: 'copilot' });
    expect(copilot.length).toBeGreaterThan(0);
    expect(copilot.every((m) => m.providers.copilot !== undefined)).toBe(true);
  });

  test('combined type + provider filter', () => {
    const textPoyo = listModels({ type: 'text', provider: 'poyo' });
    expect(textPoyo.every((m) => m.type === 'text' && m.providers.poyo !== undefined)).toBe(true);
  });

  test('returns empty array when no matches', () => {
    const result = listModels({ type: 'audio', provider: 'copilot' });
    expect(result).toEqual([]);
  });
});
