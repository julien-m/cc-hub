# Implementation Plan: Spinner Utility

## Task 1: Create `src/infra/spinner.ts`

Create the `Spinner` class with start/update/succeed/fail/stop methods.

**Files:** `src/infra/spinner.ts` (create)

## Task 2: Add `onProgress` callback to `poyo-media.ts`

Add optional `onProgress` parameter to `generateMedia` and `pollTask`. Call it when progress is reported instead of `console.error`.

**Files:** `src/services/poyo-media.ts` (edit)

## Task 3: Refactor `ask.ts` to use Spinner

Replace inline spinner code with `Spinner` class. Keep elapsed time counter.

**Files:** `src/commands/ask.ts` (edit)

## Task 4: Refactor media commands to use Spinner

Replace `console.error` status messages with Spinner in imagine, video, motion, music.

**Files:** `src/commands/imagine.ts`, `src/commands/video.ts`, `src/commands/motion.ts`, `src/commands/music.ts` (edit)

## Task 5: Add tests for Spinner

Test start/update/succeed/fail/stop lifecycle, non-TTY fallback.

**Files:** `src/infra/spinner.test.ts` (create)

## Dependencies

Task 1 + Task 2 (parallel) → Task 3 + Task 4 (parallel) → Task 5
