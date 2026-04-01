# Prompt Guides Optimization — Design Spec

## Problem

The 23 prompt guides in `~/.claude-hub/prompts/` are model capability descriptions (specs, pricing, benchmarks) with prompting advice as a secondary concern. They should be the opposite: actionable prompting instructions with minimal context.

Reference: [OpenAI Codex GPT-5.4 prompting skill](https://github.com/openai/codex-plugin-cc/blob/main/plugins/codex/skills/gpt-5-4-prompting/SKILL.md) — pure operational guidance, zero specs.

## Consumer

These guides are consumed by Claude Code (via `cc-hub prompt get`) before calling another LLM. Claude already knows what models can do — it needs to know **how to prompt them effectively**.

## Design

### New Template Structure (type text)

```
## 1. Prompting Identity
- 3-5 lines max: what makes this model's prompting unique
- Behavioral shifts vs predecessor (migration-critical)
- What NOT to do (anti-patterns specific to this model)

## 2. Prompt Recipe by Task Type
- Coding/debugging → prompt template + verification blocks
- Review/analysis → prompt template + grounding rules
- Research/synthesis → prompt template + citation rules
- Agentic/tool-use → prompt template + safety blocks
- Each recipe: <task>, <output_contract>, <verification>, <grounding>

## 3. Prompt Structure
- Message structure (system/developer/user/assistant)
- XML tag conventions (if applicable)
- Ordering rules for long context
- Copy-paste example

## 4. Model-Specific Techniques
- API features that change prompting (structured outputs, tool use, thinking modes)
- Effort/reasoning level mapping by task type
- Vision/multimodal prompting (if applicable)
- Context management (compaction, caching)
- Code snippets (Python SDK)

## 5. Do / Don't
- 8+ before/after pairs
- Each pair: bad prompt → good prompt → why
- Model-specific, not generic advice

## 6. Sources
- URLs consulted (kept for traceability)
```

### Key Changes vs Current Structure

| Current | New |
|---------|-----|
| Section 1: 40+ lines of specs, pricing, benchmarks | Section 1: 5 lines of prompting identity |
| Techniques scattered across sections 2+4 | Section 2: task-based recipes (Codex style) |
| Best Practices + Common Mistakes = 2 sections | Merged into "Do / Don't" with before/after |
| Examples section (redundant with mistakes) | Folded into recipes and Do/Don't |
| 8 sections | 6 sections |

### What Gets Cut

- Pricing tables (irrelevant for prompting)
- Benchmark scores (GDPval, SWE-Bench, etc.)
- Release dates, knowledge cutoffs (Claude already knows)
- API availability lists (Bedrock, Vertex, etc.)
- "Ideal Use Cases" (capability description, not prompting)
- "Strengths" and "Limitations" (unless they affect prompting)
- Separate "Advanced Techniques" section (merged into recipes + techniques)

### What Gets Kept/Enhanced

- Behavioral shifts (critical for prompting migration)
- Effort/reasoning level tables (directly impacts prompting)
- XML tag conventions (model-specific prompting structure)
- Before/after prompt examples (core value)
- API code snippets for features that change prompting
- Task-type recipes (NEW — inspired by Codex reference)

### Template Changes for image/video/audio

Same philosophy: cut specs, keep prompting guidance.

**Image template:**
1. Prompting Identity (3-5 lines)
2. Prompt Structure (element order, syntax, weights)
3. Style & Keywords (verified for this model)
4. Do / Don't (before/after prompt pairs)
5. Sources

**Video template:**
1. Prompting Identity (3-5 lines, including duration/resolution constraints that affect prompting)
2. Prompt Structure (temporal flow, camera, movement)
3. Motion & Camera Keywords (verified)
4. Do / Don't (before/after)
5. Sources

**Audio template:**
1. Prompting Identity (3-5 lines)
2. Configuration (parameters that affect output quality)
3. Do / Don't (before/after)
4. Sources

### OpenAI Model Grouping

All GPT-5.x and Codex models share the same prompting philosophy:
- XML tags, output contracts, verification loops, reasoning effort
- Differences: context window size, reasoning levels available, specific features

Strategy: each guide is standalone but follows identical structure. No shared base file — keeps `cc-hub prompt get` simple (one file per model).

### guide-output.md Changes

Update the output format template to match new section numbering and remove spec-heavy minimums. New minimums:

| Element | Text | Image | Video | Audio |
|---------|------|-------|-------|-------|
| Task recipes | 4 | — | — | — |
| Do/Don't pairs | 8 | 5 | 5 | 5 |
| Sources | 5 | 5 | 5 | 5 |

### SKILL.md Changes

Update the `/prompt-guide` skill to:
- Reference new templates
- Shift research focus from "capabilities" to "prompting techniques"
- Remove requirement for pricing/benchmark research
- Add recipe-based structure guidance
- Update quality rubric to weight prompting content higher

### Implementation Order

1. Update 4 type templates (`references/type-{text,image,video,audio}-template.md`)
2. Update output format template (`templates/guide-output.md`)
3. Update SKILL.md quality rubric
4. Rewrite all 23 guides (parallel agents, grouped by provider)

### Guide Rewrite Strategy

For each guide:
1. Read existing content
2. Extract good prompting content from sections 2-7
3. Restructure into new format
4. Cut all spec/pricing/benchmark content
5. Add task-based recipes (text guides)
6. Write back

Group by provider for parallel processing:
- **Anthropic** (5 guides): claude-opus-4.6, claude-sonnet-4.6, claude-haiku-4.5, claude-opus-4.5, claude-sonnet-4.5
- **OpenAI** (6 guides): gpt-5.4, gpt-5.2, gpt-5.2-codex, gpt-5.3-codex, gpt-5-mini, sora-2-pro
- **Google** (9 guides): gemini-2.5-flash, gemini-2.5-flash-lite, gemini-3-flash, gemini-3-pro, gemini-3.1-flash-image, gemini-3.1-flash-lite, gemini-3.1-pro, veo-3.1-fast, veo-3.1-quality
- **Other** (3 guides): kling-3.0-pro, kling-3.0-motion-control, soniox
