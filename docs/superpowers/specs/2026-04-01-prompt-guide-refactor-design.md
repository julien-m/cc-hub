# Design Spec: Prompt Guide Refactor — Block-Based Operator Style

## Problem

Current prompt guides use an identity/description approach (personality, partial templates, separate API techniques). The OpenAI GPT-5.4 Codex prompting skill demonstrates a more effective block-based operator approach: reusable tagged blocks, complete recipes by task type, and explicit anti-patterns. Current guides average 250-450 lines with mixed actionability.

## Solution

Restructure the template system, skill, and output format to produce block-based operator-style guides. Each guide becomes a compact reference (~120-150 lines) that Claude Code can parse structurally: select recipe by task type, assemble indicated blocks, apply anti-patterns as checklist.

## Architecture

### New Section Structure (text models)

```
1. Core Prompting Rules (replaces "Prompting Identity")
2. Block Catalog
   2a. Prompt Blocks (tags/structure that go IN the prompt text)
   2b. API Controls (parameters that go in the API call envelope)
3. Task Recipes (4+ complete recipes with dynamic slots)
4. Anti-Patterns (replaces "Do/Don't")
5. Sources
```

### New Section Structure (image models)

```
1. Core Prompting Rules
2. Prompt Structure (element order, syntax, optimal length)
3. Style & Keywords (verified keywords by category)
4. Anti-Patterns
5. Sources
```

### New Section Structure (video models)

```
1. Core Prompting Rules
2. Prompt Structure (temporal flow, camera, subject)
3. Motion & Camera Keywords
4. Anti-Patterns
5. Sources
```

### New Section Structure (audio models)

```
1. Core Prompting Rules
2. Configuration (API parameters, input/output formats)
3. Anti-Patterns
4. Sources
```

## Section Details (text models)

### 1. Core Prompting Rules

**What it is:** 5-10 operational rules that govern how to prompt this model. Not personality. Not capabilities. Rules.

**Content:**
- Behavioral shifts from predecessor (migration-critical)
- Hard constraints (things that cause errors or degraded output)
- The model's native prompt conventions (XML tags, developer messages, system instructions)
- Optional: 2-line role preamble IF documented to improve output for this model

**Example (Claude Opus 4.6):**
```
- Takes instructions literally — request comprehensive output explicitly
- XML tags are non-negotiable: <context>, <instructions>, <constraints>, <examples>
- Over-engineering tendency: constrain scope explicitly or it creates unnecessary abstractions
- No prefilling: prefilled assistant messages return 400 errors, use structured outputs
- Documents at TOP, query at BOTTOM for 20K+ token inputs (30% quality improvement)
- System prompt amplification: avoid CRITICAL/MUST/ALWAYS — triggers overtriggering
```

### 2. Block Catalog

Two subsections, clearly separated.

**2a. Prompt Blocks** — Tags/structures that go inside the prompt text:

| Block | Purpose | When to use |
|-------|---------|-------------|
| `<task>` | Concrete job description | Every recipe |
| `<context>` | Stack, files, conventions | When model needs project context |
| `<output_contract>` | Shape, ordering, brevity | When format matters |
| `<verification_loop>` | Self-check before finalizing | Coding, debugging, review |
| `<grounding_rules>` | Evidence-based claims only | Research, review |
| `<completeness_contract>` | Don't stop early | Batch tasks, full reviews |
| `<action_safety>` | Scope constraints | Write-capable agentic tasks |
| `<default_follow_through_policy>` | Keep going vs stop and ask | Agentic workflows |

Each block: name, one-line purpose, 2-3 line example content.

**2b. API Controls** — Parameters in the API call envelope:

| Control | Values | Default | When to change |
|---------|--------|---------|---------------|
| `effort` / `reasoning` | low/medium/high/max | high | Match to task complexity |
| `structured_output` | Pydantic schema | none | When format must be exact |
| `thinking` | adaptive/manual | adaptive | Prefer adaptive |
| `compaction` | auto/none | none | Long agentic sessions |
| `vision.detail` | low/high/original | auto | Dense documents → high |

Each control: SDK code snippet showing how to set it.

### 3. Task Recipes

4-5 complete recipes per guide. Each recipe:
- Task type label (Coding, Review, Research, Agentic, Extraction)
- Which blocks from the catalog to assemble
- Complete prompt with dynamic slots (`{user_task}`, `{code_to_review}`, `{documents}`)
- API controls recommendation (effort level, structured output if applicable)

**Example recipe structure:**
```
### Coding

Blocks: <context> + <task> + <constraints> + <output_contract>
Effort: medium (single-file) | high (multi-file)

\```
<context>
{stack_and_conventions}
</context>

<task>
{user_task}
</task>

<constraints>
Only make changes directly requested. No new files unless explicitly needed.
No unnecessary abstractions or helper functions.
</constraints>

<output_contract>
Edit only specified files. Lead with 2-3 sentence summary, then complete modified files.
</output_contract>
\```
```

### 4. Anti-Patterns

