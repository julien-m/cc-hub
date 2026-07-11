---
title: "Implementation - Add GPT-5.6 Sol/Terra/Luna to Codex Provider"
status: Implemented
feature_number: "007"
feature: 007-add-gpt-56-sol-terra-luna-to-codex-provider
spec_ref: .specs/features/007-add-gpt-56-sol-terra-luna-to-codex-provider/spec.md
created: 2026-07-11
updated: 2026-07-11
---

# Implementation - Add GPT-5.6 Sol/Terra/Luna to Codex Provider

## Requirement Mapping

| Requirement | File(s) | @spec Anchor | Status | Last Verified |
|---|---|---|---|---|
| FR-001: Codex 5.6 variants | `src/data/models.ts` | `@spec FR-001: Codex 5.6 variants` | ✅ Implemented | 2026-07-11 |
| FR-002: Default Codex model | `src/commands/codex.ts` | `@spec FR-002: Default Codex model` | ✅ Implemented | 2026-07-11 |
| FR-003: Ultra effort vocabulary | `src/data/models.ts`, `src/services/models.ts` | `@spec FR-003: Ultra effort vocabulary` | ✅ Implemented | 2026-07-11 |
| FR-004: Documentation | `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.agent-sync/skills/cc-hub/references/models.md` | Documentation sections for Codex models and efforts | ✅ Implemented | 2026-07-11 |
| FR-005: Tests | `tests/commands/codex.test.ts`, `tests/services/models.test.ts` | Behavior tests for default, compatibility, provider resolution, and effort mapping | ✅ Implemented | 2026-07-11 |

## Acceptance Criteria Mapping

| AC | Test File | Status |
|---|---|---|
| AC-001 | `tests/commands/codex.test.ts` | ✅ |
| AC-002 | `tests/commands/codex.test.ts` | ✅ |
| AC-003 | `tests/services/models.test.ts` | ✅ |
| AC-004 | `tests/services/models.test.ts` | ✅ |
| AC-005 | `tests/commands/codex.test.ts`, `tests/services/models.test.ts` | ✅ |
| AC-006 | `tests/commands/codex.test.ts`, `tests/services/models.test.ts` | ✅ |
| AC-007 | `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.agent-sync/skills/cc-hub/references/models.md` | ✅ |

## Files Created/Modified

| File | Description |
|---|---|
| `src/data/models.ts` | Adds `ultra` effort and Codex-only GPT-5.6 Sol/Terra/Luna registry entries. |
| `src/commands/codex.ts` | Changes Codex default model to `openai/gpt-5.6-sol`. |
| `tests/commands/codex.test.ts` | Covers Sol default, GPT-5.5 compatibility, Sol ultra, and Luna effort capping. |
| `tests/services/models.test.ts` | Covers provider resolution, OpenRouter unavailability, and effort caps. |
| `README.md` | Documents new Codex default, variants, and effort vocabulary. |
| `.agent-sync/skills/cc-hub/SKILL.md` | Updates cc-hub skill command reference. |
| `.agent-sync/skills/cc-hub/references/models.md` | Updates model reference for Codex. |
