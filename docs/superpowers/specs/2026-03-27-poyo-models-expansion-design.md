# Poyo Models Expansion — Design Spec

**Date:** 2026-03-27
**Status:** Approved

## Summary

Add all available Poyo models to the cc-hub model registry (+58 entries across video, image, music, and text) and implement a basic `cc-hub music generate` command for text-to-music generation.

## Scope

### In scope
- Add `music` as new `ModelType`
- Add 26 new video models to registry
- Add 15 new image models to registry
- Add 17 new music models to registry
- Add `poyo` provider to 3 existing Anthropic text models
- New `cc-hub music generate` command (text-to-music only)
- Update README.md and `.claude/rules/cc-hub.md`

### Out of scope
- Full music pipeline (extend, cover, vocals, stems, etc.) — future feature
- `--model` support for the motion command
- New commands for other music operations

## Canonical ID Convention

All models use `vendor/model-name` format. Vendor is the actual manufacturer:

| Poyo prefix | Canonical vendor | Rationale |
|---|---|---|
| kling-* | `kuaishou/` | Kuaishou makes Kling |
| hailuo-* | `minimax/` | MiniMax makes Hailuo |
| wan* | `alibaba/` | Alibaba makes Wan |
| seedance-*, seedream-* | `bytedance/` | ByteDance makes Seedance/Seedream |
| runway-* | `runway/` | Runway ML |
| veo*, nano-banana* | `google/` | Google DeepMind |
| sora-*, gpt-image-*, gpt-4o-image*, z-image | `openai/` | OpenAI |
| flux-* | `bfl/` | Black Forest Labs |
| grok-* | `xai/` | xAI |
| music models | `poyo/` | No identifiable manufacturer |

## Model Registry Changes

### New ModelType

```typescript
export type ModelType = 'text' | 'image' | 'video' | 'audio' | 'music';
export const VALID_TYPES: readonly ModelType[] = ['text', 'image', 'video', 'audio', 'music'];
```

### Video Models (+26)

| Canonical ID | Poyo model ID | Notes |
|---|---|---|
| `openai/sora-2-official` | `sora-2-official` | |
| `openai/sora-2` | `sora-2` | |
| `openai/sora-2-stable` | `sora-2-stable` | |
| `kuaishou/kling-2.6` | `kling-2-6` | |
| `kuaishou/kling-2.6-motion-control` | `kling-2-6-motion-control` | |
| `kuaishou/kling-2.5-turbo-pro` | `kling-2-5-turbo-pro` | |
| `kuaishou/kling-2.1-standard` | `kling-2-1/standard` | |
| `kuaishou/kling-2.1-pro` | `kling-2-1/pro` | |
| `minimax/hailuo-2.3` | `hailuo-2-3` | |
| `minimax/hailuo-02` | `hailuo-02` | |
| `minimax/hailuo-02-pro` | `hailuo-02-pro` | |
| `alibaba/wan-2.2-text-to-video-fast` | `wan2.2-text-to-video-fast` | |
| `alibaba/wan-2.2-image-to-video-fast` | `wan2.2-image-to-video-fast` | |
| `alibaba/wan-2.5-text-to-video` | `wan2.5-text-to-video` | |
| `alibaba/wan-2.5-image-to-video` | `wan2.5-image-to-video` | |
| `alibaba/wan-2.6-text-to-video` | `wan2.6-text-to-video` | |
| `alibaba/wan-2.6-image-to-video` | `wan2.6-image-to-video` | |
| `alibaba/wan-2.6-video-to-video` | `wan2.6-video-to-video` | |
| `alibaba/wan-animate-move` | `wan-animate-move` | |
| `alibaba/wan-animate-replace` | `wan-animate-replace` | |
| `bytedance/seedance-1.0-pro` | `seedance-1-0-pro` | |
| `bytedance/seedance-1.5-pro` | `seedance-1.5-pro` | |
| `runway/gen-4.5` | `runway-gen-4-5` | |
| `xai/grok-imagine-video` | `grok-imagine` | Renamed for clarity |
| `openai/sora-2-pro` | `sora-2-pro` | Already exists |
| `kuaishou/kling-3.0-pro` | `kling-3.0/pro` | Already exists |
| `kuaishou/kling-3.0-standard` | `kling-3.0/standard` | Already exists |
| `kuaishou/kling-3.0-motion-control` | `kling-3.0-motion-control` | Already exists |
| `google/veo-3.1-fast` | `veo3.1-fast` | Already exists |
| `google/veo-3.1-quality` | `veo3.1-quality` | Already exists |

**Skipped:** `seedance-2.0` (Coming soon, no pricing)

Net new: 24 entries (26 minus 2 that were already in the wrong count — grok-imagine-video is new, and the 6 existing ones stay).

Correction: 6 already exist, so net new = 26 - 6 = 20. Plus grok-imagine listed in video = 21. Plus grok-imagine-image goes to image. Let me recount:

Existing video: sora-2-pro, kling-3.0-pro, kling-3.0-standard, kling-3.0-motion-control, veo-3.1-fast, veo-3.1-quality = 6
New video: sora-2-official, sora-2, sora-2-stable, kling-2.6, kling-2.6-motion-control, kling-2.5-turbo-pro, kling-2.1-standard, kling-2.1-pro, hailuo-2.3, hailuo-02, hailuo-02-pro, wan-2.2-text-fast, wan-2.2-image-fast, wan-2.5-text, wan-2.5-image, wan-2.6-text, wan-2.6-image, wan-2.6-video, wan-animate-move, wan-animate-replace, seedance-1.0-pro, seedance-1.5-pro, runway-gen-4.5, xai/grok-imagine-video = **24 new**

