# Output Format for Prompt Guides

The generated guide MUST follow exactly this format.

## Format

```
---
model: {model_id}
type: {type}
provider: {provider_name}
last_updated: {YYYY-MM-DD}
---

# Prompt Guide: {Model Display Name}

## 1. Prompting Identity

{3-8 lines: what makes this model's prompting unique, behavioral shifts, anti-patterns}

## 2. Prompt Recipe by Task Type          ← text only
OR
## 2. Prompt Structure                     ← image/video/audio

{See type-specific template for content}

## 3-N. {Remaining sections per type template}

## N. Sources

- [Descriptive title](URL)
```

## Section Mapping by Type

| Type | Sections |
|------|----------|
| text | 1. Prompting Identity → 2. Prompt Recipe by Task Type → 3. Prompt Structure → 4. Model-Specific Techniques → 5. Do / Don't → 6. Sources |
| image | 1. Prompting Identity → 2. Prompt Structure → 3. Style & Keywords → 4. Do / Don't → 5. Sources |
| video | 1. Prompting Identity → 2. Prompt Structure → 3. Motion & Camera Keywords → 4. Do / Don't → 5. Sources |
| audio | 1. Prompting Identity → 2. Configuration → 3. Do / Don't → 4. Sources |

## Critical Rules

### Frontmatter

- Delimiters: `---` (three dashes) at start and end
- **NEVER** use code fence ` ```yaml ` around frontmatter
- Required fields: `model`, `type`, `provider`, `last_updated`
- `model`: exact identifier as provided (e.g., `anthropic/claude-sonnet-4.6`)
- `type`: one of `text`, `image`, `video`, `audio`
- `provider`: real provider name — **NEVER "PlaceholderAI"**
- `last_updated`: today's date in `YYYY-MM-DD` — **NEVER an invented date**

### Content

- Language: English
- H1 title: `# Prompt Guide: {Model Display Name}`
- Numbered sections with H2: `## 1. Prompting Identity`, `## 2. ...`
- Last section always: `## N. Sources`
- No `---` separators in body (reserved for frontmatter)
- Code examples in fenced code blocks with language tag
- Include Python SDK code for API features (not just prompt text)
- **No pricing, benchmarks, release dates, or capability lists**

### Mandatory Minimums

| Element | text | image | video | audio |
|---------|------|-------|-------|-------|
| Task recipes (with tagged blocks) | 4 | — | — | — |
| Do / Don't pairs (before/after) | 8 | 5 | 5 | 5 |
| Sources (real URLs) | 5 | 5 | 5 | 5 |

### Slug and Output Path

File saved at `~/.claude-hub/prompts/{slug}.md` where slug is:
1. Replace `/` with `-`
2. Remove any character that is not `[a-z0-9-]`
3. All lowercase

Examples:
- `anthropic/claude-sonnet-4.6` → `anthropic-claude-sonnet-46.md`
- `openai/gpt-5.2` → `openai-gpt-52.md`
- `nano-banana-2-new` → `nano-banana-2-new.md`
