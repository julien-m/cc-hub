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
