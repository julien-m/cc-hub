# Plan: Integrate xai/grok-4.20

## Tasks

### Task 1: Add model to registry
- **File:** `src/data/models.ts`
- **Action:** Add `xai/grok-4.20` entry after `xai/grok-4.1-fast` (line 157)
- **Provider mapping:** `openrouter: 'x-ai/grok-4.20'`
- **Verify:** TypeScript compiles, model appears in `cc-hub models list`

### Task 2: Generate prompt guide
- **Action:** Run `/prompt-guide --model xai/grok-4.20`
- **Output:** `~/.claude-hub/prompts/xai-grok-420.md`
- **Format:** Block-based operator style (per user feedback)
- **Verify:** `cc-hub prompt get --model xai/grok-4.20` returns content

## Execution Order

Sequential: Task 1 → Task 2 (prompt guide needs the model registered first for slug resolution)
