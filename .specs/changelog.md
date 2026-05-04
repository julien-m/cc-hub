# Changelog

> Global changelog for cc-hub. One entry per spec command that creates or modifies an artifact.
> Read-only commands (`/spec.explain`, `/spec.status`) are exempt.

---

## 2026-05-04 — Feature 001 implemented: Multi-reference files for imagine/video/motion

- **Type:** Feature implementation
- **Author:** spec.implement (livespec-implementer agent)
- **Artifacts:** `src/infra/option-collectors.ts`, `src/commands/{imagine,video,motion}.ts`, `tests/infra/option-collectors.test.ts`, `tests/commands/{imagine,video,motion,help-text}.test.ts`, `tests/commands/__fixtures__/*-single-i.json`, `README.md`, `.claude/skills/cc-hub/SKILL.md`, `.specs/features/001-multi-reference-files/{progress,implementation,changelog}.md`
- **Notes:** `imagine`, `video`, `motion` now accept repeated `-i, --image`. Single-`-i` payload remains byte-identical to the pre-feature shape (FR-006), enforced by snapshot fixtures.

---

## 2026-04-14 — Setup: LiveSpec initialized via `spec.init --from-code`

- **Type:** Setup
- **Author:** spec.init
- **Artifacts created:** `spec-system.md`, `constitution.md`, `project.md`, `stacks/_default.md`, 4 ADRs, `testing/strategy.md`, `design/`, `features/`, `roadmap.md`, `README.md`, `preflight.md`
- **Notes:** Reverse-engineered from existing codebase. All 19 features detected as implemented. bootstrap-recap.md validated and moved to `.specs/bootstrap-recap.md`.

---

*Maintained automatically by LiveSpec commands. Do not remove this file.*
