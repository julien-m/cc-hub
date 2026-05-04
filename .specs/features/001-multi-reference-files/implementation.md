# Implementation Map — 001-multi-reference-files

## FR → @spec anchor mapping

| Requirement | File | Anchor | Status | Date |
|---|---|---|---|---|
| [FR-001: Repeatable `-i` on imagine](spec.md#fr-001) | `src/commands/imagine.ts` | `@spec FR-001: Repeatable -i on imagine ... — .specs/features/001-multi-reference-files/spec.md#fr-001` | Implemented | 2026-05-04 |
| [FR-001: Shared collector helper](spec.md#fr-001) | `src/infra/option-collectors.ts` | `@spec FR-001: Repeatable -i collector, FR-002, FR-003 — .specs/features/001-multi-reference-files/spec.md#fr-001` | Implemented | 2026-05-04 |
| [FR-002: Repeatable `-i` on video](spec.md#fr-002) | `src/commands/video.ts` | `@spec FR-002: Repeatable -i on video ... — .specs/features/001-multi-reference-files/spec.md#fr-002` | Implemented | 2026-05-04 |
| [FR-003: Repeatable `-i` on motion (N≥1)](spec.md#fr-003) | `src/commands/motion.ts` | `@spec FR-003: Repeatable -i on motion (N>=1) ... — .specs/features/001-multi-reference-files/spec.md#fr-003` | Implemented | 2026-05-04 |
| [FR-004: Resolve + flatten `image_urls`](spec.md#fr-004) | `src/commands/{imagine,video,motion}.ts` | inline anchors above each factory | Implemented | 2026-05-04 |
| [FR-005: Fail-fast on resolve error](spec.md#fr-005) | `src/commands/{imagine,video,motion}.ts` | inline anchors above each factory | Implemented | 2026-05-04 |
| [FR-006: Single-`-i` byte-identical](spec.md#fr-006) | `src/commands/{imagine,video,motion}.ts` + snapshot fixtures | `tests/commands/__fixtures__/*-single-i.json` | Implemented | 2026-05-04 |
| [FR-007: Help text "repeatable"](spec.md#fr-007) | `src/commands/{imagine,video,motion}.ts` (option description) | covered by `tests/commands/help-text.test.ts` | Implemented | 2026-05-04 |
| [FR-008: README multi-`-i` examples](spec.md#fr-008) | `README.md` | imagine/video/motion sections | Implemented | 2026-05-04 |

## AC verification

| AC | Test file | Outcome |
|---|---|---|
| AC-001 | `tests/commands/imagine.test.ts` (`forwards multiple -i ...`) | PASS |
| AC-002 | `tests/commands/video.test.ts` (`forwards multiple -i ...`) | PASS |
| AC-003 | `tests/commands/{imagine,video,motion}.test.ts` (snapshot byte-equivalence vs `__fixtures__/*-single-i.json`) | PASS |
| AC-004 | `tests/commands/{imagine,video}.test.ts` (`failing -i aborts ...`) | PASS |
| AC-005 | `tests/commands/motion.test.ts` (multi-`-i` + zero-`-i` rejected) | PASS |
| AC-006 | `tests/commands/help-text.test.ts` (`-i` block contains "repeatable") | PASS |
| AC-007 | `README.md` — manual grep + `cc-hub` skill examples (sync-on-change) | PASS |

## Files created or modified

- New: `src/infra/option-collectors.ts`
- Modified: `src/commands/imagine.ts`, `src/commands/video.ts`, `src/commands/motion.ts`
- New tests: `tests/infra/option-collectors.test.ts`, `tests/commands/imagine.test.ts`, `tests/commands/video.test.ts`, `tests/commands/motion.test.ts`, `tests/commands/help-text.test.ts`
- New fixtures: `tests/commands/__fixtures__/{imagine,video,motion}-single-i.json`
- Modified docs: `README.md`, `.claude/skills/cc-hub/SKILL.md`
- Spec artifacts: `.specs/features/001-multi-reference-files/{progress,changelog,implementation}.md`, `.specs/changelog.md`

## Test command record

- `bun tsc --noEmit` — clean
- `bun test` — 78 pass / 0 fail / 108 expect() calls / 10 files
- `bunx biome check .` — 0 errors, 5 pre-existing warnings (unrelated to this feature)
