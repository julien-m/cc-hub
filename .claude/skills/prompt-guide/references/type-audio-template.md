# Template: Prompt Guide for Audio Models

## Mandatory Sections

Each guide for an `audio` model MUST contain these sections in this order.
The guide is consumed by an AI assistant to configure optimal audio processing.

**Critical rule:** No pricing or marketing claims. Only parameters and practices that affect output quality.

---

### 1. Prompting Identity

**Content (3-8 lines max):**
- What this model does (transcription, TTS, music generation, etc.)
- How input quality affects output quality
- Key differentiator vs other audio models
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

### 3. Do / Don't

**Content:**
- 5+ before/after pairs
- Cover: wrong format, noisy input, bad parameters, chunking mistakes, language detection

**Quality criteria:**
- Specific to this model
- Include corrected configuration for each error

---

### 4. Sources

- 5+ URLs consulted
- Format: `- [Descriptive title](URL)`
- Only actually consulted URLs
