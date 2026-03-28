import { describe, expect, it } from 'bun:test';
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
  it('should return model by canonical ID', () => {
    const m = findModel('anthropic/claude-sonnet-4');
    expect(m).toBeDefined();
    expect(m!.id).toBe('anthropic/claude-sonnet-4');
    expect(m!.type).toBe('text');
  });

  it('should return undefined for unknown ID', () => {
    expect(findModel('unknown/model-99')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// findByProviderName
// ---------------------------------------------------------------------------
describe('findByProviderName', () => {
  it('should find by copilot display name', () => {
    const m = findByProviderName('copilot', 'claude-sonnet-4');
    expect(m).toBeDefined();
    expect(m!.id).toBe('anthropic/claude-sonnet-4');
  });

  it('should find by poyo native name', () => {
    const m = findByProviderName('poyo', 'kling-3.0/pro');
    expect(m).toBeDefined();
    expect(m!.id).toBe('kuaishou/kling-3.0-pro');
  });

  it('should return undefined for unknown provider name', () => {
    expect(findByProviderName('copilot', 'Nonexistent Model')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// toProviderName
// ---------------------------------------------------------------------------
describe('toProviderName', () => {
  it('should translate canonical ID to copilot name', () => {
    expect(toProviderName('openai/gpt-4.1', 'copilot')).toBe('gpt-4.1');
  });

  it('should translate canonical ID to poyo name', () => {
    expect(toProviderName('google/gemini-3-pro', 'poyo')).toBe('gemini-3-pro-preview');
  });

  it('should self-map openrouter (ID equals provider name)', () => {
    expect(toProviderName('anthropic/claude-sonnet-4', 'openrouter')).toBe(
      'anthropic/claude-sonnet-4',
    );
  });

  it('should throw for unknown model ID', () => {
    expect(() => toProviderName('unknown/model', 'copilot')).toThrow('Unknown model');
  });

  it('should throw for unavailable provider', () => {
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
  it('should resolve registered model to copilot name', () => {
    expect(resolveForProvider('openai/gpt-4.1', 'copilot')).toBe('gpt-4.1');
  });

  it('should resolve registered model to poyo name', () => {
    expect(resolveForProvider('google/gemini-3.1-flash-image', 'poyo')).toBe('nano-banana-2-new');
  });

  it('should resolve nano-banana-2 pro to poyo name', () => {
    expect(resolveForProvider('google/nano-banana-2', 'poyo')).toBe('nano-banana-2');
  });

  it('should resolve nano-banana-2-edit pro to poyo name', () => {
    expect(resolveForProvider('google/nano-banana-2-edit', 'poyo')).toBe('nano-banana-2-edit');
  });

  it('should resolve registered model to openrouter name', () => {
    expect(resolveForProvider('anthropic/claude-sonnet-4', 'openrouter')).toBe(
      'anthropic/claude-sonnet-4',
    );
  });

  it('should pass through unregistered model for openrouter', () => {
    expect(resolveForProvider('meta/llama-4-scout', 'openrouter')).toBe('meta/llama-4-scout');
  });

  it('should throw for unregistered model on copilot', () => {
    expect(() => resolveForProvider('meta/llama-4-scout', 'copilot')).toThrow('Unknown model');
    expect(() => resolveForProvider('meta/llama-4-scout', 'copilot')).toThrow(
      'cc-hub models list',
    );
  });

  it('should throw for unregistered model on poyo', () => {
    expect(() => resolveForProvider('meta/llama-4-scout', 'poyo')).toThrow('Unknown model');
  });

  it('should throw with helpful message for registered model unavailable on provider', () => {
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
  it('should convert standard ID with slash', () => {
    expect(modelToSlug('anthropic/claude-sonnet-4')).toBe('anthropic-claude-sonnet-4');
  });

  it('should handle codex ID (already no dots)', () => {
    expect(modelToSlug('openai/gpt-53-codex')).toBe('openai-gpt-53-codex');
  });

  it('should convert poyo image model ID', () => {
    expect(modelToSlug('google/gemini-3.1-flash-image')).toBe('google-gemini-31-flash-image');
  });

  it('should strip dots from kling ID', () => {
    expect(modelToSlug('kuaishou/kling-3.0-pro')).toBe('kuaishou-kling-30-pro');
  });

  it('should return empty for empty string', () => {
    expect(modelToSlug('')).toBe('');
  });

  it('should lowercase uppercase input', () => {
    expect(modelToSlug('OpenAI/GPT-4.1')).toBe('openai-gpt-41');
  });
});

// ---------------------------------------------------------------------------
// listModels
// ---------------------------------------------------------------------------
describe('listModels', () => {
  it('should return all models when no filter', () => {
    const all = listModels();
    expect(all.length).toBeGreaterThan(0);
  });

  it('should filter by type', () => {
    const images = listModels({ type: 'image' });
    expect(images.length).toBeGreaterThan(0);
    expect(images.every((m) => m.type === 'image')).toBe(true);
  });

  it('should filter by provider', () => {
    const copilot = listModels({ provider: 'copilot' });
    expect(copilot.length).toBeGreaterThan(0);
    expect(copilot.every((m) => m.providers.copilot !== undefined)).toBe(true);
  });

  it('should apply combined type + provider filter', () => {
    const textPoyo = listModels({ type: 'text', provider: 'poyo' });
    expect(textPoyo.every((m) => m.type === 'text' && m.providers.poyo !== undefined)).toBe(true);
  });

  it('should return empty array when no matches', () => {
    const result = listModels({ type: 'audio', provider: 'copilot' });
    expect(result).toEqual([]);
  });
});
