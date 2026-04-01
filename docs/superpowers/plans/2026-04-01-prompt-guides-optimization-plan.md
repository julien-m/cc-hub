# Prompt Guides Optimization — Implementation Plan

## Tasks

### Phase 1: Update Templates (sequential — templates inform guide rewrites)

1. **Rewrite `type-text-template.md`** — New 6-section structure: Prompting Identity, Prompt Recipe by Task Type, Prompt Structure, Model-Specific Techniques, Do/Don't, Sources
2. **Rewrite `type-image-template.md`** — New 5-section structure: Prompting Identity, Prompt Structure, Style & Keywords, Do/Don't, Sources
3. **Rewrite `type-video-template.md`** — New 5-section structure: Prompting Identity, Prompt Structure, Motion & Camera Keywords, Do/Don't, Sources
4. **Rewrite `type-audio-template.md`** — New 4-section structure: Prompting Identity, Configuration, Do/Don't, Sources
5. **Update `guide-output.md`** — New section numbering, remove spec-heavy minimums, update format example
6. **Update `SKILL.md`** — Shift research focus, update quality rubric, reference new templates

### Phase 2: Rewrite Guides (parallel by provider)

7. **Anthropic text guides** (5): claude-opus-4.6, claude-sonnet-4.6, claude-haiku-4.5, claude-opus-4.5, claude-sonnet-4.5
8. **OpenAI text guides** (4): gpt-5.4, gpt-5.2, gpt-5.2-codex, gpt-5.3-codex, gpt-5-mini
9. **Google text guides** (6): gemini-2.5-flash, gemini-2.5-flash-lite, gemini-3-flash, gemini-3-pro, gemini-3.1-flash-lite, gemini-3.1-pro
10. **Image guides** (1): gemini-3.1-flash-image (nano-banana-2)
11. **Video guides** (4): kling-3.0-pro, kling-3.0-motion-control, veo-3.1-fast, veo-3.1-quality, sora-2-pro
12. **Audio guide** (1): soniox
