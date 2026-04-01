export type ModelType = 'text' | 'image' | 'video' | 'audio' | 'music';
export const VALID_TYPES: readonly ModelType[] = ['text', 'image', 'video', 'audio', 'music'];

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
      poyo: 'claude-opus-4-5-20251101',
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
      poyo: 'claude-sonnet-4-5-20250929',
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
      poyo: 'claude-haiku-4-5-20251001',
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
      poyo: 'gemini-3-pro-preview',
    },
  },
  {
    id: 'google/gemini-3-flash',
    type: 'text',
    providers: {
      openrouter: 'google/gemini-3-flash-preview',
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

  // --- Poyo image models ---
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
    id: 'google/nano-banana-2',
    type: 'image',
    providers: {
      poyo: 'nano-banana-2',
    },
  },
  {
    id: 'google/nano-banana-2-edit',
    type: 'image',
    providers: {
      poyo: 'nano-banana-2-edit',
    },
  },
  {
    id: 'google/nano-banana',
    type: 'image',
    providers: {
      poyo: 'nano-banana',
    },
  },
  {
    id: 'google/nano-banana-edit',
    type: 'image',
    providers: {
      poyo: 'nano-banana-edit',
    },
  },
  {
    id: 'bytedance/seedream-5.0-lite',
    type: 'image',
    providers: {
      poyo: 'seedream-5.0-lite',
    },
  },
  {
    id: 'bytedance/seedream-5.0-lite-edit',
    type: 'image',
    providers: {
      poyo: 'seedream-5.0-lite-edit',
    },
  },
  {
    id: 'bytedance/seedream-4.5',
    type: 'image',
    providers: {
      poyo: 'seedream-4.5',
    },
  },
  {
    id: 'bytedance/seedream-4.5-edit',
    type: 'image',
    providers: {
      poyo: 'seedream-4.5-edit',
    },
  },
  {
    id: 'openai/gpt-image-1.5',
    type: 'image',
    providers: {
      poyo: 'gpt-image-1.5',
    },
  },
  {
    id: 'openai/gpt-image-1.5-edit',
    type: 'image',
    providers: {
      poyo: 'gpt-image-1.5-edit',
    },
  },
  {
    id: 'openai/gpt-4o-image',
    type: 'image',
    providers: {
      poyo: 'gpt-4o-image',
    },
  },
  {
    id: 'openai/gpt-4o-image-edit',
    type: 'image',
    providers: {
      poyo: 'gpt-4o-image-edit',
    },
  },
  {
    id: 'openai/z-image',
    type: 'image',
    providers: {
      poyo: 'z-image',
    },
  },
  {
    id: 'bfl/flux-2-pro',
    type: 'image',
    providers: {
      poyo: 'flux-2-pro',
    },
  },
  {
    id: 'bfl/flux-2-pro-edit',
    type: 'image',
    providers: {
      poyo: 'flux-2-pro-edit',
    },
  },
  {
    id: 'bfl/flux-2-flex',
    type: 'image',
    providers: {
      poyo: 'flux-2-flex',
    },
  },
  {
    id: 'bfl/flux-2-flex-edit',
    type: 'image',
    providers: {
      poyo: 'flux-2-flex-edit',
    },
  },
  {
    id: 'xai/grok-imagine',
    type: 'image',
    providers: {
      poyo: 'grok-imagine-image',
    },
  },

  // --- Poyo video models ---
  {
    id: 'openai/sora-2-official',
    type: 'video',
    providers: {
      poyo: 'sora-2-official',
    },
  },
  {
    id: 'openai/sora-2',
    type: 'video',
    providers: {
      poyo: 'sora-2',
    },
  },
  {
    id: 'openai/sora-2-pro',
    type: 'video',
    providers: {
      poyo: 'sora-2-pro',
    },
  },
  {
    id: 'openai/sora-2-stable',
    type: 'video',
    providers: {
      poyo: 'sora-2-stable',
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
    id: 'kuaishou/kling-2.6',
    type: 'video',
    providers: {
      poyo: 'kling-2-6',
    },
  },
  {
    id: 'kuaishou/kling-2.6-motion-control',
    type: 'video',
    providers: {
      poyo: 'kling-2-6-motion-control',
    },
  },
  {
    id: 'kuaishou/kling-2.5-turbo-pro',
    type: 'video',
    providers: {
      poyo: 'kling-2-5-turbo-pro',
    },
  },
  {
    id: 'kuaishou/kling-2.1-standard',
    type: 'video',
    providers: {
      poyo: 'kling-2-1/standard',
    },
  },
  {
    id: 'kuaishou/kling-2.1-pro',
    type: 'video',
    providers: {
      poyo: 'kling-2-1/pro',
    },
  },
  {
    id: 'minimax/hailuo-2.3',
    type: 'video',
    providers: {
      poyo: 'hailuo-2-3',
    },
  },
  {
    id: 'minimax/hailuo-02',
    type: 'video',
    providers: {
      poyo: 'hailuo-02',
    },
  },
  {
    id: 'minimax/hailuo-02-pro',
    type: 'video',
    providers: {
      poyo: 'hailuo-02-pro',
    },
  },
  {
    id: 'alibaba/wan-2.2-text-to-video-fast',
    type: 'video',
    providers: {
      poyo: 'wan2.2-text-to-video-fast',
    },
  },
  {
    id: 'alibaba/wan-2.2-image-to-video-fast',
    type: 'video',
    providers: {
      poyo: 'wan2.2-image-to-video-fast',
    },
  },
  {
    id: 'alibaba/wan-2.5-text-to-video',
    type: 'video',
    providers: {
      poyo: 'wan2.5-text-to-video',
    },
  },
  {
    id: 'alibaba/wan-2.5-image-to-video',
    type: 'video',
    providers: {
      poyo: 'wan2.5-image-to-video',
    },
  },
  {
    id: 'alibaba/wan-2.6-text-to-video',
    type: 'video',
    providers: {
      poyo: 'wan2.6-text-to-video',
    },
  },
  {
    id: 'alibaba/wan-2.6-image-to-video',
    type: 'video',
    providers: {
      poyo: 'wan2.6-image-to-video',
    },
  },
  {
    id: 'alibaba/wan-2.6-video-to-video',
    type: 'video',
    providers: {
      poyo: 'wan2.6-video-to-video',
    },
  },
  {
    id: 'alibaba/wan-animate-move',
    type: 'video',
    providers: {
      poyo: 'wan-animate-move',
    },
  },
  {
    id: 'alibaba/wan-animate-replace',
    type: 'video',
    providers: {
      poyo: 'wan-animate-replace',
    },
  },
  {
    id: 'bytedance/seedance-1.0-pro',
    type: 'video',
    providers: {
      poyo: 'seedance-1-0-pro',
    },
  },
  {
    id: 'bytedance/seedance-1.5-pro',
    type: 'video',
    providers: {
      poyo: 'seedance-1.5-pro',
    },
  },
  {
    id: 'runway/gen-4.5',
    type: 'video',
    providers: {
      poyo: 'runway-gen-4-5',
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
    id: 'xai/grok-imagine-video',
    type: 'video',
    providers: {
      poyo: 'grok-imagine',
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

  // --- Poyo music models ---
  {
    id: 'poyo/generate-music',
    type: 'music',
    providers: {
      poyo: 'generate-music',
    },
  },
  {
    id: 'poyo/extend-music',
    type: 'music',
    providers: {
      poyo: 'extend-music',
    },
  },
  {
    id: 'poyo/upload-and-cover-audio',
    type: 'music',
    providers: {
      poyo: 'upload-and-cover-audio',
    },
  },
  {
    id: 'poyo/upload-and-extend-audio',
    type: 'music',
    providers: {
      poyo: 'upload-and-extend-audio',
    },
  },
  {
    id: 'poyo/add-instrumental',
    type: 'music',
    providers: {
      poyo: 'add-instrumental',
    },
  },
  {
    id: 'poyo/add-vocals',
    type: 'music',
    providers: {
      poyo: 'add-vocals',
    },
  },
  {
    id: 'poyo/get-timestamped-lyrics',
    type: 'music',
    providers: {
      poyo: 'get-timestamped-lyrics',
    },
  },
  {
    id: 'poyo/boost-music-style',
    type: 'music',
    providers: {
      poyo: 'boost-music-style',
    },
  },
  {
    id: 'poyo/generate-music-cover',
    type: 'music',
    providers: {
      poyo: 'generate-music-cover',
    },
  },
  {
    id: 'poyo/replace-section',
    type: 'music',
    providers: {
      poyo: 'replace-section',
    },
  },
  {
    id: 'poyo/generate-persona',
    type: 'music',
    providers: {
      poyo: 'generate-persona',
    },
  },
  {
    id: 'poyo/generate-lyrics',
    type: 'music',
    providers: {
      poyo: 'generate-lyrics',
    },
  },
  {
    id: 'poyo/convert-to-wav',
    type: 'music',
    providers: {
      poyo: 'convert-to-wav',
    },
  },
  {
    id: 'poyo/separate-vocals',
    type: 'music',
    providers: {
      poyo: 'separate-vocals',
    },
  },
  {
    id: 'poyo/stem-split',
    type: 'music',
    providers: {
      poyo: 'stem-split',
    },
  },
  {
    id: 'poyo/upload-and-separate-vocals',
    type: 'music',
    providers: {
      poyo: 'upload-and-separate-vocals',
    },
  },
  {
    id: 'poyo/create-music-video',
    type: 'music',
    providers: {
      poyo: 'create-music-video',
    },
  },
];
