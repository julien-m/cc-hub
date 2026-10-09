# Changelog

> Global changelog for cc-hub. One entry per spec command that creates or modifies an artifact.
> Read-only commands (`/spec.explain`, `/spec.status`) are exempt.

---

## 2026-10-09 — [Feature 010] Feature: Register four source-backed OpenRouter text models
<!-- finalize:spec-feature:2026-10-09:ee1c68ea -->

## 2026-10-09 — [Feature 009] Registry finalized after filtered FR-004 audit48 correction; AC-005 native PASS, broader parent certification pending
<!-- finalize:spec-fix:2026-10-09:d3c8441c -->

## 2026-10-09 — [Feature 009] Fix: Four audit48 quality gaps closed; filtered FR-004 / AC-005 native PASS

- Read [current gap report](features/009-decision-models/checks/2026-10-09.md) and [implementation mapping](features/009-decision-models/implementation.md). FullBun264PASS; ordinary0098PASS1scopeSKIP; no new isolated delivery or publication.

## 2026-10-09 — [Feature 009] Check: After correction,5/6FR and7/8AC verified

- Read [current gap report](features/009-decision-models/checks/2026-10-09.md): three009 convention gaps and formatter gate coverage resolved; ordinary8PASS1SKIP, filtered nativeAC005 observation1PASS/25assertions. No new full009 isolation certificate; two separate registry warnings and nine nativeadvisories remain.

## 2026-10-09 — [Feature 009] Check: Current alignment5/6FR,7/8AC; convention corrections pending

- Read [current gap report](features/009-decision-models/checks/2026-10-09.md): ordinary8PASS1scopeSKIP;75-line validator/defaultformat/H2 gaps. No new isolated009 certificate.

## 2026-10-09 — [Feature 010] Test: 100% AC covered(8/8), 0 tests generated

- Read [the independent Test report](features/010-model-catalog-update/checks/2026-10-09-test.md) for actual264Bun/8native acceptance/strict types and compatibility boundaries.

## 2026-10-09 — [Feature 010] Feature: Register four source-backed OpenRouter text models
<!-- finalize:spec-implement:2026-10-09:9604b97a -->

## 2026-10-08 — [Feature 010] Plan review after acceptance format repair
<!-- finalize:spec-feature:2026-10-08:a0cacc53 -->

## 2026-10-08 — [Feature 010] Plan revalidated after AC heading normalization — 4 implementation steps, 1 sequence; existing plan content preserved, runtime evidence pending
<!-- finalize:spec-plan:2026-10-08:aeebb87f -->

## 2026-10-08 — [Feature 010] Spec AC format normalized: eight native-supported headings; unchanged semantics, current independent review and plan readiness
<!-- finalize:spec-specify:2026-10-08:87d5b083 -->

## 2026-10-08 — Approved current four-model catalog plan after complete source-bound review; implementation remains pending.
<!-- finalize:spec-feature:2026-10-08:7793aa77 -->

## 2026-10-08 — [Feature 010] Plan revalidated for current candidate: Text Model Catalog Update — 4 implementation steps, 1 sequence diagram; runtime evidence pending
<!-- finalize:spec-plan:2026-10-08:74cb4620 -->

## 2026-10-08 — [Feature 010] Spec revalidated: Text Model Catalog Update — 3 stories, 8 AC, 6 FR; current complete source-bound review and plan readiness
<!-- finalize:spec-specify:2026-10-08:b6264089 -->

## 2026-10-08 — Feature 009: Generic Luna/Jev Decisions
<!-- finalize:spec-feature:2026-10-08:a972c7a8 -->

## 2026-10-08 — Spec Update: Feature 009 source-backed validation and exact delivery scope
<!-- finalize:spec-implement:2026-10-08:01c83b0f -->

## 2026-10-08 — Spec Update: Feature 009 final audit documentation and formatter gate
<!-- finalize:spec-implement:2026-10-08:93bb16e4 -->

## 2026-10-08 — Feature 009: Generic Luna/Jev Decisions
<!-- finalize:spec-implement:2026-10-08:7b95579a -->

- Test: 100% AC covered (8/8), 0 generated tests; native 9 PASS / 99 assertions, Bun 247 PASS. Read [historical Test report](features/009-decision-models/checks/2026-10-08-test.md).

## 2026-10-01 — [feature]: Feature 008 Jev OpenRouter Decisions

- **Type:** Feature
- **Author:** Codex
- **Artifacts:** Read [specification](features/008-jev-openrouter/spec.md) and [implementation mapping](features/008-jev-openrouter/implementation.md).
- **Notes:** Dedicated decide/jev command, choice/score/noul request contract, complete JSON output, OpenRouter-only decision registry, guarded chat routes and synchronized documentation. APEX explicitly selected by user.

---

## 2026-07-11 — [feature]: Feature 007 implemented: Add GPT-5.6 Sol/Terra/Luna to Codex Provider

- **Type:** Feature implementation
- **Author:** Codex
- **Artifacts:** `src/data/models.ts`, `src/commands/codex.ts`, `tests/commands/codex.test.ts`, `tests/services/models.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.agent-sync/skills/cc-hub/references/models.md`, `.specs/features/007-add-gpt-56-sol-terra-luna-to-codex-provider/{spec,plan,progress,implementation,changelog}.md`
- **Notes:** Added Codex-only GPT-5.6 Sol/Terra/Luna entries, changed the Codex default to Sol, kept GPT-5.5 compatibility, and added `ultra` as an opt-in effort capability with Luna capped to `max`.

---

## 2026-06-30 — [feature]: Feature 006 implemented: Agent sync hooks