### Image Models (+15)

| Canonical ID | Poyo model ID | Notes |
|---|---|---|
| `google/nano-banana` | `nano-banana` | |
| `google/nano-banana-edit` | `nano-banana-edit` | |
| `bytedance/seedream-5.0-lite` | `seedream-5.0-lite` | |
| `bytedance/seedream-5.0-lite-edit` | `seedream-5.0-lite-edit` | |
| `bytedance/seedream-4.5` | `seedream-4.5` | |
| `bytedance/seedream-4.5-edit` | `seedream-4.5-edit` | |
| `openai/gpt-image-1.5` | `gpt-image-1.5` | |
| `openai/gpt-image-1.5-edit` | `gpt-image-1.5-edit` | |
| `openai/gpt-4o-image` | `gpt-4o-image` | |
| `openai/gpt-4o-image-edit` | `gpt-4o-image-edit` | |
| `openai/z-image` | `z-image` | |
| `bfl/flux-2-pro` | `flux-2-pro` | |
| `bfl/flux-2-pro-edit` | `flux-2-pro-edit` | |
| `bfl/flux-2-flex` | `flux-2-flex` | |
| `bfl/flux-2-flex-edit` | `flux-2-flex-edit` | |
| `xai/grok-imagine` | `grok-imagine-image` | Image type despite being in Poyo video table |

Existing image: nano-banana-2-new, nano-banana-2-new-edit, nano-banana-2, nano-banana-2-edit = 4
Net new: **16 new** (15 from image table + grok-imagine-image moved to image type)

Wait — the user's image table has 19 entries. 4 already exist. So 15 new. Plus grok-imagine-image from the video table = 16. Let me just list exactly 16 new.

### Text Models (provider additions)

No new entries. Add `poyo` provider to existing models:

| Existing canonical ID | Poyo model ID |
|---|---|
| `anthropic/claude-opus-4.5` | `claude-opus-4-5-20251101` |
| `anthropic/claude-sonnet-4.5` | `claude-sonnet-4-5-20250929` |
| `anthropic/claude-haiku-4.5` | `claude-haiku-4-5-20251001` |

`google/gemini-3-pro` and `google/gemini-3-flash` already have poyo mappings.

### Music Models (+17, all new)

| Canonical ID | Poyo model ID |
|---|---|
| `poyo/generate-music` | `generate-music` |
| `poyo/extend-music` | `extend-music` |
| `poyo/upload-and-cover-audio` | `upload-and-cover-audio` |
| `poyo/upload-and-extend-audio` | `upload-and-extend-audio` |
| `poyo/add-instrumental` | `add-instrumental` |
| `poyo/add-vocals` | `add-vocals` |
| `poyo/get-timestamped-lyrics` | `get-timestamped-lyrics` |
| `poyo/boost-music-style` | `boost-music-style` |
| `poyo/generate-music-cover` | `generate-music-cover` |
| `poyo/replace-section` | `replace-section` |
| `poyo/generate-persona` | `generate-persona` |
| `poyo/generate-lyrics` | `generate-lyrics` |
| `poyo/convert-to-wav` | `convert-to-wav` |
| `poyo/separate-vocals` | `separate-vocals` |
| `poyo/stem-split` | `stem-split` |
| `poyo/upload-and-separate-vocals` | `upload-and-separate-vocals` |
| `poyo/create-music-video` | `create-music-video` |

## Music Command Design

### CLI Interface

```bash
cc-hub music generate <prompt> -o <path> [--model <model>]
```

- `<prompt>`: Text description of the music to generate
- `-o, --output <path>`: Required output path (.mp3)
- `--model <model>`: Override model (default: `poyo/generate-music`)

### Implementation

New file: `src/commands/music.ts`

Follows the same pattern as `video.ts`:
1. Resolve model via `resolveForProvider(model, 'poyo')`
2. Call `generateMedia()` with `{ model, input: { prompt } }`
3. Download result file to output path
4. Print path to stdout

### Registration

Add to `src/cli.ts`:
```typescript
import { createMusicCommand } from './commands/music.ts';
program.addCommand(createMusicCommand());
```

### Prompt Guide

Add `music` to the `FALLBACK_MODEL_BY_TYPE` map in `src/commands/prompt.ts`:
```typescript
music: 'poyo/generate-music',
```

## Documentation Updates

### README.md
- Add `music` command section
- Add `MUSIC_MODEL` env var
- Update models section with new counts
- Add new vendors to examples

### .claude/rules/cc-hub.md
- Add `cc-hub music generate` usage
- Add music models to available models list
- Update `--type` filter to include `music`

## Testing

- `cc-hub models list --type video` shows 30 entries
- `cc-hub models list --type image` shows 20 entries
- `cc-hub models list --type music` shows 17 entries
- `cc-hub models list --provider poyo` shows all poyo models
- `cc-hub music generate "upbeat jazz" -o test.mp3` generates music
- Existing commands (`imagine`, `video`, `motion`) continue working unchanged
