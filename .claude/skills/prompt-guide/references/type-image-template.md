# Template: Prompt Guide for Image Models

## Mandatory Sections

Each guide for an `image` model MUST contain these sections in this order.
The guide is consumed by an AI assistant to craft optimal image generation prompts. Write as a parsable reference, not a product page.

**Critical rule:** No pricing, resolution tables, or generation speed benchmarks. Only information that directly affects how to write prompts.

---

### 1. Prompting Identity

**Content (3-8 lines max):**
- How this model interprets prompts (literal vs creative, long vs short prompts)
- What distinguishes its prompt style from other image models
- Supported languages for prompts
- Anti-patterns that produce bad results

**Quality criteria:**
- Every line must affect how you write prompts
- No specs or capability lists

---

### 2. Prompt Structure

**Content:**
- Recommended element order for prompts:
  1. Subject (who/what)
  2. Action / pose
  3. Setting / environment
  4. Style
  5. Lighting
  6. Camera angle
  7. Mood / atmosphere
- Syntax rules (weight syntax, separators, parentheses — if supported)
- Optimal prompt length for this model
- One complete copy-paste example

**Quality criteria:**
- Order must be validated by docs or community experience
- Include model-specific syntax (not generic Stable Diffusion syntax)

---

### 3. Style & Keywords

**Content:**
- Keywords VERIFIED to work with this model, categorized:
  - Art style (photorealistic, illustration, watercolor, etc.)
  - Lighting (golden hour, rim light, studio, etc.)
  - Camera (close-up, aerial, fisheye, etc.)
  - Mood (cinematic, ethereal, dramatic, etc.)
  - Medium (oil painting, digital art, pencil sketch, etc.)
- Negative prompt keywords (if supported)
- Weight/emphasis syntax (if supported)

**Quality criteria:**
- ONLY keywords verified for this model
- Do NOT copy generic keyword lists from other models
- Note if keywords are undocumented (suggest testing)

---

### 4. Do / Don't

**Content:**
- 5+ before/after prompt pairs
- Format: weak prompt → optimized prompt → explanation
- Cover: vague descriptions, style conflicts, over-stuffing, resolution mismatches

**Quality criteria:**
- Model-specific, not generic advice
- Show concrete visual impact of each improvement

---

### 5. Sources

- 5+ URLs consulted
- Format: `- [Descriptive title](URL)`
- Only actually consulted URLs
