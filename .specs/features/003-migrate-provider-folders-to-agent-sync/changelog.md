# Changelog — Migrate Provider Folders to Agent Sync

## 2026-05-18 — [Spec Update]: Define provider folder migration

- **Type:** Spec Update
- **Spec modified:** Yes (initial spec, plan, progress)
- **Code modified:** No
- **AC impacted:** AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011
- **Author:** Codex

## 2026-05-18 — [Feature]: Implement cc-hub migrate

- **Type:** Feature
- **Spec modified:** Yes (progress, implementation mapping)
- **Code modified:** `src/services/agent-sync-migrate.ts`, `src/commands/migrate.ts`, `src/cli.ts`, `tests/services/agent-sync-migrate.test.ts`, `tests/commands/agent-sync-cli.test.ts`, `README.md`, `.agent-sync/skills/cc-hub/SKILL.md`
- **AC impacted:** AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011
- **Author:** Codex

## 2026-05-18 — Check: Spec-code alignment verified

- **Type:** Spec Update
- **Spec modified:** No
- **Code modified:** None
- **Coverage:** 12/12 FR verified (100%), 11/11 AC verified (100%), 0 partial, 0 missing
- **Report:** `checks/2026-05-18.md`
- **Author:** /spec.check

## 2026-05-18 — [Spec Update]: AC table reformatted to Given/When/Then

- **Type:** Spec Update
- **Spec modified:** Yes (`spec.md` — Acceptance Criteria table)
- **Code modified:** No
- **AC impacted:** AC-001 through AC-011 (format only, semantics unchanged)
- **Author:** /spec.check (follow-up)
