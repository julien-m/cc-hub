# Changelog - 009-decision-models

## 2026-10-07 — Spec Update

- **Spec modified:** Yes (created all sections)
- **Code modified:** None
- **AC impacted:** AC-001 through AC-008
- **Author:** Codex spec-specify
- **Summary:** Generic decision model selection adds Luna alongside Jev; 3 stories, 8 AC, 6 FR. Current source-backed independent review complete/ready; Clarify ready.
- **Artifacts:** Read [specification](spec.md) and [technical plan](plan.md). Historical independent review and clarification concluded complete/ready; their raw artifacts remain local and are not required to read this checkout.

<!-- finalize:spec-specify:2026-10-07:60166c69 -->

## 2026-10-07 — Feature

- **Spec modified:** No normative change (lifecycle Planned)
- **Code modified:** None (plan.md created)
- **AC impacted:** AC-001 through AC-008 (planned coverage)
- **Author:** Codex spec-plan
- **Summary:** Five focused steps, one sequence diagram; generic capability resolver and complete native JSON, per-model bounds, Bun/mock/CLI gates and isolated delivery.
- **Artifacts:** Read [technical plan](plan.md) and [source snapshot](contracts/openrouter-decisions-source.json).

<!-- finalize:spec-plan:2026-10-07:93134545 -->

## 2026-10-08 — Feature

- **Spec modified:** No normative change (Planned retained)
- **Code modified:** None (source-backed plan reused)
- **AC impacted:** AC-001 through AC-008 (planned coverage)
- **Author:** Codex spec-plan
- **Summary:** Resume five-step technical plan and one sequence diagram with current spec readiness; refresh independent plan review using native model gpt-6 and 400000-character budget. No implementation or runtime certification claimed.
- **Artifacts:** Read [technical plan](plan.md) and [source snapshot](contracts/openrouter-decisions-source.json).

<!-- finalize:spec-plan:2026-10-08:8ceee353 -->

## 2026-10-08 — Feature: Generic Luna/Jev Decisions

- **Type:** Feature
- **Spec modified:** Lifecycle only; normative requirements unchanged.
- **Code modified:** Generic catalog/aliases/capabilities, selected model validation and guard, help/docs, Bun fixtures and Python native acceptance witness. Bound generation catalog extraction preserves all prior model objects/order and meets file-length convention.
- **AC impacted:** AC-001–AC-008 with independent assertion mapping and native local execution; external inference and parent Git delivery remain separate.
- **Author:** Codex native worker.

<!-- finalize:spec-implement:2026-10-08:7b95579a -->

## 2026-10-08 — Spec Update: Independent Test009

- Type: Spec Update; spec modified: No; code modified: none; generated0.
- Coverage8/8AC (100%); native9PASS/99observed assertions; Bun247PASS; TypeScript/Biome90/RuffPASS.
- Read [independent Test report](checks/2026-10-08-test.md). Scope certification explicitly enabled before010; no publication or live inference.

## 2026-10-08 — Spec Update: Final audit documentation and formatter gate

- **Type:** Spec Update
- **Spec modified:** No normative requirement change; canonical documentation and registry formatting repaired.
- **Code modified:** None; conventions gate now enforces Biome formatting and linting.
- **AC impacted:** AC-008 gate configuration; historical AC-001–AC-008 evidence retained without a new certification claim.
- **Author:** Codex, parent-supervised final audit repair.
- **Artifacts:** Read [audit adjudication](checks/2026-10-08-final-audit.md) and [historical Test report](checks/2026-10-08-test.md).
- **Boundary:** Parent control audit and post-audit native capture follow this repair; earlier goals and receipts remain historical.

<!-- finalize:spec-implement:2026-10-08:93bb16e4 -->

## 2026-10-08 — Spec Update: Source-backed validation and exact delivery scope

- **Type:** Spec Update
- **Spec modified:** Edge-case clarification only; reject padded selectors and preserve schema-valid finite scores.
- **Code modified:** Pre-auth selector rejection, finite-score response validation, exact public delivery scope and explicit complex test fixture types.
- **AC impacted:** AC-002, AC-004, AC-005, AC-006, AC-008; current local tests pass, historical receipts retained without being asserted fresh.
- **Author:** Codex, parent-supervised control-audit repair.
- **Artifacts:** Read [control-audit decisions](checks/2026-10-08-final-audit.md) and [implementation mapping](implementation.md).
- **Boundary:** Parent re-audit and fresh native certification remain pending; no live inference or publication.

<!-- finalize:spec-implement:2026-10-08:01c83b0f -->

## 2026-10-08 — Feature: Generic Luna/Jev Decisions

- **Type:** Feature
- **Spec modified:** Lifecycle only; normative requirements unchanged.
- **Code modified:** Generic decision catalog, aliases and model selection; full native JSON transport and model-specific validation; synchronized CLI help/documentation and local contract tests.
- **AC impacted:** AC-001–AC-008; independent local acceptance and regression results are recorded separately from live inference and Git publication.
- **Author:** Codex, parent-supervised LiveSpec pipeline.
- **Artifacts:** Read [implementation mapping](implementation.md), [Test report](checks/2026-10-08-test.md) and [audit decisions](checks/2026-10-08-final-audit.md).

