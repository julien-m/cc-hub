# Template: Prompt Guide for Text/LLM Models

## Mandatory Sections

Each guide for a `text` model MUST contain these sections in this order.
The guide is consumed by an AI assistant (Claude Code) to craft optimal prompts for the target model. Write as a parsable reference document, not a marketing page.

**Critical rule:** No pricing, benchmarks, release dates, or capability lists. Only information that directly affects how to write prompts.

---

### 1. Prompting Identity

**Content (3-8 lines max):**
- What makes prompting THIS model unique vs its siblings/predecessors
- Behavioral shifts from previous version (migration-critical)
- The single most important thing to know before writing a prompt
- Anti-patterns specific to this model (what triggers bad results)

**Quality criteria:**
- Every line must affect how you write prompts
- No specs, no benchmarks, no "strengths and limitations" lists
- If migrating from a previous model, lead with what changed

---

### 2. Prompt Recipe by Task Type

**Content:**
- 4+ task-type recipes minimum
- Each recipe is a prompt template with tagged blocks

**Standard recipes (adapt to model):**

| Task Type | Required Blocks |
|-----------|----------------|
| Coding / debugging | `<task>`, `<output_contract>`, `<verification_loop>`, `<completeness_contract>` |
| Review / analysis | `<task>`, `<output_contract>`, `<grounding_rules>`, `<dig_deeper_nudge>` |
| Research / synthesis | `<task>`, `<research_mode>`, `<citation_rules>`, `<output_contract>` |
| Agentic / tool-use | `<task>`, `<action_safety>`, `<default_follow_through_policy>`, `<verification_loop>` |

**Each recipe must include:**
- The tagged block template (copy-paste ready)
- When to use this recipe
- What the model does differently with these blocks vs without

**Quality criteria:**
- Recipes must be specific to this model's behavior (not generic)
- Use the model's native tag/message conventions (XML for Claude, developer messages for OpenAI, system instructions for Gemini)
- Each recipe is self-contained and copy-paste ready

---

### 3. Prompt Structure

**Content:**
- Message structure (system/developer/user/assistant — use the model's terminology)
- Tag conventions if applicable (XML tags for Claude, etc.)
- Ordering rules: where to place context, instructions, examples, constraints
- Long-context ordering (documents first, query last — or model-specific rule)
- One complete copy-paste example showing optimal structure

**Quality criteria:**
- The example must be realistic and non-trivial
- Show hierarchy: system/developer → context → instructions → examples → constraints

---

### 4. Model-Specific Techniques

**Content:**
- API features that change how you prompt:
  - Structured outputs / JSON mode (with Python SDK code)
  - Tool use / function calling (with strict mode if available)
  - Thinking / reasoning modes (effort levels, adaptive thinking)
  - Vision / multimodal (if supported — how to structure image+text)
  - Context management (compaction, caching, multi-turn)
- Effort/reasoning level table: task type → recommended level
- Each technique with a Python SDK snippet

**Quality criteria:**
- Only features that change prompting behavior (not generic API calls)
- Code must be copy-paste ready with correct model IDs
- Effort table must map to concrete task types

---

### 5. Do / Don't

**Content:**
- 8+ before/after pairs minimum
- Format: bad prompt → good prompt → one-line explanation
- Must be model-specific (not "be clear and specific")

**Categories to cover:**
- Over-prompting / under-prompting
- Wrong reasoning effort
- Poor output contracts
- Vague vs structured instructions
- Context ordering mistakes
- Model-specific anti-patterns

**Quality criteria:**
- Each pair must reference a technique from the guide
- The "why" must be specific to this model's behavior
- Mix simple and advanced examples

---

### 6. Sources

**Content:**
- URLs consulted during research
- Format: `- [Descriptive title](URL)`
- Official docs first, community resources second

**Quality criteria:**
- Only actually consulted URLs
- Never invent a URL
- 5+ minimum
