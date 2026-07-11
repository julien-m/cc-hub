# Changelog — 001-multi-reference-files

## 2026-05-04 — [feature]: Multi-reference files for imagine/video/motion

- **Type:** Feature
- **Spec modified:** No
- **Code modified:**
  - `src/infra/option-collectors.ts` (new): `collect` helper for repeatable Commander options.
  - `src/commands/imagine.ts`: `-i, --image` is now repeatable; references resolved sequentially and flattened into `image_urls`.
  - `src/commands/video.ts`: same change as imagine.
  - `src/commands/motion.ts`: `-i` becomes repeatable with manual `length >= 1` validation; `-v` stays scalar.
  - `tests/infra/option-collectors.test.ts` (new): collector unit tests.
  - `tests/commands/imagine.test.ts` (new): AC-001 / AC-003 (snapshot fixture) / AC-004.
  - `tests/commands/video.test.ts` (new): AC-002 / AC-003 (snapshot fixture) / AC-004.
  - `tests/commands/motion.test.ts` (new): AC-005 / AC-003 (snapshot fixture) / zero-image rejection.
  - `tests/commands/help-text.test.ts` (new): AC-006 — `-i` description contains "repeatable".
  - `tests/commands/__fixtures__/{imagine,video,motion}-single-i.json` (new): byte-identical baseline payloads (FR-006).
  - `README.md`: multi-`-i` example for each affected command + repeatability noted in option tables (AC-007 / FR-008).
  - `.claude/skills/cc-hub/SKILL.md`: skill doc synced with the new repeatable `-i` (project sync-on-change rule).
- **AC impacted:** AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007.
- **Author:** claude-code (livespec-implementer agent)
