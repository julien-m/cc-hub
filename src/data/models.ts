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
      copilot: 'claude-opus-4.6',
    },
  },
  {
    id: 'anthropic/claude-opus-4.5',
    type: 'text',
    providers: {
      openrouter: 'anthropic/claude-opus-4.5',
      copilot: 'claude-opus-4.5',
    },
  },
  {
    id: 'anthropic/claude-sonnet-4.6',
    type: 'text',
    providers: {
      openrouter: 'anthropic/claude-sonnet-4.6',
      copilot: 'claude-sonnet-4.6',
    },
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    type: 'text',
    providers: {
      openrouter: 'anthropic/claude-sonnet-4.5',
      copilot: 'claude-sonnet-4.5',
    },
  },
  {
    id: 'anthropic/claude-sonnet-4',
    type: 'text',
    providers: {
      openrouter: 'anthropic/claude-sonnet-4',
      copilot: 'claude-sonnet-4',
    },
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    type: 'text',
    providers: {
      openrouter: 'anthropic/claude-haiku-4.5',
      copilot: 'claude-haiku-4.5',
    },
  },

  // --- OpenAI ---
  // Codex models: OpenRouter strips dots in their slug (gpt-53-codex, not gpt-5.3-codex)
  {
    id: 'openai/gpt-5.4',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-5.4',
      copilot: 'gpt-5.4',
    },
  },
  {
    id: 'openai/gpt-53-codex',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-53-codex',
      copilot: 'gpt-5.3-codex',
    },
  },
  {
    id: 'openai/gpt-52-codex',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-52-codex',
      copilot: 'gpt-5.2-codex',
    },
  },
  {
    id: 'openai/gpt-5.2',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-5.2',
      copilot: 'gpt-5.2',
    },
  },
  {
    id: 'openai/gpt-51-codex-max',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-51-codex-max',
      copilot: 'gpt-5.1-codex-max',
    },
  },
  {
    id: 'openai/gpt-51-codex',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-51-codex',
      copilot: 'gpt-5.1-codex',
    },
  },
  {
    id: 'openai/gpt-5.1',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-5.1',
      copilot: 'gpt-5.1',
    },
  },
  {
    id: 'openai/gpt-5-mini',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-5-mini',
      copilot: 'gpt-5-mini',
    },
  },
  {
    id: 'openai/gpt-4.1',
    type: 'text',
    providers: {
      openrouter: 'openai/gpt-4.1',
      copilot: 'gpt-4.1',
    },
  },

  // --- Google ---
  {
    id: 'google/gemini-3-pro',
    type: 'text',
    providers: {
      openrouter: 'google/gemini-3-pro',
      poyo: 'gemini-3-pro-preview',
    },
  },
  {
    id: 'google/gemini-3-flash',
    type: 'text',
    providers: {
      openrouter: 'google/gemini-3-flash',
      poyo: 'gemini-3-flash-preview',
    },
  },
  {
    id: 'google/gemini-3.1-pro-preview',
    type: 'text',
    providers: {
      openrouter: 'google/gemini-3.1-pro-preview',
    },
  },
  {
    id: 'google/gemini-3.1-flash-lite-preview',
    type: 'text',
    providers: {
      openrouter: 'google/gemini-3.1-flash-lite-preview',
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
    id: 'google/gemini-3.1-flash-image',
    type: 'image',
    providers: {
      poyo: 'nano-banana-2-new',
    },
  },
  {
    id: 'google/gemini-3.1-flash-image-edit',
    type: 'image',
    providers: {
      poyo: 'nano-banana-2-new-edit',
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
  {
    id: 'kuaishou/kling-3.0-motion-control',
    type: 'video',
    providers: {
      poyo: 'kling-3.0-motion-control',
    },
  },
  {
    id: 'google/veo-3.1-fast',
    type: 'video',
    providers: {
      poyo: 'veo3.1-fast',
    },
  },
  {
    id: 'google/veo-3.1-quality',
    type: 'video',
    providers: {
      poyo: 'veo3.1-quality',
    },
  },
  {
    id: 'openai/sora-2-pro',
    type: 'video',
    providers: {
      poyo: 'sora-2-pro',
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