<!-- finalize:spec-feature:2026-10-08:a972c7a8 -->

## 2026-10-08 — Bugfix: Complete Decisions help through pipes

- **Type:** Bugfix
- **Spec modified:** No new requirement; plan records the bounded AC-007 exit-boundary repair and exact 38-path delivery scope.
- **Code modified:** Read [decide factory](../../../src/commands/decide.ts), [entry point](../../../bin/cc-hub.ts), [pipe regression](../../../tests/commands/decide.test.ts) and [acceptance harness](../../../tests/acceptance/decision-models-acceptance.py).
- **AC impacted:** AC-007 and AC-008; Commander codes are retained while Bun drains queued help, with no stdout mock or transport change.
- **Author:** Codex, parent-supervised AC-007 repair.
- **Results:** Real candidate help is complete (1704 bytes) in five observed pipe executions. Local Bun 249 PASS, focused 17 PASS, pytest opt-in 9 PASS, TypeScript/Biome/Ruff exit 0. Globally installed older CLI remains unchanged; installed-help acceptance resolves a candidate symlink through explicit local PATH.
- **Boundary:** Failed receipt `62a340e80bf64c3297fcea8cf4f4be71` is preserved. New plan/mapping reviews, parent audit and fresh capture are separate from prior certification. Read [implementation mapping](implementation.md).

## 2026-10-09 — Check: Current combined009/010 alignment before audit correction

- **Type:** Spec Update
- **Spec modified:** No
- **Code modified:** None
- **Coverage:** Five of six FR functionally verified, one delivery-partial; seven of eight AC locally verified, one isolated-scope partial. Actual ordinarypytest8PASS1SKIP; no new full acceptance certificate.
- **Gaps:** Validator75>hard60, defaultRuff formatting, historicaldatedH3; rootgate and registry issues separately owned.
- **Report:** Read [current gap report](checks/2026-10-09.md).
- **Author:** Codex independent spec-check.

## 2026-10-09 — Check: After correction, current alignment verified

- **Type:** Spec Update
- **Spec modified:** No
- **Code modified:** None by this independent check
- **Coverage:** Five of six FR verified, one delivery-partial; seven of eight AC locally verified, one isolated-scope partial. Ordinary8PASS1SKIP; native filteredAC005 observation1PASS/25assertions precedes metadata publication.
- **Corrections:** Validator31/helper50/maxarrow59; runner408/max56 and boundary445/max53; defaultRuff4filesPASS; datedH2 and executedformatter gate resolved. Zero009 hard blocker; nine nativeadvisories and two globalregistrywarnings remain.
- **Report:** Read [current gap report](checks/2026-10-09.md).
- **Author:** Codex independent spec-check, goalcfaea6e5.

## 2026-10-09 — Fix: Audit48 convention corrections, FR-004 / AC-005 subset

- **Type:** Bug Fix; normative specification unchanged; no visual correction.
- **Code modified:** Pure question-validation helper in the existing decision service; default Ruff formatting and fixture extraction for the existing Python acceptance runner. No assertion or historical compatibility oracle was replaced.
- **Quality gaps closed:** Validator75→31 lines (helper50; all TypeScript functions≤59), runner408/max56 and boundary445/max53, canonical H2 dated headings, and repository-wide Ruff lint/format enforcement in the native executed lint group; hard500/60 limits retained.
- **Acceptance:** Exact FR-004 selection certifies AC-005 only through four grounded bindings, one native passing test and25 observed assertions. Ordinary009 regression:8PASS1scopeSKIP; fullBun264PASS/1056 assertions, affected93PASS/490, strict types/Biome/Ruff lint/defaultformatPASS.
- **Remaining:** Other acceptance criteria and isolated009 delivery were not newly certified by this filtered fix. Parent owns full combined009/010 re-audit, fresh certification and publication; existing001 registry warning remains explicit.
- **Author:** Codex spec-fix, independent post-fix spec-check.
- **Artifacts:** Read [current gap report](checks/2026-10-09.md), [implementation mapping](implementation.md) and [audit adjudication](checks/2026-10-08-final-audit.md). Raw reviews, failed attempts, capture receipts and native archives remain local; public reports do not depend on ignored files.

## 2026-10-09 — Registry finalization: filtered FR-004 / AC-005 audit48 fix

- Normative specification and historical Implemented status retained. This command certifies only AC-005, with one passing native test and25 observed assertions.
- Read [current gap report](checks/2026-10-09.md), [implementation mapping](implementation.md) and [audit adjudication](checks/2026-10-08-final-audit.md) for the four quality corrections and remaining scope boundaries.
- Parent full combined009/010 audit, fresh certification and Git publication remain separate.

<!-- finalize:spec-fix:2026-10-09:d3c8441c -->
