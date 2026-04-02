# Design: Integrate xai/grok-4.20

## Summary

Add the `xai/grok-4.20` text model to cc-hub's model registry with OpenRouter provider mapping, and generate its prompt guide.

## Architecture

No architectural changes. This follows the existing model registration pattern exactly.

### Model Entry

```typescript
{
  id: 'xai/grok-4.20',
  type: 'text',
  providers: {
    openrouter: 'x-ai/grok-4.20',
  },
}
```

- **Canonical ID:** `xai/grok-4.20` (matches `xai/grok-4.1-fast` convention)
- **OpenRouter mapping:** `x-ai/grok-4.20` (xAI uses `x-ai/` prefix on OpenRouter)
- **Position:** After `xai/grok-4.1-fast` in the `// --- xAI ---` section

### Prompt Guide

Generated via `/prompt-guide --model xai/grok-4.20`. Output: `~/.claude-hub/prompts/xai-grok-420.md`.

Format: block-based operator style (Core Rules, Block Catalog, Task Recipes, Anti-Patterns).

## Files Changed

| File | Change |
|------|--------|
| `src/data/models.ts` | Add model entry after line 157 |

## Files NOT Changed

- `README.md` — text models are not listed explicitly (discoverable via `cc-hub models list`)
- `.claude/rules/cc-hub.md` — same reasoning

## Testing

- `cc-hub models list --type text` shows the new model
- `cc-hub prompt get --model xai/grok-4.20` returns the generated guide
