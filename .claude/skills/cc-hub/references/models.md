# cc-hub — Modèles disponibles par commande

## Image (`cc-hub imagine`)

- Modèle par défaut : `google/gemini-3.1-flash-image`
- Disponibles : `google/gemini-3.1-flash-image`, `google/gemini-3.1-flash-image-edit`, `google/nano-banana-2` (pro), `google/nano-banana-2-edit`, `google/nano-banana`, `google/nano-banana-edit`, `bytedance/seedream-5.0-lite`, `bytedance/seedream-5.0-lite-edit`, `bytedance/seedream-4.5`, `bytedance/seedream-4.5-edit`, `openai/gpt-5.4-image-2`, `openai/gpt-5.4-image-2-edit`, `openai/gpt-image-1.5`, `openai/gpt-image-1.5-edit`, `openai/gpt-4o-image`, `openai/gpt-4o-image-edit`, `openai/z-image`, `bfl/flux-2-pro`, `bfl/flux-2-pro-edit`, `bfl/flux-2-flex`, `bfl/flux-2-flex-edit`, `xai/grok-imagine`
- Sizes : `1:1`, `16:9`, `9:16`, `3:2`, `2:3`, `4:3`, `3:4`, `4:5`, `5:4`, `21:9`
- Résolutions : `1K` (défaut), `2K`, `4K`

## Vidéo (`cc-hub video`)

- Modèle par défaut : `kuaishou/kling-3.0-pro`
- Disponibles : `kuaishou/kling-3.0-pro`, `kuaishou/kling-3.0-standard`, `kuaishou/kling-2.6`, `kuaishou/kling-2.6-motion-control`, `kuaishou/kling-2.5-turbo-pro`, `kuaishou/kling-2.1-standard`, `kuaishou/kling-2.1-pro`, `minimax/hailuo-2.3`, `minimax/hailuo-02`, `minimax/hailuo-02-pro`, `alibaba/wan-2.2-text-to-video-fast`, `alibaba/wan-2.2-image-to-video-fast`, `alibaba/wan-2.5-text-to-video`, `alibaba/wan-2.5-image-to-video`, `alibaba/wan-2.6-text-to-video`, `alibaba/wan-2.6-image-to-video`, `alibaba/wan-2.6-video-to-video`, `alibaba/wan-animate-move`, `alibaba/wan-animate-replace`, `bytedance/seedance-1.0-pro`, `bytedance/seedance-1.5-pro`, `runway/gen-4.5`, `google/veo-3.1-fast`, `google/veo-3.1-quality`, `openai/sora-2-official`, `openai/sora-2`, `openai/sora-2-pro`, `openai/sora-2-stable`, `xai/grok-imagine-video`
- Durée : 3-15 secondes (défaut : 5)
- Ratios : `16:9` (défaut), `1:1`, `9:16`

## Codex (`cc-hub codex`)

- Modèle par défaut : `openai/gpt-5.4`
- Disponibles : `openai/gpt-5.4`, `openai/gpt-5.4-mini`, `openai/gpt-53-codex`, `openai/gpt-53-codex-spark`

## Ask / Copilot (`cc-hub ask` / `cc-hub copilot`)

- Modèle par défaut : `openai/gpt-5.4` (copilot), configurable (ask)
- Format : canonical ID OpenRouter (`provider/model-name`)
- Voir `cc-hub models list --provider <provider>` pour la liste complète

## Musique (`cc-hub music`)

- Modèle par défaut : `poyo/generate-music`

## Motion Control (`cc-hub motion`)

- Modèle fixe : `kling-3.0-motion-control`
