# Template: Prompt Guide for Audio Models

## Mandatory Sections

Each guide for an `audio` model MUST contain these sections in this order.
The guide is consumed by an AI assistant to configure optimal audio processing.

**Critical rule:** No pricing or marketing claims. Only parameters and practices that affect output quality.

---

### 1. Core Prompting Rules

**Content (3-8 lines max):**
- What this model does (transcription, TTS, music generation, etc.)
- Hard constraints on input format/quality that affect output
- Key operational rules vs other audio models
- Anti-patterns to avoid

---

### 2. Configuration

**Content:**
- API parameters that affect output quality (with defaults and recommended values)
- Input format requirements (sample rate, encoding, channels)
- Output options (format, language, timestamps)
- Quality vs speed trade-offs

**Quality criteria:**
- Parameters must be exact with default values
- Include API call syntax if applicable

---

### 3. Anti-Patterns

**Content:**
- 5+ entries, each with: anti-pattern name, Bad example, Better example, Why (one-line explanation)
- Cover: wrong format, noisy input, bad parameters, chunking mistakes, language detection

**Quality criteria:**
- Specific to this model
- Include corrected configuration for each error

---

> **Note:** Music guides (`type: music`) use this template.

---

### 4. Sources

- 5+ URLs consulted
- Format: `- [Descriptive title](URL)`
- Only actually consulted URLs