- **Type:** Feature implementation
- **Author:** Codex
- **Artifacts:** `src/services/agent-sync-hooks.ts`, `src/commands/hook.ts`, `src/commands/sync.ts`, `src/cli.ts`, `tests/services/agent-sync-hooks.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.specs/features/006-agent-sync-hooks/{spec,plan,progress,implementation,changelog}.md`
- **Notes:** Added first-class `.agent-sync/hooks` / `~/.agent-sync/hooks` SessionStart hook sync for Claude Code and Codex, idempotent JSON config merge, status/repair/unlink lifecycle, aggregate sync inclusion, and isolated tests for config preservation and non-overwrite behavior.

---

## 2026-05-18 — [bugfix]: Codex agent generation ignores Claude-only models

- **Type:** Bugfix
- **Author:** Codex
- **Artifacts:** `src/services/agent-sync.ts`, `tests/services/agent-sync.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/{spec,implementation,changelog}.md`
- **Notes:** Generated `codex.toml` files now omit Claude-only agent models (`haiku`, `sonnet`, `opus`, Claude IDs) while preserving Codex-native models and translating supported OpenAI canonical IDs.

---

## 2026-05-18 — [feature]: Feature 005 implemented: Migration output root override

- **Type:** Feature implementation
- **Author:** Codex
- **Artifacts:** `src/commands/migrate.ts`, `src/services/agent-sync-migrate.ts`, `src/services/agent-sync.ts`, `src/services/agent-sync-rules.ts`, `tests/services/agent-sync-migrate.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.specs/features/005-migration-output-root-override/{spec,plan,progress,implementation,changelog}.md`
- **Notes:** Added `--output <dir>` for folder and targeted migrations so canonical migrated skills, agents, and rules can be written to a custom agent-sync root while `--scope` continues to control provider output publication.

---

## 2026-05-18 — [feature]: Feature 004 implemented: Portable agent-sync rules

- **Type:** Feature implementation
- **Author:** Codex
- **Artifacts:** `src/services/agent-sync-rules.ts`, `src/services/agent-sync-migrate.ts`, `src/commands/rule.ts`, `src/commands/migrate.ts`, `src/commands/sync.ts`, `tests/services/agent-sync-rules.test.ts`, `tests/services/agent-sync-migrate.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.specs/features/004-portable-agent-sync-rules/{spec,plan,progress,implementation,changelog}.md`
- **Notes:** Added canonical project/global `.agent-sync/rules` registries, generated Claude `.claude/rules` outputs, managed Codex `AGENTS.md` blocks, individual rule links, namespaced global links, Claude rule migration, and aggregate sync/status/repair coverage for rules.

---

## 2026-05-18 — [check]: Feature 002 + 003 spec-code alignment verified

- **Type:** Check
- **Author:** /spec.check
- **Summary:** [Feature 002] 100% verified (12/12 FR, 12/12 AC); [Feature 003] 100% verified (12/12 FR, 11/11 AC). Reports saved under each feature's `checks/2026-05-18.md`. Verification: `bun tsc --noEmit` ✅, targeted tests 20/20 pass.

---

## 2026-05-18 — [feature]: Feature 003 implemented: Migrate provider folders to agent-sync

- **Type:** Feature implementation
- **Author:** Codex
- **Artifacts:** `src/services/agent-sync-migrate.ts`, `src/commands/migrate.ts`, `src/cli.ts`, `tests/services/agent-sync-migrate.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`, `.specs/features/003-migrate-provider-folders-to-agent-sync/{spec,plan,progress,implementation,changelog}.md`
- **Notes:** Added `cc-hub migrate` folder imports for `.claude` and `.codex`, targeted skill/agent/command migrations, Claude command to skill conversion, dry-run reporting, and conflict protection.

---

## 2026-05-17 — [feature]: Feature 002 implemented: Multi-provider agent sync for Claude and Codex

- **Type:** Feature implementation
- **Author:** Codex
- **Artifacts:** `src/services/agent-sync.ts`, `src/commands/{skill,agent,sync}.ts`, `tests/services/agent-sync.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agents/skills/cc-hub/SKILL.md`, `.specs/features/002-multi-provider-agent-sync-for-claude-and-codex-skills-and-agents/{spec,plan,progress,implementation,changelog}.md`
- **Notes:** Added `.agent-sync` canonical skill/agent sources, Claude/Codex symlinks, provider-native agent rendering, status/repair/sync commands, isolated tests, and real smoke verification.

---

## 2026-05-04 — [feature]: Feature 001 implemented: Multi-reference files for imagine/video/motion

- **Type:** Feature implementation
- **Author:** spec.implement (livespec-implementer agent)
- **Artifacts:** `src/infra/option-collectors.ts`, `src/commands/{imagine,video,motion}.ts`, `tests/infra/option-collectors.test.ts`, `tests/commands/{imagine,video,motion,help-text}.test.ts`, `tests/commands/__fixtures__/*-single-i.json`, `README.md`, `.claude/skills/cc-hub/SKILL.md`, `.specs/features/001-multi-reference-files/{progress,implementation,changelog}.md`
- **Notes:** `imagine`, `video`, `motion` now accept repeated `-i, --image`. Single-`-i` payload remains byte-identical to the pre-feature shape (FR-006), enforced by snapshot fixtures.

---

## 2026-04-14 — [setup]: LiveSpec initialized via `spec.init --from-code`

- **Type:** Setup
- **Author:** spec.init
- **Artifacts created:** `spec-system.md`, `constitution.md`, `project.md`, `stacks/_default.md`, 4 ADRs, `testing/strategy.md`, `design/`, `features/`, `roadmap.md`, `README.md`, `preflight.md`
- **Notes:** Reverse-engineered from existing codebase. All 19 features detected as implemented. bootstrap-recap.md validated and moved to `.specs/bootstrap-recap.md`.

---

*Maintained automatically by LiveSpec commands. Do not remove this file.*
