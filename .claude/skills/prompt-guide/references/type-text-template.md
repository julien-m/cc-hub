# Template: Text Model Prompt Guide

> This guide is consumed by an AI assistant (Claude Code) to craft optimal prompts. Write as a parsable operator reference.
> **Critical rule:** No pricing, benchmarks, release dates, or capability lists. Only information that directly affects how to write prompts.
> **Size budget:** Max 200 lines per generated guide.

---

## 1. Core Prompting Rules

**Content (5-10 operational rules max):**
- Behavioral shifts from predecessor (migration-critical — lead with these)
- Hard constraints (things that cause errors or degraded output)
- The model's native prompt conventions (XML tags, developer messages, system instructions)
- Optional: 2-line role preamble IF the model's docs show it improves output

**Quality criteria:**
- Every rule must directly affect prompting behavior
- No specs, benchmarks, marketing, or capability descriptions
- NOT a personality description — operational rules only
- If migrating from a previous model, lead with what changed

---

## 2. Block Catalog

Two subsections, clearly separated.

### 2a. Prompt Blocks

Tags/structures that go **inside the prompt text**.

**Format — table:**

| Block | Purpose | When to use |
|-------|---------|-------------|
| ... | One-line description | Trigger condition |

- Minimum 6 blocks
- Use the model's native tag conventions (XML for Claude, developer messages for OpenAI, system instructions for Gemini)

**After the table:** 2-3 line example content for each block showing realistic usage.

### 2b. API Controls

Parameters in the **API call envelope** (NOT in prompt text).

**Format — table:**

| Control | Values | Default | When to change |
|---------|--------|---------|----------------|
| ... | ... | ... | ... |

- Minimum 4 controls (reasoning effort, structured outputs, thinking mode, vision detail, compaction, etc.)

**After the table:** One Python SDK snippet per control showing how to set it.

**Quality criteria:**
- Clear separation between "what goes in prompt text" (2a) vs "what goes in API call" (2b)
- Every block/control must be model-specific, not generic

---

## 3. Task Recipes

**Content:** 4+ complete recipes minimum.

**Each recipe format:**
```
### {Task Type} (Coding | Review | Research | Agentic | ...)
Blocks: {list block names from Block Catalog}
API: {effort/control recommendation}

{Complete prompt template with dynamic slots}
```

**Dynamic slots use semantic names:** `{user_task}`, `{code_to_review}`, `{documents}`, `{repository_context}`, `{error_output}`, etc.

**Quality criteria:**
- Recipes must be model-specific and self-contained
- Copy-paste ready with slot substitution
- NOT zero-placeholder concrete examples
- NOT vague `{placeholder}` without semantic meaning
- Each recipe references blocks from Section 2a by name

---

## 4. Anti-Patterns

**Content:** 8+ entries minimum.

**Each entry format:**
```
### {Anti-pattern name}
Bad:
{problematic prompt or API call}
Better:
{corrected version}
Why: {one-line model-specific explanation}
```

**Categories to cover:**
- Over-prompting (redundant instructions the model handles natively)
- Under-prompting (missing structure the model needs)
- Wrong reasoning effort level
- Poor output contracts
- Vague instructions where structure is needed
- Context ordering mistakes
- Model-specific pitfalls (hallucination triggers, refusal patterns, format degradation)

**Quality criteria:**
- Must be model-specific, not generic advice
- Each entry references a concrete model behavior
- Mix simple and advanced examples

---

## 5. Sources

**Content:** Real URLs only, 5+ minimum.
**Format:** `- [Descriptive title](URL)`
- Official docs first, community resources second
- Never invent a URL