8+ entries (text), 5+ (non-text). Format:
```
### {Anti-pattern name}

Bad:
\```
{problematic prompt or API call}
\```

Better:
\```
{corrected version}
\```

Why: {one-line model-specific explanation}
```

### 5. Sources

Same as current — real URLs only, 5+ minimum.

## Consumption Protocol

Update `cc-hub.md` rule to add structured consumption instructions. The protocol must work with both old-format and new-format guides (detect format by checking for "Block Catalog" section):

```
### How to use the guide

1. Read the first section (Core Prompting Rules or Prompting Identity) — apply to ALL prompts
2. Identify the task type (coding, review, research, agentic, extraction)
3. Select the matching recipe (Task Recipe or Prompt Recipe)
4. Customize dynamic slots with actual content
5. If Block Catalog exists: adjust API Controls per the recipe's recommendation
6. Check Anti-Patterns / Do-Don't before sending — verify none apply
```

## Section Mapping by Type (new format)

| Type | Sections |
|------|----------|
| text | 1. Core Prompting Rules → 2. Block Catalog (2a. Prompt Blocks + 2b. API Controls) → 3. Task Recipes → 4. Anti-Patterns → 5. Sources |
| image | 1. Core Prompting Rules → 2. Prompt Structure → 3. Style & Keywords → 4. Anti-Patterns → 5. Sources |
| video | 1. Core Prompting Rules → 2. Prompt Structure → 3. Motion & Camera Keywords → 4. Anti-Patterns → 5. Sources |
| audio | 1. Core Prompting Rules → 2. Configuration → 3. Anti-Patterns → 4. Sources |
| music | Uses audio template (type=audio in frontmatter) |

## Non-Text Section Rename Mapping

| Old section | New section |
|-------------|-------------|
| Prompting Identity | Core Prompting Rules |
| Do / Don't | Anti-Patterns |
| _(all other sections unchanged)_ | |

## Mandatory Minimums (new format)

| Element | text | image | video | audio |
|---------|------|-------|-------|-------|
| Core Prompting Rules | 5+ rules | 4+ rules | 4+ rules | 3+ rules |
| Block Catalog entries | 6+ | — | — | — |
| API Controls entries | 4+ | — | — | — |
| Task Recipes | 4+ | — | — | — |
| Anti-Patterns (bad/better/why) | 8+ | 5+ | 5+ | 5+ |
| Sources (real URLs) | 5+ | 5+ | 5+ | 5+ |

## Quality Rubric (new)

| Criterion | Weight | 5/5 means |
|-----------|--------|-----------|
| Core Prompting Rules | 15% | Operational rules only, no identity/marketing, migration-critical shifts |
| Block Catalog | 20% | Complete catalog with prompt blocks + API controls, SDK snippets |
| Task Recipes | 25% | 4+ complete recipes with dynamic slots, block assembly instructions |
| Anti-Patterns | 20% | 8+ model-specific bad/better/why entries |
| Actionable/copy-paste | 10% | All code and prompts ready to use, zero prose filler |
| Zero useless specs | 5% | No pricing, benchmarks, release dates, capability lists |
| Format/compatibility | 5% | Frontmatter `---`, correct slug, `cc-hub prompt` commands work |

## Size Budget

- Max 200 lines per text guide (was 150 — Block Catalog + complete recipes need space)
- Max 120 lines per image/video/audio guide
- Max 5 recipes per guide
- Anti-patterns: 8+ (text), 5+ (non-text) — no hard cap

## Files to Modify

| File | Change |
|------|--------|
| `references/type-text-template.md` | Full rewrite — new 5-section block-based structure |
| `references/type-image-template.md` | Rename: Identity → Core Rules, Do/Don't → Anti-Patterns |
| `references/type-video-template.md` | Rename: Identity → Core Rules, Do/Don't → Anti-Patterns |
| `references/type-audio-template.md` | Rename: Identity → Core Rules, Do/Don't → Anti-Patterns |
| `templates/guide-output.md` | Update section mapping table, mandatory minimums, rubric |
| `SKILL.md` | Update writing rules, quality rubric, block-based instructions |
| `.claude/rules/cc-hub.md` | Add consumption protocol (format-agnostic) |

## Migration

1. New template applies only to newly generated guides (`/prompt-guide`)
2. Consumption protocol is format-agnostic (works with old and new guides)
3. Existing 23 guides continue working as-is until individually regenerated
4. Bulk regeneration tracked as follow-up task (one `/prompt-guide` per model)

## Pilot Validation

After template/skill changes, manually generate one pilot guide (Claude Opus 4.6 — most-used model) using the new template. Compare side-by-side with the old guide to validate:
1. New format is more compact (target: ~180 lines vs current 259 lines)
2. Recipes are complete with dynamic slots, not partial templates
3. Block catalog makes the guide structurally parseable by Claude Code
4. Anti-patterns are clearer than Do/Don't pairs

## Out of Scope

- Bulk regeneration of all 23 guides (separate task, one /prompt-guide per model)
- Changes to `src/commands/prompt.ts` (command works with any .md format)
- Changes to `src/data/models.ts` (model registry is independent)
