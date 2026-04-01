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

## 1. Core Prompting Rules

{5-10 operational rules for text, 3-8 for non-text}

## 2. Block Catalog                         ← text only
OR
## 2. Prompt Structure                       ← image/video
OR
## 2. Configuration                          ← audio

{See type-specific template for content}

## 3-N. {Remaining sections per type template}

## N. Sources

- [Descriptive title](URL)
```

## Section Mapping by Type

| Type | Sections |
|------|----------|
| text | 1. Core Prompting Rules → 2. Block Catalog (2a. Prompt Blocks + 2b. API Controls) → 3. Task Recipes → 4. Anti-Patterns → 5. Sources |
| image | 1. Core Prompting Rules → 2. Prompt Structure → 3. Style & Keywords → 4. Anti-Patterns → 5. Sources |
| video | 1. Core Prompting Rules → 2. Prompt Structure → 3. Motion & Camera Keywords → 4. Anti-Patterns → 5. Sources |
| audio | 1. Core Prompting Rules → 2. Configuration → 3. Anti-Patterns → 4. Sources |
| music | Uses audio template (type=audio in frontmatter) |

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
- Numbered sections with H2: `## 1. Core Prompting Rules`, `## 2. ...`
- Last section always: `## N. Sources`
- No `---` separators in body (reserved for frontmatter)
- Code examples in fenced code blocks with language tag
- Python SDK code for API controls (not just prompt text)
- **No pricing, benchmarks, release dates, or capability lists**

### Size Budget

- **Text guides:** max 200 lines
- **Non-text guides (image/video/audio):** max 120 lines

### Mandatory Minimums

| Element | text | image | video | audio |
|---------|------|-------|-------|-------|
| Core Prompting Rules | 5+ | 4+ | 4+ | 3+ |
| Block Catalog entries (prompt blocks) | 6+ | — | — | — |
| API Controls entries | 4+ | — | — | — |
| Task Recipes (with block references) | 4+ | — | — | — |
| Anti-Patterns (bad/better/why) | 8+ | 5+ | 5+ | 5+ |
| Sources (real URLs) | 5+ | 5+ | 5+ | 5+ |

### Slug and Output Path

File saved at `~/.claude-hub/prompts/{slug}.md` where slug is:
1. Replace `/` with `-`
2. Remove any character that is not `[a-z0-9-]`
3. All lowercase

Examples:
- `anthropic/claude-sonnet-4.6` → `anthropic-claude-sonnet-46.md`
- `openai/gpt-5.2` → `openai-gpt-52.md`
- `nano-banana-2-new` → `nano-banana-2-new.md`
