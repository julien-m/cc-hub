# Template: Prompt Guide for Video Models

## Mandatory Sections

Each guide for a `video` model MUST contain these sections in this order.
The guide is consumed by an AI assistant to craft optimal video generation prompts.

**Critical rule:** No pricing, FPS tables, or benchmark scores. Only information that directly affects how to write prompts. Duration and resolution constraints are kept ONLY when they affect prompt strategy.

---

### 1. Core Prompting Rules

**Content (3-8 lines max):**
- Hard constraints on duration/input that affect prompt strategy (e.g., "5s max means one action per clip")
- How this model interprets motion/temporal descriptions
- Input modes that change prompting (text-only vs image-to-video vs multi-shot)
- Anti-patterns specific to this model

**Quality criteria:**
- Every line is a rule that directly changes how you write prompts
- Keep duration/resolution only if they change prompt strategy

---

### 2. Prompt Structure

**Content:**
- Recommended element order:
  1. Subject
  2. Movement / action (CRITICAL for video)
  3. Setting / environment
  4. Camera movement
  5. Style
  6. Temporal flow (start → middle → end)
- Model-specific syntax (shot separators, reference image syntax like `@image_1`)
- How to describe temporal progression
- One complete copy-paste example

**Quality criteria:**
- Temporal flow description is mandatory (video, not image)
- Include model-specific syntax, not generic advice

---

### 3. Motion & Camera Keywords

**Content:**
- Keywords VERIFIED for this model:
  - Camera movements (pan, tilt, dolly, tracking, crane, orbit)
  - Subject movements (walk, run, turn, gesture)
  - Transitions (fade, cut, morph)
  - Speed effects (slow motion, time-lapse, speed ramp)
- Impact of each keyword on the output

**Quality criteria:**
- ONLY keywords verified for this model
- Note if keywords are undocumented

---

### 4. Anti-Patterns

**Content:**
- 5+ entries, each with: anti-pattern name, Bad prompt, Better prompt, Why (one-line explanation)
- Cover: static descriptions, too many subjects, contradictory movements, missing temporal flow

**Quality criteria:**
- Video-specific problems (not image advice repackaged)
- Show impact on motion and coherence

---

### 5. Sources

- 5+ URLs consulted
- Format: `- [Descriptive title](URL)`
- Only actually consulted URLs
