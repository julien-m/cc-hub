# Implementation Plan: Universal Stdin Prompt

## Task 1: Create `src/infra/prompt.ts`

New file with `resolvePrompt()` utility. Uses existing `readStdin()` from `stdin.ts`.

**Files:** `src/infra/prompt.ts` (create)

## Task 2: Refactor `ask` command

- Change `<prompt>` → `[prompt]`
- Replace inline stdin logic with `resolvePrompt()`
- Pass `resolved.prompt` and `resolved.stdin` to service

**Files:** `src/commands/ask.ts` (edit)

## Task 3: Refactor `copilot` command

Same pattern as Task 2.

**Files:** `src/commands/copilot.ts` (edit)

## Task 4: Refactor media commands (imagine, video, motion, music)

- Change `<prompt>` → `[prompt]`
- Add `resolvePrompt()` call
- Use `resolved.prompt` only

**Files:** `src/commands/imagine.ts`, `src/commands/video.ts`, `src/commands/motion.ts`, `src/commands/music.ts` (edit)

## Task 5: Add tests for `resolvePrompt`

Unit tests covering all 4 resolution cases + edge cases.

**Files:** `src/infra/prompt.test.ts` (create)

## Dependencies

Task 1 → Tasks 2, 3, 4 (parallel) → Task 5
